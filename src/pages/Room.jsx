// Room.jsx - Production-ready video conferencing room for 100+ users
// Modern Black & White Theme
import {useEffect, useState, useRef, useCallback} from "react";
import {useParams, useNavigate} from "react-router-dom";
import {socket} from "../socket/socket.js";
import * as mediasoupClient from "mediasoup-client";
import
{
    MicIcon,
    MicOffIcon,
    VideoIcon,
    VideoOffIcon,
    ScreenShareIcon,
    ScreenShareOffIcon,
    HandRaisedIcon,
    ChatIcon,
    UsersIcon,
    CloseIcon,
    PhoneOffIcon,
    HostIcon,
} from "../components/icons/Icons.jsx";
import {useDispatch} from "react-redux";
import {deleteRoom} from "../../src/store/room.slice.js";

// Video quality presets for different scenarios
const VIDEO_CONSTRAINTS={
    low: {width: 320, height: 180, frameRate: 15},
    medium: {width: 640, height: 360, frameRate: 24},
    high: {width: 1280, height: 720, frameRate: 30},
};

// Simulcast encodings for adaptive quality
const SIMULCAST_ENCODINGS=[
    {rid: "r0", maxBitrate: 100000, scaleResolutionDownBy: 4},
    {rid: "r1", maxBitrate: 300000, scaleResolutionDownBy: 2},
    {rid: "r2", maxBitrate: 900000, scaleResolutionDownBy: 1},
];

const Room=() =>
{
    const {roomId}=useParams();
    const navigate=useNavigate();
    const dispatch=useDispatch();

    // Mediasoup state
    const [consumers, setConsumers]=useState(new Map());
    const [localStream, setLocalStream]=useState(null);

    // UI state
    const [participants, setParticipants]=useState([]);
    const [isCameraOn, setIsCameraOn]=useState(false);
    const [isMicOn, setIsMicOn]=useState(false);
    const [isScreenSharing, setIsScreenSharing]=useState(false);
    const [isHandRaised, setIsHandRaised]=useState(false);
    const [connectionState, setConnectionState]=useState("connecting");
    const [chatMessages, setChatMessages]=useState([]);
    const [chatInput, setChatInput]=useState("");
    const [showChat, setShowChat]=useState(false);
    const [showParticipants, setShowParticipants]=useState(false);
    const [videoQuality]=useState("medium");
    const [isOwner, setIsOwner]=useState(false);
    const [isMobile, setIsMobile]=useState(false);

    // Refs
    const localVideoRef=useRef(null);
    const deviceRef=useRef(null);
    const sendTransportRef=useRef(null);
    const recvTransportRef=useRef(null);
    const consumersRef=useRef(new Map());
    const producersRef=useRef(new Map());
    const isInitializedRef=useRef(false);

    const socketRequest=useCallback((event, data={}) =>
    {
        return new Promise((resolve, reject) =>
        {
            const timeout=setTimeout(() =>
            {
                reject(new Error(`Socket request timeout: ${event}`));
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

    // Detect mobile viewport and react to resize
    useEffect(() =>
    {
        const handleResize=() =>
        {
            try
            {
                setIsMobile(window.innerWidth<640);
            } catch { /* ignore */}
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // =========================================================
    // DISPLAY REMOTE MEDIA
    // =========================================================
    const displayRemoteMediaRef=useRef(null);

    const displayRemoteMedia=useCallback((producerId, consumer, peerId, kind, userName) =>
    {
        const containerId=`container-${peerId}`;
        let container=document.getElementById(containerId);

        // Use provided userName or fall back to participants lookup or peerId
        let displayName=userName;
        if (!displayName)
        {
            const participant=participants.find(p => p.socketId===peerId||p.peerId===peerId);
            displayName=participant?.userName||peerId.slice(-6);
        }

        // Get video grid - retry if not found
        const videoGrid=document.getElementById("video-grid");
        if (!videoGrid)
        {
            console.error("Video grid not found, retrying in 100ms");
            setTimeout(() =>
            {
                if (displayRemoteMediaRef.current)
                {
                    displayRemoteMediaRef.current(producerId, consumer, peerId, kind, userName);
                }
            }, 100);
            return;
        }

        // For audio-only, we still need a container but we'll add placeholder
        // Create container if doesn't exist
        if (!container)
        {
            container=document.createElement("div");
            container.id=containerId;
            container.className="relative bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden aspect-video flex items-center justify-center";

            // Add placeholder avatar for when there's no video
            const initial=displayName.charAt(0).toUpperCase();
            container.innerHTML=`
                <div class="avatar-placeholder w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center text-white text-3xl font-bold border border-neutral-700">
                    ${initial}
                </div>
                <div class="absolute top-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded font-medium tracking-wide z-10">
                    ${displayName}
                </div>
            `;
            videoGrid.appendChild(container);
        }

        if (kind==="video")
        {
            // Remove placeholder when video is added
            const placeholder=container.querySelector(".avatar-placeholder");
            if (placeholder)
            {
                placeholder.style.display="none";
            }

            let video=container.querySelector("video");
            if (!video)
            {
                video=document.createElement("video");
                video.autoplay=true;
                video.playsInline=true;
                video.muted=true; // Mute video element, audio comes from separate audio element
                video.className="w-full h-full object-cover absolute inset-0";
                container.insertBefore(video, container.firstChild);
            }

            // Check if track is ready
            const track=consumer.track;
            console.log(`Video track state: readyState=${track.readyState}, enabled=${track.enabled}, muted=${track.muted}`);

            const stream=new MediaStream([track]);
            video.srcObject=stream;

            // Force play for autoplay issues
            video.play().catch(e => console.log("Video play error:", e));

            // Listen for track events
            track.onended=() => console.log(`Video track ended for ${displayName}`);
            track.onmute=() => console.log(`Video track muted for ${displayName}`);
            track.onunmute=() => console.log(`Video track unmuted for ${displayName}`);

            console.log(`Displayed video for ${displayName} (${peerId})`);
        }

        if (kind==="audio")
        {
            let audio=container.querySelector("audio");
            if (!audio)
            {
                audio=document.createElement("audio");
                audio.autoplay=true;
                audio.style.display="none"; // Hide audio element
                container.appendChild(audio);
            }

            const audioStream=new MediaStream([consumer.track]);
            audio.srcObject=audioStream;
            console.log(audio)
            audio.play().catch(e => console.log("Audio play error:", e));
            console.log(`Displayed audio for ${displayName} (${peerId})`);
        }
    }, [participants]);

    // Keep ref updated for retry logic
    useEffect(() =>
    {
        displayRemoteMediaRef.current=displayRemoteMedia;
    }, [displayRemoteMedia]);

    // =========================================================
    // CONSUME PRODUCER
    // =========================================================
    const consumeProducer=useCallback(async (producerId, kind, peerId, userName) =>
    {
        try
        {
            const transport=recvTransportRef.current;
            const dev=deviceRef.current;

            console.log(`Attempting to consume: producerId=${producerId}, kind=${kind}, peerId=${peerId}, userName=${userName}`);

            if (!transport||!dev)
            {
                console.error("Transport or device not ready for consume");
                return null;
            }

            console.log("Sending consume request to server...");
            const response=await socketRequest("consume", {
                producerId,
                rtpCapabilities: dev.rtpCapabilities,
            });
            console.log("Consume response:", response);

            const consumer=await transport.consume({
                id: response.id,
                producerId: response.producerId,
                kind: response.kind,
                rtpParameters: response.rtpParameters,
            });

            // Resume consumer on server
            await socketRequest("resumeConsumer", {consumerId: consumer.id});

            // Store consumer
            consumersRef.current.set(producerId, {consumer, peerId, kind});
            setConsumers(new Map(consumersRef.current));

            // Display remote media
            displayRemoteMedia(producerId, consumer, peerId, kind, userName);

            console.log(`Consumer created for ${kind}:`, consumer.id);
            return consumer;
        } catch (err)
        {
            console.error("Consume error:", err);
            return null;
        }
    }, [socketRequest, displayRemoteMedia]);
    const createSendTransport=useCallback(async (dev) =>
    {
        try
        {
            const params=await socketRequest("createTransport", {roomId, type: "send"});

            const transport=dev.createSendTransport(params);

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
                console.log(`📡 Send transport state: ${state}`);
                if (state==="failed")
                {
                    transport.close();
                }
            });

            sendTransportRef.current=transport;
            console.log("✅ Send transport created");
            return transport;
        } catch (err)
        {
            console.error("❌ Send transport error:", err);
            throw err;
        }
    }, [roomId, socketRequest]);

    // =========================================================
    // CREATE RECEIVE TRANSPORT
    // =========================================================
    const createRecvTransport=useCallback(async (dev) =>
    {
        try
        {
            const params=await socketRequest("createTransport", {roomId, type: "recv"});

            const transport=dev.createRecvTransport(params);

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
                console.log(`Recv transport state: ${state}`);
                if (state==="failed")
                {
                    transport.close();
                }
            });

            recvTransportRef.current=transport;
            console.log("Receive transport created");
            return transport;
        } catch (err)
        {
            console.error("Recv transport error:", err);
            throw err;
        }
    }, [roomId, socketRequest]);

    // =========================================================
    // INITIALIZE ROOM
    // =========================================================

    useEffect(() =>
    {
        socket.connect();

        return () =>
        {
            socket.disconnect();
        };
    }, []);

    const initializeRoom=useCallback(async () =>
    {
        if (isInitializedRef.current) return;
        isInitializedRef.current=true;

        try
        {
            setConnectionState("connecting");
            const token=localStorage.getItem("token");
            const userName=localStorage.getItem("userName")||"Anonymous";

            // Join room and get router capabilities
            const response=await socketRequest("joinRoom", {token, roomId, userName});
            console.log("Joined room:", response);

            // Set existing participants
            if (response.participants)
            {
                setParticipants(response.participants);
            }

            // Set if this user is the owner
            if (response.isOwner)
            {
                setIsOwner(true);
            }

            // Initialize mediasoup device
            const newDevice=new mediasoupClient.Device();
            await newDevice.load({routerRtpCapabilities: response.routerRtpCapabilities});
            deviceRef.current=newDevice;

            // Create transports
            await createSendTransport(newDevice);
            await createRecvTransport(newDevice);

            setConnectionState("connected");
            console.log("Room initialized successfully");

            // Consume existing producers after transports are ready
            if (response.existingProducers?.length>0)
            {
                console.log(`Consuming ${response.existingProducers.length} existing producers`);
                // Small delay to ensure transport is fully ready
                setTimeout(async () =>
                {
                    for (const producer of response.existingProducers)
                    {
                        await consumeProducer(producer.producerId, producer.kind, producer.peerId, producer.userName);
                    }
                }, 500);
            }
        } catch (err)
        {
            console.error("Room initialization failed:", err);
            setConnectionState("failed");
        }
    }, [roomId, socketRequest, createSendTransport, createRecvTransport, consumeProducer]);

    // =========================================================
    // PRODUCE MEDIA (Camera/Mic)
    // =========================================================
    const startMedia=async () =>
    {
        try
        {
            const transport=sendTransportRef.current;
            if (!transport)
            {
                console.error("Send transport not ready");
                return;
            }

            // Get user media
            const constraints={
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
                video: VIDEO_CONSTRAINTS[videoQuality],
            };

            let stream;
            try
            {
                stream=await navigator.mediaDevices.getUserMedia(constraints);
            } catch
            {
                // Fallback to audio only
                console.warn("Video not available, using audio only");
                stream=await navigator.mediaDevices.getUserMedia({audio: constraints.audio});
            }

            setLocalStream(stream);
            if (localVideoRef.current)
            {
                localVideoRef.current.srcObject=stream;
            }

            // Produce audio
            const audioTrack=stream.getAudioTracks()[0];

            if (audioTrack&&!producersRef.current.has("audio"))
            {
                const audioProducer=await transport.produce({
                    track: audioTrack,
                    codecOptions: {
                        opusStereo: true,
                        opusDtx: true,
                    },
                    appData: {source: "mic"},
                });



                producersRef.current.set("audio", audioProducer);
                setIsMicOn(true);

                audioProducer.on("trackended", () =>
                {
                    console.log("🎤 Audio track ended");
                });

                console.log("✅ Audio producer created:", audioProducer);
            }

            // Produce video with simulcast
            const videoTrack=stream.getVideoTracks()[0];
            if (videoTrack&&!producersRef.current.has("video"))
            {
                const videoProducer=await transport.produce({
                    track: videoTrack,
                    encodings: SIMULCAST_ENCODINGS,
                    codecOptions: {
                        videoGoogleStartBitrate: 1000,
                    },
                    appData: {source: "camera"},
                });

                producersRef.current.set("video", videoProducer);
                setIsCameraOn(true);

                videoProducer.on("trackended", () =>
                {
                    console.log("📹 Video track ended");
                });

                console.log("✅ Video producer created:", videoProducer.id);
            }
        } catch (err)
        {
            console.error("❌ Start media error:", err);
            alert("Failed to access camera/microphone: "+err.message);
        }
    };

    // =========================================================
    // TOGGLE CAMERA
    // =========================================================
    const toggleCamera=async () =>
    {
        const videoProducer=producersRef.current.get("video");

        // If no video producer exists, we need to create one first
        if (!videoProducer)
        {
            try
            {
                const transport=sendTransportRef.current;
                if (!transport)
                {
                    console.error("Send transport not ready");
                    return;
                }

                // Get video stream
                const stream=await navigator.mediaDevices.getUserMedia({
                    video: VIDEO_CONSTRAINTS[videoQuality],
                });

                // Add video track to existing local stream or create new one
                const videoTrack=stream.getVideoTracks()[0];

                if (localStream)
                {
                    // Add video track to existing stream
                    localStream.addTrack(videoTrack);
                    localVideoRef.current.srcObject=localStream;
                } else
                {
                    // No existing stream, set this as local stream
                    setLocalStream(stream);
                    if (localVideoRef.current)
                    {
                        localVideoRef.current.srcObject=stream;
                    }
                }

                // Create video producer with simulcast
                const newVideoProducer=await transport.produce({
                    track: videoTrack,
                    encodings: SIMULCAST_ENCODINGS,
                    codecOptions: {
                        videoGoogleStartBitrate: 1000,
                    },
                    appData: {source: "camera"},
                });

                producersRef.current.set("video", newVideoProducer);
                setIsCameraOn(true);

                newVideoProducer.on("trackended", () =>
                {
                    console.log("📹 Video track ended");
                });

                console.log("✅ Video producer created:", newVideoProducer.id);
            } catch (err)
            {
                console.error("❌ Failed to start camera:", err);
                alert("Failed to access camera: "+err.message);
            }
            return;
        }
        // If producer exists, toggle pause/resume
        if (videoProducer.paused)
        {
            await videoProducer.resume();
            await socketRequest("resumeProducer", {producerId: videoProducer.id});
            setIsCameraOn(true);
        } else
        {
            await videoProducer.pause();
            await socketRequest("pauseProducer", {producerId: videoProducer.id});
            setIsCameraOn(false);
        }
    };

    // = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 
    //| | | | | | | | | | | | | | | | | | | | | | |  TOGGLE MIC  | | | | | | | | | | | | | | | | | | | | | | | | | | | | 
    // = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 
    const toggleMic=async () =>
    {
        const audioProducer=producersRef.current.get("audio");


        // If no audio producer exists, we need to create one first
        if (!audioProducer)
        {
            try
            {
                const transport=sendTransportRef.current;
                if (!transport)
                {
                    console.error("Send transport not ready");
                    return;
                }

                // Get audio stream
                const stream=await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                    },
                });

                // Add audio track to existing local stream or create new one
                const audioTrack=stream.getAudioTracks()[0];

                if (localStream)
                {
                    // Add audio track to existing stream
                    localStream.addTrack(audioTrack);
                } else
                {
                    // No existing stream, set this as local stream
                    setLocalStream(stream);
                }


                // Create audio producer
                const newAudioProducer=await transport.produce({
                    track: audioTrack,
                    codecOptions: {
                        opusStereo: true,
                        opusDtx: true,
                    },
                    appData: {source: "mic"},
                });

                producersRef.current.set("audio", newAudioProducer);
                setIsMicOn(true);

                newAudioProducer.on("trackended", () =>
                {
                    console.log("🎤 Audio track ended");
                });

                console.log("✅ Audio producer created:", newAudioProducer);
            } catch (err)
            {
                console.error("❌ Failed to start mic:", err);
                alert("Failed to access microphone: "+err.message);
            }
            return;
        }

        // If producer exists, toggle pause/resume
        if (audioProducer.paused)
        {
            await audioProducer.resume();
            await socketRequest("resumeProducer", {producerId: audioProducer.id});
            setIsMicOn(true);
        } else
        {
            await audioProducer.pause();
            await socketRequest("pauseProducer", {producerId: audioProducer.id});
            setIsMicOn(false);
        }
    };

    // =========================================================
    // SCREEN SHARE
    // =========================================================
    const toggleScreenShare=async () =>
    {
        if (isScreenSharing)
        {
            // Stop screen share
            const screenProducer=producersRef.current.get("screen");
            if (screenProducer)
            {
                screenProducer.close();
                await socketRequest("closeProducer", {producerId: screenProducer.id});
                producersRef.current.delete("screen");
            }
            setIsScreenSharing(false);
        } else
        {
            try
            {
                const screenStream=await navigator.mediaDevices.getDisplayMedia({
                    video: {cursor: "always"},
                    audio: false,
                });

                const screenTrack=screenStream.getVideoTracks()[0];
                const transport=sendTransportRef.current;

                if (transport)
                {
                    const screenProducer=await transport.produce({
                        track: screenTrack,
                        appData: {source: "screen"},
                    });

                    producersRef.current.set("screen", screenProducer);
                    setIsScreenSharing(true);

                    screenTrack.onended=() =>
                    {
                        toggleScreenShare();
                    };

                    console.log("✅ Screen share started");
                }
            } catch (err)
            {
                console.error("❌ Screen share error:", err);
            }
        }
    };

    // =========================================================
    // TOGGLE HAND RAISE
    // =========================================================
    const toggleHandRaise=async () =>
    {
        try
        {
            const response=await socketRequest("toggleHandRaise");
            setIsHandRaised(response.isHandRaised);
        } catch (err)
        {
            console.error("Hand raise error:", err);
        }
    };

    // =========================================================
    // SEND CHAT MESSAGE
    // =========================================================
    const sendChatMessage=async (e) =>
    {
        e.preventDefault();
        if (!chatInput.trim()) return;

        try
        {
            await socketRequest("chatMessage", {message: chatInput});
            setChatInput("");
        } catch (err)
        {
            console.error("Chat error:", err);
        }
    };

    // =========================================================
    // STOP ALL MEDIA
    // =========================================================
    const stopAllMedia=useCallback(() =>
    {
        // Stop local stream
        if (localStream)
        {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }

        // Close all producers
        producersRef.current.forEach((producer) =>
        {
            try {producer.close();} catch { /* ignore */}
        });
        producersRef.current.clear();
        setIsCameraOn(false);
        setIsMicOn(false);
        setIsScreenSharing(false);
    }, [localStream]);

    // =========================================================
    // LEAVE ROOM
    // =========================================================
    const leaveRoom=async () =>
    {
        try
        {
            stopAllMedia();

            // Close consumers
            consumersRef.current.forEach(({consumer}) =>
            {
                try {consumer.close();} catch { /* ignore */}
            });
            consumersRef.current.clear();

            // Close transports
            if (sendTransportRef.current) sendTransportRef.current.close();
            if (recvTransportRef.current) recvTransportRef.current.close();

            // Notify server
            await socketRequest("leaveRoom");

            navigate("/");
        } catch (err)
        {
            console.error("Leave room error:", err);
            navigate("/");
        }
    };

    // =========================================================
    // END MEETING FOR ALL (OWNER ONLY)
    // =========================================================
    const endMeetingForAll=async () =>
    {
        if (!isOwner) return;

        try
        {

            await socketRequest("endMeeting", {roomId});
            const res=await (dispatch(deleteRoom(roomId))).unwrap();
            console.log("Room deleted:", res);
            stopAllMedia();
            navigate("/");
        } catch (err)
        {
            console.error("End meeting error:", err);
        }
    };

    // =========================================================
    // SOCKET EVENT LISTENERS
    // =========================================================
    useEffect(() =>
    {
        // New producer from another user
        const handleNewProducer=async (data) =>
        {
            console.log("New producer:", data);
            await consumeProducer(data.producerId, data.kind, data.peerId, data.userName);
        };

        // Producer closed
        const handleProducerClosed=(data) =>
        {
            console.log("Producer closed:", data);
            const consumerData=consumersRef.current.get(data.producerId);
            if (consumerData)
            {
                consumerData.consumer.close();
                consumersRef.current.delete(data.producerId);
                setConsumers(new Map(consumersRef.current));
            }

            // Remove video element if no more consumers for this peer
            const hasMoreConsumers=[...consumersRef.current.values()].some(
                c => c.peerId===data.peerId
            );
            if (!hasMoreConsumers)
            {
                const container=document.getElementById(`container-${data.peerId}`);
                if (container) container.remove();
            }
        };

        // Consumer closed from server
        const handleConsumerClosed=(data) =>
        {
            console.log("Consumer closed:", data);
            for (const [producerId, consumerData] of consumersRef.current)
            {
                if (consumerData.consumer.id===data.consumerId)
                {
                    consumerData.consumer.close();
                    consumersRef.current.delete(producerId);
                    setConsumers(new Map(consumersRef.current));
                    break;
                }
            }
        };

        // Participant joined
        const handleParticipantJoined=(data) =>
        {
            console.log("Participant joined:", data);
            setParticipants(prev => [...prev, data]);
        };

        // Participant left
        const handleParticipantLeft=(data) =>
        {
            console.log("Participant left:", data);
            setParticipants(prev => prev.filter(p => p.socketId!==data.peerId));

            // Remove their container
            const container=document.getElementById(`container-${data.peerId}`);
            if (container) container.remove();

            // Clean up their consumers
            for (const [producerId, consumerData] of consumersRef.current)
            {
                if (consumerData.peerId===data.peerId)
                {
                    consumerData.consumer.close();
                    consumersRef.current.delete(producerId);
                }
            }
            setConsumers(new Map(consumersRef.current));
        };

        // Chat message
        const handleChatMessage=(message) =>
        {
            setChatMessages(prev => [...prev, message]);
        };

        // Hand raise change
        const handleHandRaise=(data) =>
        {
            setParticipants(prev =>
                prev.map(p =>
                    p.socketId===data.peerId
                        ? {...p, isHandRaised: data.isHandRaised}
                        :p
                )
            );
        };

        // Producer paused/resumed
        const handleProducerPaused=(data) =>
        {
            setParticipants(prev =>
                prev.map(p =>
                    p.socketId===data.peerId
                        ? {...p, isAudioEnabled: false}
                        :p
                )
            );
        };

        const handleProducerResumed=(data) =>
        {
            setParticipants(prev =>
                prev.map(p =>
                    p.socketId===data.peerId
                        ? {...p, isAudioEnabled: true}
                        :p
                )
            );
        };

        // Meeting ended by host
        const handleMeetingEnded=() =>
        {
            console.log("Meeting ended by host");
            // Clean up and navigate away
            if (localVideoRef.current?.srcObject)
            {
                const stream=localVideoRef.current.srcObject;
                stream.getTracks().forEach(track => track.stop());
            }
            producersRef.current.forEach((producer) =>
            {
                try {producer.close();} catch { /* ignore */}
            });
            consumersRef.current.forEach(({consumer}) =>
            {
                try {consumer.close();} catch { /* ignore */}
            });
            if (sendTransportRef.current) sendTransportRef.current.close();
            if (recvTransportRef.current) recvTransportRef.current.close();

            alert("The meeting has been ended by the host.");
            navigate("/");
        };

        // Register events
        socket.on("newProducer", handleNewProducer);
        socket.on("producerClosed", handleProducerClosed);
        socket.on("consumerClosed", handleConsumerClosed);
        socket.on("participantJoined", handleParticipantJoined);
        socket.on("participantLeft", handleParticipantLeft);
        socket.on("newChatMessage", handleChatMessage);
        socket.on("handRaiseChanged", handleHandRaise);
        socket.on("producerPaused", handleProducerPaused);
        socket.on("producerResumed", handleProducerResumed);
        socket.on("meetingEnded", handleMeetingEnded);

        return () =>
        {
            socket.off("newProducer", handleNewProducer);
            socket.off("producerClosed", handleProducerClosed);
            socket.off("consumerClosed", handleConsumerClosed);
            socket.off("participantJoined", handleParticipantJoined);
            socket.off("participantLeft", handleParticipantLeft);
            socket.off("newChatMessage", handleChatMessage);
            socket.off("handRaiseChanged", handleHandRaise);
            socket.off("producerPaused", handleProducerPaused);
            socket.off("producerResumed", handleProducerResumed);
            socket.off("meetingEnded", handleMeetingEnded);
        };
    }, [consumeProducer, navigate]);

    // Initialize room on mount
    useEffect(() =>
    {
        const init=async () =>
        {
            await initializeRoom();
        };
        init();
    }, [initializeRoom]);

    // Cleanup on unmount
    useEffect(() =>
    {
        const localVideo=localVideoRef.current;
        const currentProducers=producersRef.current;
        const currentConsumers=consumersRef.current;
        const currentSendTransport=sendTransportRef.current;
        const currentRecvTransport=recvTransportRef.current;

        return () =>
        {
            // Stop local stream
            if (localVideo?.srcObject)
            {
                const stream=localVideo.srcObject;
                stream.getTracks().forEach(track => track.stop());
            }

            // Close producers
            currentProducers.forEach((producer) =>
            {
                try {producer.close();} catch { /* ignore */}
            });

            // Close consumers
            currentConsumers.forEach(({consumer}) =>
            {
                try {consumer.close();} catch { /* ignore */}
            });

            // Close transports
            if (currentSendTransport)
            {
                try {currentSendTransport.close();} catch { /* ignore */}
            }
            if (currentRecvTransport)
            {
                try {currentRecvTransport.close();} catch { /* ignore */}
            }
        };
    }, []);

    // Calculate responsive grid columns based on participant count and breakpoints
    const getResponsiveGridCols=() =>
    {
        const count=consumers.size+1; // +1 for local video
        // Base (mobile): always 1 column for readability
        let base="grid-cols-1";

        // sm breakpoint (~640px): up to 2-3 columns
        let sm="sm:grid-cols-2";
        if (count>=5) sm="sm:grid-cols-3";

        // md breakpoint (~768px): up to 3-4 columns
        let md="md:grid-cols-2";
        if (count>=4&&count<=9) md="md:grid-cols-3";
        else if (count>9) md="md:grid-cols-4";

        // lg breakpoint (~1024px): up to 4-5 columns
        let lg="lg:grid-cols-3";
        if (count>=10&&count<=16) lg="lg:grid-cols-4";
        else if (count>16) lg="lg:grid-cols-5";

        // xl breakpoint (~1280px): cap at 5 columns
        const xl="xl:grid-cols-5";

        return `${base} ${sm} ${md} ${lg} ${xl}`;
    };

    return (
        <div className="w-full h-screen bg-black flex flex-col">
            {/* Header */}
            <div className="bg-neutral-950 border-b border-neutral-800 px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <span className="text-white font-semibold tracking-wide">{roomId}</span>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium uppercase tracking-wider ${connectionState==="connected"? "bg-white text-black":
                        connectionState==="connecting"? "bg-neutral-700 text-white":"bg-neutral-800 text-neutral-400"
                        }`}>
                        {connectionState}
                    </span>
                    {isOwner&&(
                        <span className="flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-white text-black font-medium uppercase tracking-wider">
                            <HostIcon className="w-3 h-3" />
                            Host
                        </span>
                    )}
                </div>
                <div className="text-neutral-400 text-sm font-medium hidden sm:block">
                    {participants.length+1} participants
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 min-h-0 flex overflow-hidden">
                {/* Video grid */}
                <div className={`flex-1 ${consumers.size===0? "":"p-2 sm:p-4"} overflow-auto bg-black`}>
                    <div id="video-grid" className={`${consumers.size===0? "h-full w-full":`grid ${getResponsiveGridCols()} gap-2 sm:gap-3 auto-rows-fr h-full`}`}>
                        {/* Local video */}
                        <div className={`${consumers.size===0
                            ? "relative bg-black overflow-hidden h-full w-full flex items-center justify-center"
                            :"relative bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden aspect-video flex items-center justify-center"}`}>
                            <video
                                ref={localVideoRef}
                                autoPlay
                                muted
                                playsInline
                                className={`${consumers.size===0? "w-full h-full object-contain":"w-full h-full object-cover"} scale-x-[-1]`}
                            />
                            <div className="absolute top-2 left-2 bg-black/80 text-white text-[10px] sm:text-xs px-2 py-1 rounded font-medium tracking-wide flex items-center gap-2 z-10">
                                You {isOwner&&<HostIcon className="w-3 h-3" />}
                            </div>
                            <div className="absolute bottom-2 left-2 flex gap-1 z-10">
                                {!isMicOn&&(
                                    <span className="bg-white text-black text-xs p-1.5 rounded">
                                        <MicOffIcon className="w-3 h-3" />
                                    </span>
                                )}
                                {!isCameraOn&&(
                                    <span className="bg-white text-black text-xs p-1.5 rounded">
                                        <VideoOffIcon className="w-3 h-3" />
                                    </span>
                                )}
                            </div>
                            {isHandRaised&&(
                                <div className="absolute top-2 right-2 bg-white text-black p-1.5 rounded z-10">
                                    <HandRaisedIcon className="w-4 h-4" />
                                </div>
                            )}
                        </div>
                        {/* Remote videos are added dynamically */}
                    </div>
                </div>

                {/* Sidebar - Chat */}
                {showChat&&(
                    <div className={`${isMobile? "fixed inset-0 z-30":""}`}>
                        {isMobile&&(
                            <div className="absolute inset-0 bg-black/60" onClick={() => setShowChat(false)} />
                        )}
                        <div className={`${isMobile? "absolute right-0 top-0 h-full w-11/12 max-w-[20rem]":"w-80"} bg-neutral-950 flex flex-col border-l border-neutral-800`}>
                            <div className="p-3 sm:p-4 border-b border-neutral-800 flex justify-between items-center">
                                <span className="text-white font-semibold tracking-wide">Chat</span>
                                <button onClick={() => setShowChat(false)} className="text-neutral-400 hover:text-white transition">
                                    <CloseIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
                                {chatMessages.map((msg) => (
                                    <div key={msg.id} className="text-sm">
                                        <span className="text-white font-medium">{msg.userName}: </span>
                                        <span className="text-neutral-300">{msg.message}</span>
                                    </div>
                                ))}
                            </div>
                            <form onSubmit={sendChatMessage} className="p-3 sm:p-4 border-t border-neutral-800">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Type a message..."
                                    className="w-full bg-neutral-900 border border-neutral-700 text-white px-3 sm:px-4 py-2 rounded-lg focus:outline-none focus:border-white transition placeholder-neutral-500"
                                />
                            </form>
                        </div>
                    </div>
                )}

                {/* Sidebar - Participants */}
                {showParticipants&&(
                    <div className={`${isMobile? "fixed inset-0 z-30":""}`}>
                        {isMobile&&(
                            <div className="absolute inset-0 bg-black/60" onClick={() => setShowParticipants(false)} />
                        )}
                        <div className={`${isMobile? "absolute right-0 top-0 h-full w-11/12 max-w-[18rem]":"w-72"} bg-neutral-950 flex flex-col border-l border-neutral-800`}>
                            <div className="p-3 sm:p-4 border-b border-neutral-800 flex justify-between items-center">
                                <span className="text-white font-semibold tracking-wide">Participants ({participants.length+1})</span>
                                <button onClick={() => setShowParticipants(false)} className="text-neutral-400 hover:text-white transition">
                                    <CloseIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 sm:p-3">
                                <div className="flex items-center gap-3 p-2 sm:p-3 rounded-lg hover:bg-neutral-900 transition">
                                    <div className="w-9 h-9 bg-white text-black rounded-full flex items-center justify-center text-sm font-semibold">
                                        Y
                                    </div>
                                    <span className="text-white text-sm flex-1 font-medium">
                                        You {isOwner&&"(Host)"}
                                    </span>
                                    <div className="flex gap-2 text-neutral-400">
                                        {isMicOn? <MicIcon className="w-4 h-4" />:<MicOffIcon className="w-4 h-4" />}
                                        {isCameraOn? <VideoIcon className="w-4 h-4" />:<VideoOffIcon className="w-4 h-4" />}
                                        {isHandRaised&&<HandRaisedIcon className="w-4 h-4 text-white" />}
                                    </div>
                                </div>
                                {participants.map((p) => (
                                    <div key={p.socketId} className="flex items-center gap-3 p-2 sm:p-3 rounded-lg hover:bg-neutral-900 transition">
                                        <div className="w-9 h-9 bg-neutral-800 text-white rounded-full flex items-center justify-center text-sm font-semibold border border-neutral-700">
                                            {p.userName?.charAt(0)?.toUpperCase()||"?"}
                                        </div>
                                        <span className="text-white text-sm flex-1 truncate font-medium">{p.userName}</span>
                                        <div className="flex gap-2 text-neutral-500">
                                            {p.isAudioEnabled? <MicIcon className="w-4 h-4" />:<MicOffIcon className="w-4 h-4" />}
                                            {p.isVideoEnabled? <VideoIcon className="w-4 h-4" />:<VideoOffIcon className="w-4 h-4" />}
                                            {p.isHandRaised&&<HandRaisedIcon className="w-4 h-4 text-white" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Control bar */}
            <div className="bg-neutral-950 border-t border-neutral-800 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                {/* Start/Join button */}
                {!isCameraOn&&!isMicOn&&(
                    <button
                        onClick={startMedia}
                        className="px-5 sm:px-6 py-2 bg-white hover:bg-neutral-200 text-black rounded-lg font-semibold transition tracking-wide"
                    >
                        Join with Video
                    </button>
                )}

                {/* Mic toggle */}
                <button
                    onClick={toggleMic}
                    className={`p-3 sm:p-3.5 rounded-full transition border-2 ${isMicOn
                        ? "bg-transparent border-neutral-600 hover:border-white text-white"
                        :"bg-white border-white text-black hover:bg-neutral-200"
                        }`}
                    title={isMicOn? "Mute":"Unmute"}
                >
                    {isMicOn? <MicIcon className="w-5 h-5" />:<MicOffIcon className="w-5 h-5" />}
                </button>

                {/* Camera toggle */}
                <button
                    onClick={toggleCamera}
                    className={`p-3 sm:p-3.5 rounded-full transition border-2 ${isCameraOn
                        ? "bg-transparent border-neutral-600 hover:border-white text-white"
                        :"bg-white border-white text-black hover:bg-neutral-200"
                        }`}
                    title={isCameraOn? "Stop Video":"Start Video"}
                >
                    {isCameraOn? <VideoIcon className="w-5 h-5" />:<VideoOffIcon className="w-5 h-5" />}
                </button>

                {/* Screen share */}
                <button
                    onClick={toggleScreenShare}
                    className={`p-3 sm:p-3.5 rounded-full transition border-2 ${isScreenSharing
                        ? "bg-white border-white text-black hover:bg-neutral-200"
                        :"bg-transparent border-neutral-600 hover:border-white text-white"
                        }`}
                    title="Share Screen"
                >
                    {isScreenSharing? <ScreenShareIcon className="w-5 h-5" />:<ScreenShareOffIcon className="w-5 h-5" />}
                </button>

                {/* Hand raise */}
                <button
                    onClick={toggleHandRaise}
                    className={`p-3 sm:p-3.5 rounded-full transition border-2 ${isHandRaised
                        ? "bg-white border-white text-black hover:bg-neutral-200"
                        :"bg-transparent border-neutral-600 hover:border-white text-white"
                        }`}
                    title="Raise Hand"
                >
                    <HandRaisedIcon className="w-5 h-5" />
                </button>

                {/* Chat toggle */}
                <button
                    onClick={() => {setShowChat(!showChat); setShowParticipants(false);}}
                    className={`p-3 sm:p-3.5 rounded-full transition border-2 ${showChat
                        ? "bg-white border-white text-black hover:bg-neutral-200"
                        :"bg-transparent border-neutral-600 hover:border-white text-white"
                        }`}
                    title="Chat"
                >
                    <ChatIcon className="w-5 h-5" />
                </button>

                {/* Participants toggle */}
                <button
                    onClick={() => {setShowParticipants(!showParticipants); setShowChat(false);}}
                    className={`p-3 sm:p-3.5 rounded-full transition border-2 ${showParticipants
                        ? "bg-white border-white text-black hover:bg-neutral-200"
                        :"bg-transparent border-neutral-600 hover:border-white text-white"
                        }`}
                    title="Participants"
                >
                    <UsersIcon className="w-5 h-5" />
                </button>

                {/* Leave button */}
                <button
                    onClick={leaveRoom}
                    className="px-5 sm:px-6 py-2.5 bg-transparent border-2 border-neutral-600 hover:border-white text-white rounded-lg font-semibold transition ml-0 sm:ml-4 tracking-wide"
                >
                    Leave
                </button>

                {/* End meeting for all (owner only) */}
                {isOwner&&(
                    <button
                        onClick={endMeetingForAll}
                        className="px-5 sm:px-6 py-2.5 bg-white hover:bg-neutral-200 text-black rounded-lg font-semibold transition flex items-center gap-2 tracking-wide"
                    >
                        <PhoneOffIcon className="w-4 h-4" />
                        End for All
                    </button>
                )}
            </div>
        </div>
    );
};
export default Room;