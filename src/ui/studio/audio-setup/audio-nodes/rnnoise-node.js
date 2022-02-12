export default class RNNoiseNode extends AudioWorkletNode {
  static module = { rnnoise: null };
  constructor(context) {
    super(context, 'rnnoise', {
      channelCountMode: 'explicit',
      channelCount: 1,
      channelInterpretation: 'speakers',
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [1],
      processorOptions: {
        module: module.rnnoise,
      },
    });
  }

  static async loadModule(context) {
    module.rnnoise = await WebAssembly.compileStreaming(fetch('audio-modules/rnnoise.wasm'));
    await context.audioWorklet.addModule('audio-modules/rnnoise-processor.js');
  }
}
