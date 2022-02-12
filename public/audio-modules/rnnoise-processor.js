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
        );
        this.instance.exports.reset();

        this.heapAudioBuffer = new Float32Array(
            this.instance.exports.memory.buffer,
            this.instance.exports.getHeapAddress(),
            32768
        );
    }

    process(input, output, parameters) {
        const x = input[0][0],
            y = output[0][0];

        if (!x) return false;

        for (let i = 0; i < x.length; i++) {
            x[i] *= SAMPLE_SIZE;
        }
        this.heapAudioBuffer.set(x, this.instance.exports.getInput());
        const processed = this.instance.exports.pipe(y.length);
        if (processed >= 0) {
            y.set(
                this.heapAudioBuffer.subarray(processed, processed + y.length)
            );
            for (let i = 0; i < y.length; i++) {
                y[i] /= SAMPLE_SIZE;
            }
        }
        return true;
    }
}
registerProcessor("rnnoise", RNNoiseProcessor);
