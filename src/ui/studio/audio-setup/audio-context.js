import NoiseGateNode from './audio-nodes/noisegate-node';
import LimiterNode from './audio-nodes/limiter-node';
import RNNoiseNode from './audio-nodes/rnnoise-node';
import EqualizerNode from './audio-nodes/equalizer-node';

export async function createAudioContext(
  { audioStream, audioSettings, compressorSettings, equalizerSettings, echoTestSettings },
  dispatch,
  mode = ''
) {
  // Close old audioContext
  if (audioSettings.audioContext) audioSettings.audioContext.close();
  const audioContext = new AudioContext({ sampleRate: audioSettings.sampleRate });
  let rnnoise,
    noiseGate,
    equalizer,
    equalizerFirst,
    equalizerLast,
    compressor,
    makeupGain,
    limiter,
    delay,
    analyser;
  try {
    // Load all audio modules
    await Promise.all([
      RNNoiseNode.loadModule(audioContext),
      NoiseGateNode.loadModule(audioContext),
      LimiterNode.loadModule(audioContext),
    ]);

    // Initialize all nodes with a bypass analyser node
    rnnoise = audioContext.createAnalyser();
    noiseGate = audioContext.createAnalyser();
    equalizerFirst = audioContext.createAnalyser();
    equalizerLast = audioContext.createAnalyser();
    compressor = audioContext.createAnalyser();
    makeupGain = audioContext.createAnalyser();
    limiter = audioContext.createAnalyser();
    delay = audioContext.createAnalyser();
    analyser = audioContext.createAnalyser();

    // Selection handling
    if (audioSettings.noiseSuppression) {
      rnnoise = new RNNoiseNode(audioContext);
      noiseGate = new NoiseGateNode(audioContext);
    }

    if (audioSettings.equalizer) {
      equalizer = new EqualizerNode(audioContext);
      equalizerFirst = equalizer.getEqNode(5);
      equalizerLast = equalizer.getEqNode(0);
      equalizer.loadPreset(equalizerSettings);
    }

    if (audioSettings.compressor) {
      compressor = audioContext.createDynamicsCompressor();
      makeupGain = audioContext.createGain();
      limiter = new LimiterNode(audioContext);
      compressor.threshold.value = compressorSettings.threshold;
      compressor.knee.value = compressorSettings.knee;
      compressor.ratio.value = compressorSettings.ratio;
      compressor.attack.value = compressorSettings.attack;
      compressor.release.value = compressorSettings.release;

      if (audioSettings.makeupGain) {
        const makeup = Math.abs(compressor.threshold.value) / compressor.ratio.value;
        makeupGain.gain.value = Math.pow(10, makeup / 20);
      }
    }

    if (mode === 'echoTest') {
      delay = audioContext.createDelay();
      delay.delayTime.value = echoTestSettings.delay;
      analyser.fftSize = echoTestSettings.fftSize;
    }

    const source = audioContext.createMediaStreamSource(audioStream);
    const destination = audioContext.createMediaStreamDestination();

    // Audio-Routing
    source.connect(rnnoise).connect(noiseGate).connect(equalizerFirst);

    if (!audioSettings.equalizer) equalizerFirst.connect(equalizerLast);

    equalizerLast
      .connect(compressor)
      .connect(makeupGain)
      .connect(limiter)
      .connect(delay)
      .connect(analyser)
      .connect(destination);

    const payload = {
      rnnoise: rnnoise,
      noiseGate: noiseGate,
      equalizer: equalizer,
      compressor: compressor,
      makeupGain: makeupGain,
      limiter: limiter,
      delay: delay,
      analyser: analyser,
    };
    // Dispatch the new audioStream and audioContext
    if (mode === 'live') dispatch({ type: 'UPDATE_AUDIO_STREAM', payload: destination.stream });
    dispatch({
      type: 'UPDATE_AUDIO_SETTINGS',
      payload: { ...audioSettings, audioContext: audioContext, echoTest: true },
    });
    dispatch({ type: 'UPDATE_AUDIO_NODES', payload: payload });

    return [analyser, destination.stream, audioContext];
  } catch (error) {
    console.log(error);
  }
}

export function closeAudioContext({ audioSettings }, dispatch) {
  if (audioSettings.audioContext) audioSettings.audioContext.close();

  const payload = {
    rnnoise: null,
    noiseGate: null,
    equalizer: null,
    compressor: null,
    makeupGain: null,
    limiter: null,
    delay: null,
    analyser: null,
  };

  dispatch({
    type: 'UPDATE_AUDIO_SETTINGS',
    payload: { ...audioSettings, audioContext: null, echoTest: false },
  });
  dispatch({ type: 'UPDATE_AUDIO_NODES', payload: payload });
}
