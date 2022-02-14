const SAMPLE_SIZE = 32768;

class RNNoiseProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super({
            ...options,
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [1],
        });

        this.instance = new WebAssembly.Instance(
            options.processorOptions.module
        ).exports;
        this.instance.createState();

        // create new bidirectional buffer between webassembly instance and audioworkletprocessor
        this.heapAudioBuffer = new Float32Array(
            this.instance.memory.buffer,
            this.instance.getBufferAddress(),
            this.instance.getBufferSize()
        );
    }

    process(input, output, parameters) {
        const x = input[0][0],
            y = output[0][0];

        // if the RNNoiseNode is not connected in the audio-rendering return false to close it
        if (!x) return false;

        // Upscaling to 16-Bit values
        for (let i = 0; i < x.length; i++) {
            x[i] *= SAMPLE_SIZE;
        }
        // Push new input samples in Ring-Buffer and get the Input-Pointer
        this.heapAudioBuffer.set(x, this.instance.pushInput(x.length));
        // call rnnoise_process_frames()
        const buffered = this.instance.pipe();
        if (buffered) {
            // pull new Output-Pointer
            const processed = this.instance.pullOutput(y.length);
            // set new output
            y.set(
                this.heapAudioBuffer.subarray(processed, processed + y.length)
            );
            // Downscaling to amplitude values
            for (let i = 0; i < y.length; i++) {
                y[i] /= SAMPLE_SIZE;
            }
        }
        return true;
    }
}
registerProcessor("rnnoise", RNNoiseProcessor);
