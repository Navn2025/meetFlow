// hooks/useMediasoup.js
// Custom hook for mediasoup WebRTC functionality

import {useState, useRef, useCallback, useEffect} from "react";
import * as mediasoupClient from "mediasoup-client";
import {socket} from "../socket/socket.js";

// Simulcast encodings for adaptive quality
const SIMULCAST_ENCODINGS=[
    {rid: "r0", maxBitrate: 100000, scaleResolutionDownBy: 4},
    {rid: "r1", maxBitrate: 300000, scaleResolutionDownBy: 2},
    {rid: "r2", maxBitrate: 900000, scaleResolutionDownBy: 1},
];

export const useMediasoup=(roomId) =>
{
    // State
    const [device, setDevice]=useState(null);
    const [connectionState, setConnectionState]=useState("disconnected");
    const [producers, setProducers]=useState(new Map());
    const [consumers, setConsumers]=useState(new Map());

    // Refs for stable references
    const deviceRef=useRef(null);
    const sendTransportRef=useRef(null);
    const recvTransportRef=useRef(null);
    const producersRef=useRef(new Map());
    const consumersRef=useRef(new Map());

    // Socket request helper
    const socketRequest=useCallback((event, data={}) =>
    {
        return new Promise((resolve, reject) =>
        {
            const timeout=setTimeout(() =>
            {
                reject(new Error(`Request timeout: ${event}`));
            }, 10000);

            socket.emit(event, data, (response) =>
            {
                clearTimeout(timeout);
                if (response?.error)
                {
                    reject(new Error(response.error));
                } else
                {
                    resolve(response);
                }
            });
        });
    }, []);

    // Initialize mediasoup device
    const initDevice=useCallback(async (rtpCapabilities) =>
    {
        const newDevice=new mediasoupClient.Device();
        await newDevice.load({routerRtpCapabilities: rtpCapabilities});
        deviceRef.current=newDevice;
        setDevice(newDevice);
        return newDevice;
    }, []);

    // Create send transport
    const createSendTransport=useCallback(async () =>
    {
        if (!deviceRef.current) throw new Error("Device not initialized");

        const params=await socketRequest("createTransport", {roomId, type: "send"});
        const transport=deviceRef.current.createSendTransport(params);

        transport.on("connect", async ({dtlsParameters}, callback, errback) =>
        {
            try
            {
                await socketRequest("connectTransport", {
                    transportId: transport.id,
                    dtlsParameters,
                });
                callback();
            } catch (err)
            {
                errback(err);
            }
        });

        transport.on("produce", async ({kind, rtpParameters, appData}, callback, errback) =>
        {
            try
            {
                const response=await socketRequest("produce", {
                    transportId: transport.id,
                    kind,
                    rtpParameters,
                    appData,
                });
                callback({id: response.id});
            } catch (err)
            {
                errback(err);
            }
        });

        transport.on("connectionstatechange", (state) =>
        {
            console.log(`📡 Send transport: ${state}`);
            if (state==="failed") transport.close();
        });

        sendTransportRef.current=transport;
        return transport;
    }, [roomId, socketRequest]);

    // Create receive transport
    const createRecvTransport=useCallback(async () =>
    {
        if (!deviceRef.current) throw new Error("Device not initialized");

        const params=await socketRequest("createTransport", {roomId, type: "recv"});
        const transport=deviceRef.current.createRecvTransport(params);

        transport.on("connect", async ({dtlsParameters}, callback, errback) =>
        {
            try
            {
                await socketRequest("connectTransport", {
                    transportId: transport.id,
                    dtlsParameters,
                });
                callback();
            } catch (err)
            {
                errback(err);
            }
        });

        transport.on("connectionstatechange", (state) =>
        {
            console.log(`📡 Recv transport: ${state}`);
            if (state==="failed") transport.close();
        });

        recvTransportRef.current=transport;
        return transport;
    }, [roomId, socketRequest]);

    // Produce media
    const produce=useCallback(async (track, options={}) =>
    {
        if (!sendTransportRef.current) throw new Error("Send transport not ready");

        const {kind}=track;
        const produceOptions={
            track,
            appData: options.appData||{},
        };

        // Add simulcast for video
        if (kind==="video"&&!options.appData?.source)
        {
            produceOptions.encodings=SIMULCAST_ENCODINGS;
            produceOptions.codecOptions={
                videoGoogleStartBitrate: 1000,
            };
        }

        // Add audio options
        if (kind==="audio")
        {
            produceOptions.codecOptions={
                opusStereo: true,
                opusDtx: true,
            };
        }

        const producer=await sendTransportRef.current.produce(produceOptions);

        producersRef.current.set(options.type||kind, producer);
        setProducers(new Map(producersRef.current));

        producer.on("trackended", () =>
        {
            console.log(`🎤 Track ended: ${kind}`);
        });

        return producer;
    }, []);

    // Consume producer
    const consume=useCallback(async (producerId, peerId) =>
    {
        if (!recvTransportRef.current||!deviceRef.current)
        {
            throw new Error("Transport or device not ready");
        }

        const response=await socketRequest("consume", {
            producerId,
            rtpCapabilities: deviceRef.current.rtpCapabilities,
        });

        const consumer=await recvTransportRef.current.consume({
            id: response.id,
            producerId: response.producerId,
            kind: response.kind,
            rtpParameters: response.rtpParameters,
        });

        // Resume on server
        await socketRequest("resumeConsumer", {consumerId: consumer.id});

        consumersRef.current.set(producerId, {consumer, peerId, kind: response.kind});
        setConsumers(new Map(consumersRef.current));

        return consumer;
    }, [socketRequest]);

    // Pause producer
    const pauseProducer=useCallback(async (type) =>
    {
        const producer=producersRef.current.get(type);
        if (producer&&!producer.paused)
        {
            await producer.pause();
            await socketRequest("pauseProducer", {producerId: producer.id});
        }
    }, [socketRequest]);

    // Resume producer
    const resumeProducer=useCallback(async (type) =>
    {
        const producer=producersRef.current.get(type);
        if (producer&&producer.paused)
        {
            await producer.resume();
            await socketRequest("resumeProducer", {producerId: producer.id});
        }
    }, [socketRequest]);

    // Close producer
    const closeProducer=useCallback(async (type) =>
    {
        const producer=producersRef.current.get(type);
        if (producer)
        {
            await socketRequest("closeProducer", {producerId: producer.id});
            producer.close();
            producersRef.current.delete(type);
            setProducers(new Map(producersRef.current));
        }
    }, [socketRequest]);

    // Close consumer
    const closeConsumer=useCallback((producerId) =>
    {
        const consumerData=consumersRef.current.get(producerId);
        if (consumerData)
        {
            consumerData.consumer.close();
            consumersRef.current.delete(producerId);
            setConsumers(new Map(consumersRef.current));
        }
    }, []);

    // Set consumer preferred layers (for simulcast)
    const setConsumerLayers=useCallback(async (consumerId, spatialLayer, temporalLayer) =>
    {
        await socketRequest("setConsumerPreferredLayers", {
            consumerId,
            spatialLayer,
            temporalLayer,
        });
    }, [socketRequest]);

    // Join room
    const joinRoom=useCallback(async (token, userName) =>
    {
        setConnectionState("connecting");

        try
        {
            const response=await socketRequest("joinRoom", {token, roomId, userName});

            // Initialize device
            await initDevice(response.routerRtpCapabilities);

            // Create transports
            await createSendTransport();
            await createRecvTransport();

            setConnectionState("connected");

            return response;
        } catch (err)
        {
            setConnectionState("failed");
            throw err;
        }
    }, [roomId, initDevice, createSendTransport, createRecvTransport, socketRequest]);

    // Leave room
    const leaveRoom=useCallback(async () =>
    {
        // Close all producers
        producersRef.current.forEach((producer) =>
        {
            try {producer.close();} catch { /* ignore */}
        });
        producersRef.current.clear();

        // Close all consumers
        consumersRef.current.forEach(({consumer}) =>
        {
            try {consumer.close();} catch { /* ignore */}
        });
        consumersRef.current.clear();

        // Close transports
        if (sendTransportRef.current)
        {
            sendTransportRef.current.close();
            sendTransportRef.current=null;
        }
        if (recvTransportRef.current)
        {
            recvTransportRef.current.close();
            recvTransportRef.current=null;
        }

        await socketRequest("leaveRoom");
        setConnectionState("disconnected");
    }, [socketRequest]);

    // Cleanup on unmount
    useEffect(() =>
    {
        const currentProducers=producersRef.current;
        const currentConsumers=consumersRef.current;
        const currentSendTransport=sendTransportRef.current;
        const currentRecvTransport=recvTransportRef.current;

        return () =>
        {
            currentProducers.forEach((producer) =>
            {
                try {producer.close();} catch { /* ignore */}
            });
            currentConsumers.forEach(({consumer}) =>
            {
                try {consumer.close();} catch { /* ignore */}
            });
            if (currentSendTransport) currentSendTransport.close();
            if (currentRecvTransport) currentRecvTransport.close();
        };
    }, []);

    return {
        device,
        connectionState,
        producers,
        consumers,
        joinRoom,
        leaveRoom,
        produce,
        consume,
        pauseProducer,
        resumeProducer,
        closeProducer,
        closeConsumer,
        setConsumerLayers,
        socketRequest,
    };
};

export default useMediasoup;
