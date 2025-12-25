// Define a custom AudioWorklet processor class
class PCMRecorderProcessor extends AudioWorkletProcessor
{

    // Constructor runs once when the AudioWorklet is created
    constructor()
    {
        super(); // Call parent AudioWorkletProcessor constructor (mandatory)

        // Get the input sample rate from the AudioContext (usually 44100 or 48000 Hz)
        this.inputSampleRate=sampleRate;   // e.g. 48000

        // Desired output sample rate for speech recognition
        this.targetRate=16000;

        // Ratio used for downsampling (e.g. 48000 / 16000 = 3)
        this.ratio=this.inputSampleRate/this.targetRate;

        // Pre-allocated buffer to store PCM 16-bit samples
        this.buffer=new Int16Array(4096);

        // Index pointing to the current write position in the buffer
        this.writeIndex=0;

        // Number of samples per chunk (20 ms of audio at 16 kHz)
        this.SAMPLES_PER_CHUNK=320; // 20ms @ 16kHz
    }

    // process() is called repeatedly by the audio engine for each audio block
    process(inputs)
    {

        // Take the first input node
        const input=inputs[0];

        // If no input or no channel data is available, keep processor alive
        if (!input||!input[0]) return true;

        // Extract the first channel (mono) as a Float32Array
        const channel=input[0]; // mono Float32Array (-1.0 to +1.0)

        // Loop through input samples using the resampling ratio
        for (let i=0;i<channel.length;i+=this.ratio)
        {

            // Integer part of the current sample index
            const idx=Math.floor(i);

            // Next sample index (clamped to avoid overflow)
            const next=Math.min(idx+1, channel.length-1);

            // Fractional part for interpolation
            const frac=i-idx;

            // Linear interpolation between current and next sample
            const sample=
                channel[idx]*(1-frac)+channel[next]*frac;

            // Clamp sample value to the valid audio range [-1, 1]
            const s=Math.max(-1, Math.min(1, sample));

            // Convert Float32 sample to signed 16-bit PCM and store in buffer
            this.buffer[this.writeIndex++]=
                s<0? s*0x8000:s*0x7fff;

            // If buffer has enough samples for one chunk
            if (this.writeIndex===this.SAMPLES_PER_CHUNK)
            {

                // Copy the filled portion of the buffer
                const chunk=this.buffer.slice(0, this.SAMPLES_PER_CHUNK);

                // Send raw PCM data to the main thread (zero-copy transfer)
                this.port.postMessage(chunk.buffer, [chunk.buffer]);

                // Reset buffer index for the next chunk
                this.writeIndex=0;
            }
        }

        // Returning true tells the browser to keep processing audio
        return true;
    }
}

// Register the processor so it can be used by AudioWorkletNode
registerProcessor("pcm-recorder", PCMRecorderProcessor);
