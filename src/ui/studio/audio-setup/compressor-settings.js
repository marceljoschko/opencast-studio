//; -*- mode: rjsx;-*-
/** @jsx jsx */
import { jsx } from 'theme-ui';
// eslint-disable-next-line
import React, { useEffect, useRef } from 'react';
import Range from './Range';
import './Switch.css';
import { useStudioState, useDispatch } from '../../../studio-state';

export default function CompressorSettings({}) {
  const state = useStudioState();
  const dispatch = useDispatch();
  const reductionMeterRef = useRef();
  const reductionMeterLabelRef = useRef();
  const thresholdLabelRef = useRef();

  const { compressorSettings, audioNodes } = state;

  let requestID;

  const compressor = audioNodes.compressor;
  const makeupGain = audioNodes.makeupGain;
  const threshold = compressorSettings.threshold;

  useEffect(() => {
    if (compressor) {
      compressor.threshold.value = compressorSettings.threshold;
      if (!requestID) {
        loop();
      }
      if (compressorSettings.makeupGain) {
        const makeup = Math.abs(compressor.threshold.value) / compressor.ratio.value / 2;
        makeupGain.gain.value = Math.pow(10, makeup / 20);
      } else {
        makeupGain.gain.value = 1;
      }
    }
  }, [compressorSettings]);

  const loop = () => {
    if (compressor) {
      reductionMeterRef.current.value = Math.abs(compressor.reduction);
      reductionMeterLabelRef.current.innerText = Math.abs(compressor.reduction).toFixed(2);
      requestID = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(requestID);
    }
  };

  return (
    <>
      <div
        sx={{
          alignItems: 'center',
          justifyContent: 'center',
          display: 'flex',
          my: 3,
        }}
      >
        <div
          sx={{
            width: '60%',
          }}
        >
          <div
            sx={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>Threshold</span>
              <div
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  flexDirection: 'row',
                  width: '250px',
                  alignItems: 'center',
                }}
              >
                <Range
                  handleChange={(e) => {
                    dispatch({
                      type: 'UPDATE_COMPRESSOR_SETTINGS',
                      payload: { ...compressorSettings, threshold: parseInt(e.target.value) },
                    });
                  }}
                  min={0}
                  max={60}
                  value={threshold}
                  width={80}
                />
                <span
                  sx={{
                    paddingLeft: '20px',
                  }}
                >
                  {threshold - 60}
                </span>
              </div>
            </div>

            <div
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>Reduction</span>
              <div
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  flexDirection: 'row',
                  width: '250px',
                  alignItems: 'center',
                }}
              >
                <meter
                  ref={reductionMeterRef}
                  sx={{
                    width: '200px',
                    transform: 'rotate(180deg)',
                  }}
                  max="20"
                  min="0"
                />
                <span
                  sx={{
                    paddingLeft: '20px',
                  }}
                  ref={reductionMeterLabelRef}
                >
                  0.00
                </span>
              </div>
            </div>
            <div
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <label htmlFor={'make-up-gain'}>Make-up-Gain</label>
              <input
                onChange={(e) => {
                  dispatch({
                    type: 'UPDATE_COMPRESSOR_SETTINGS',
                    payload: { ...compressorSettings, makeupGain: e.target.checked },
                  });
                }}
                value={compressorSettings.makeupGain}
                id={'make-up-gain'}
                type="checkbox"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
