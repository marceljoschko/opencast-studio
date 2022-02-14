//; -*- mode: rjsx;-*-
/** @jsx jsx */
import { jsx } from 'theme-ui';
import { Fragment, useRef } from 'react';
import { useStudioState, useDispatch } from '../../../studio-state';

import { createAudioContext, closeAudioContext } from './audio-context';

export default function EchoTest() {
  const state = useStudioState();
  const dispatch = useDispatch();
  const peakMeterRef = useRef();
  const echoTestRef = useRef();
  const peakMeterLabelRef = useRef();

  const { audioSettings, audioNodes } = state;
  let sampleBuffer, requestID, analyser, stream;

  const toggleEchoTest = () => {
    if (!audioSettings.echoTest) handleAudio();
    else stopEchoTest();
  };

  const startEchoTest = (newState) => {
    echoTestRef.current.innerText = 'Stop';

    analyser = newState[0];
    sampleBuffer = new Float32Array(analyser.fftSize);

    const audio = new Audio();
    stream = newState[1];
    audio.srcObject = newState[1];
    audio.play();

    loop();
  };

  const handleAudio = async () => {
    const newState = await createAudioContext(state, dispatch, 'echoTest');
    startEchoTest(newState);
  };

  const stopEchoTest = async () => {
    closeAudioContext(state, dispatch);

    echoTestRef.current.innerText = 'Echo-Test';
    peakMeterRef.current.value = peakMeterRef.current.min;
    peakMeterLabelRef.current.textContent = '-inf dB';
    cancelAnimationFrame(requestID);
    requestID = null;
    analyser = null;
    sampleBuffer = null;
  };

  const displayNumber = (value) => {
    peakMeterRef.current.value = value.toFixed(2);
    peakMeterLabelRef.current.textContent = value.toFixed(1) + ' dB';
  };

  const loop = () => {
    try {
      if (analyser) {
        analyser.getFloatTimeDomainData(sampleBuffer);

        // Compute peak instantaneous power over the interval.
        let peakInstantaneousPower = 0;
        for (let i = 0; i < sampleBuffer.length; i++) {
          const power = sampleBuffer[i] ** 2;
          peakInstantaneousPower = Math.max(power, peakInstantaneousPower);
        }
        const peakInstantaneousPowerDecibels = 10 * Math.log10(peakInstantaneousPower);

        if (isFinite(peakInstantaneousPowerDecibels)) displayNumber(peakInstantaneousPowerDecibels);
        else displayNumber(peakMeterRef.current.min);

        requestID = requestAnimationFrame(loop);
      }
    } catch (error) {
      cancelAnimationFrame(requestID);
      requestID = null;
    }
  };

  // FRAGMENTS

  let echoTest = (
    <Fragment>
      <div
        sx={{
          marginTop: '32px',
          marginBottom: '16px',
          display: 'flex',
          flexDirection: 'row',
          width: '80%',
          justifyContent: 'space-between',
        }}
      >
        <div
          sx={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <button
            ref={echoTestRef}
            onClick={toggleEchoTest}
            sx={{
              width: '106px',
              border: '1px solid',
              borderRadius: '4px',
              fontSize: '16px',
              color: 'white',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              paddingLeft: '16px',
              paddingRight: '16px',
              paddingTop: '8px',
              paddingBottom: '8px',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
              },
            }}
          >
            Echo-Test
          </button>
        </div>
        <div
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '78%',
          }}
        >
          <meter
            sx={{
              display: 'flex',
              width: '450px',
              height: '100%',
            }}
            ref={peakMeterRef}
            min="-50"
            low="-50"
            high="-10"
            max="0"
            value="-50"
          ></meter>
          <span
            sx={{
              display: 'flex',
              paddingLeft: '20px',
            }}
            ref={peakMeterLabelRef}
          >
            -inf dB
          </span>
        </div>
      </div>
    </Fragment>
  );

  return <Fragment>{echoTest}</Fragment>;
}
