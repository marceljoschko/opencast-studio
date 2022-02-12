export default class NoiseGateNode extends AudioWorkletNode {
  constructor(context, options) {
    super(context, 'noisegate', {
      channelCountMode: 'explicit',
      channelCount: 1,
      channelInterpretation: 'speakers',
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [1],
      processorOptions: {},
    });
  }
  static async loadModule(context) {
    await context.audioWorklet.addModule('audio-modules/noisegate-processor.js');
  }
}
