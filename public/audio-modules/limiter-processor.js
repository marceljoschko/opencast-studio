import RingBuffer from "./RingBuffer.js";
import { dBToAmp, ampToDB, timeCoefficient } from "./utils.js";

class LimiterProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super({
            ...options,
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [1],
        });
        const parameters = options.processorOptions;

        this.sampleRate = parameters.sampleRate ? parameters.sampleRate : 48000;
        this.lookAhead = 0.005;
        this.lastSample = 0;
        this.ringBuffer = new RingBuffer(this.lookAhead * this.sampleRate);
    }

    static get parameterDescriptors() {
        return [
            {
                name: "threshold",
                defaultValue: -1,
                minValue: -20,
                maxValue: -0.1,
                automationRate: "k-rate",
            },
            {
                name: "ceiling",
                defaultValue: -0.1,
                minValue: -20,
                maxValue: 0,
                automationRate: "k-rate",
            },
            {
                name: "release",
                defaultValue: 0.3,
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

        const envelopeData = this.getEnvelope(x, parameters);

        if (this.lookAhead > 0) {
            for (let i = 0; i < x.length; i++) {
                this.ringBuffer.push(x[i]);
                y[i] = this.ringBuffer.read();
            }
        }

        for (let i = 0; i < x.length; i++) {
            let gainDB = parameters["threshold"][0] - ampToDB(envelopeData[i]);
            gainDB = Math.min(parameters["ceiling"][0], gainDB);
            let gain = dBToAmp(gainDB);
            y[i] *= gain;
        }

        return true;
    }
    getEnvelope(data, parameters) {
        const envelope = new Float32Array(data.length);

        const attack = 0;
        const release = timeCoefficient(
            this.sampleRate,
            parameters["release"][0]
        );

        for (let i = 0; i < data.length; i++) {
            let envIn = Math.abs(data[i]);
            if (this.lastSample < envIn) {
                this.lastSample = envIn + attack * (this.lastSample - envIn);
            } else {
                this.lastSample = envIn + release * (this.lastSample - envIn);
            }
            envelope[i] = this.lastSample;
        }
        return envelope;
    }
}

registerProcessor("limiter", LimiterProcessor);
