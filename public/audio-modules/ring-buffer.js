export default class RingBuffer {
    constructor(n) {
        this.n = Math.floor(n);
        this.buffer = new Float32Array(2 * this.n);
        this.readPointer = 0;
        this.writePointer = this.n - 1;
    }

    read() {
        const sample = this.buffer[this.readPointer % this.buffer.length];
        this.readPointer++;
        return sample;
    }

    push(sample) {
        this.buffer[this.writePointer % this.buffer.length] = sample;
        this.writePointer++;
    }
}
