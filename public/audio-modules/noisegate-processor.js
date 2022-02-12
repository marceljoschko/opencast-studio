import { timeCoefficient, dBToAmp } from "./utils";

class NoiseGateProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super({
            ...options,
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [1],
        });

        const parameters = options.processorOptions;
        this.sampleRate = parameters.sampleRate ? parameters.sampleRate : 48000;
        this.holdCounter = 0;
        this.lastSample = 0;
    }

    static get parameterDescriptors() {
        return [
            {
                name: "threshold",
                defaultValue: -60,
                minValue: -70,
                maxValue: 0,
                automationRate: "k-rate",
            },
            {
                name: "attack",
                defaultValue: 0.05,
                minValue: 0.001,
                maxValue: 0.15,
                automationRate: "k-rate",
            },
            {
                name: "hold",
                defaultValue: 0.2,
                minValue: 0.001,
                maxValue: 1.5,
                automationRate: "k-rate",
            },
            {
                name: "release",
                defaultValue: 0.05,
                minValue: 0.001,
                maxValue: 3,
                automationRate: "k-rate",
            },
        ];
    }

    process(input, output, parameters) {
        const x = input[0][0],
            y = output[0][0];

        if (!x) return false;

        const envelope = this.getEnvelope(x, parameters);

        for (let i = 0; i < x.length; i++) {
            y[i] = x[i] * envelope[i];
        }
        return true;
    }

    getEnvelope(data, parameters) {
        const envelope = new Float32Array(data.length);

        const attack = timeCoefficient(
            this.sampleRate,
            parameters["attack"][0]
        );
        const hold = parameters["hold"][0];
        const release = timeCoefficient(
            this.sampleRate,
            parameters["release"][0]
        );
        const threshold = parameters["threshold"][0];

        for (let i = 0; i < data.length; i++) {
            let envIn = Math.abs(data[i]) >= dBToAmp(threshold) ? 1 : 0;
            if (this.holdCounter > hold && envIn <= this.lastSample) {
                this.lastSample = envIn + attack * (this.lastSample - envIn);
                this.holdCounter = 0;
            } else if (this.holdCounter <= hold) {
                this.holdCounter += parameters["attack"][0];
            } else if (envIn > this.lastSample) {
                this.lastSample = envIn + release * (this.lastSample - envIn);
            }
            envelope[i] = this.lastSample;
        }
        return envelope;
    }
}

registerProcessor("noisegate", NoiseGateProcessor);
