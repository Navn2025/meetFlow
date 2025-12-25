class PCMRecorderProcessor extends AudioWorkletProcessor
{
    constructor()
    {
        super();
        this.buffer=[];
        this.inputSampleRate=sampleRate; // context sample rate (e.g., 48000)
        this.targetRate=16000;
    }
    static get parameterDescriptors()
    {
        return [];
    }
    process(inputs)
    {
        const input=inputs[0];
        if (!input||!input[0]) return true;
        // Mono: take channel 0
        const channel=input[0]; // Float32Array
        // Resample to 16k (simple linear; for production use a higher‑quality SRC)
        const ratio=this.inputSampleRate/this.targetRate;
        for (let i=0;i<channel.length;i+=ratio)
        {
            const idx=Math.floor(i);
            const next=Math.min(idx+1, channel.length-1);
            const frac=i-idx;
            const sample=channel[idx]*(1-frac)+channel[next]*frac;
            // Convert float [-1..1] to int16
            const s=Math.max(-1, Math.min(1, sample));
            const int16=s<0? s*0x8000:s*0x7fff;
            this.buffer.push(int16);
        }
        // Flush every ~20ms (~320 samples at 16kHz)
        const samplesPer20ms=16000*0.02;
        if (this.buffer.length>=samplesPer20ms)
        {
            const chunk=new Int16Array(this.buffer.splice(0, samplesPer20ms));
            this.port.postMessage(chunk);
        }
        return true;
    }
}
registerProcessor('pcm-recorder', PCMRecorderProcessor);
