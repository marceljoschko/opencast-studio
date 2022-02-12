export function ampToDB(value) {
    return 20 * Math.log10(value);
}

export function dBToAmp(db) {
    return Math.pow(10, db / 20);
}

export function timeCoefficient(sampleRate, time) {
    return Math.exp(-1 / (sampleRate * time));
}
