//; -*- mode: rjsx;-*-
/** @jsx jsx */
import { jsx } from 'theme-ui';
// eslint-disable-next-line
import React, { useRef, useEffect } from 'react';
import { useStudioState, useDispatch } from '../../../studio-state';
import Range from './range';
import './audio-setup.css';

// Equalizer settings for changing parameters and visualizing the magnitude in a canvas
export default function EqualizerSettings({}) {
  const state = useStudioState();
  const dispatch = useDispatch();
  const canvasRef = useRef();

  const { audioNodes, equalizerSettings, selectedFilter } = state;

  const currentFilter = selectedFilter.filter;
  const currentFreq = selectedFilter.freq;
  const currentGain = selectedFilter.gain;
  const currentQ = selectedFilter.q;

  const equalizer = audioNodes.equalizer;
  let curveColor = '#f1c40f';
  let gridColor = 'rgb(100,100,100)';
  let textColor = 'rgb(81,127,207)';
  let dbScale = 12;
  let noctaves = 12;
  let nyquist = 0.5 * 44100;

  // draws the current curve of all equalizer magnitudes combined in the canvas
  const drawCurve = () => {
    const canvas = canvasRef.current;
    let width = canvas.width;
    let height = canvas.height;
    const canvasContext = canvas.getContext('2d');
    canvasContext.clearRect(0, 0, width, height);

    let frequencyHz = new Float32Array(width);

    const dbToY = (db) => {
      let y = 0.5 * height - pixelsPerDb * db;
      return y;
    };

    let pixelsPerDb = (0.5 * height) / dbScale;

    canvasContext.beginPath();
    canvasContext.lineWidth = 1;
    canvasContext.strokeStyle = gridColor;

    // Draw frequency scale.
    for (let octave = 0; octave <= noctaves; octave++) {
      let x = (octave * width) / noctaves;

      canvasContext.strokeStyle = gridColor;
      canvasContext.moveTo(x, 0);
      canvasContext.lineTo(x, height);
      canvasContext.stroke();

      canvasContext.textAlign = 'center';
      canvasContext.strokeStyle = gridColor;
    }

    // Draw 0dB line.
    canvasContext.beginPath();
    canvasContext.moveTo(0, 0.5 * height);
    canvasContext.lineTo(width, 0.5 * height);
    canvasContext.stroke();

    // Draw decibel scale.
    for (let db = -dbScale; db <= dbScale; db += 6) {
      let y = dbToY(db);
      canvasContext.strokeStyle = textColor;
      canvasContext.strokeStyle = gridColor;
      canvasContext.beginPath();
      canvasContext.moveTo(0, y);
      canvasContext.lineTo(width, y);
      canvasContext.stroke();
    }
    canvasContext.strokeStyle = curveColor;
    canvasContext.lineWidth = 3;
    canvasContext.beginPath();
    canvasContext.moveTo(0, 0);

    // First get response.
    for (let i = 0; i < width; ++i) {
      let f = i / width;
      f = nyquist * Math.pow(2.0, noctaves * (f - 1.0));
      frequencyHz[i] = f;
    }

    let dbResponse = getEqResponse(frequencyHz);

    for (let i = 0; i < width; ++i) {
      let x = i;
      let y = dbToY(dbResponse[i]);
      if (i === 0) canvasContext.moveTo(x, y);
      else canvasContext.lineTo(x, y);
    }

    canvasContext.stroke();
  };

  // returns an array of combined magnitude values of all filter bands
  const getEqResponse = (frequencies) => {
    const magCombined = new Float32Array(frequencies.length);
    const magCurrent = new Float32Array(frequencies.length);
    const phaseCurrent = new Float32Array(frequencies.length);

    if (equalizer) {
      for (let i = 0; i < equalizer.eqNodes.length; i++) {
        equalizer.eqNodes[i].getFrequencyResponse(frequencies, magCurrent, phaseCurrent);

        for (let j = 0; j < frequencies.length; j++) {
          let magDb = 20.0 * Math.log10(magCurrent[j]);
          magCombined[j] += magDb;
        }
      }
    }

    return magCombined;
  };

  const choosePreset = async (option) => {
    switch (option) {
      case 'female':
        await fetch('eq-presets/female.json')
          .then((response) => response.json())
          .then((json) => equalizer.loadPreset(json));
        break;
      case 'male':
        await fetch('eq-presets/male.json')
          .then((response) => response.json())
          .then((json) => equalizer.loadPreset(json));
        break;
      case 'init':
        await fetch('eq-presets/init.json')
          .then((response) => response.json())
          .then((json) => equalizer.loadPreset(json));
        break;
      default:
        console.log('no option');
    }

    dispatch({
      type: 'UPDATE_EQUALIZER_SETTINGS',
      payload: equalizer.getSettings(),
    });
    updateCurrent();
    drawCurve();
  };

  // updates the selectedFilter with new filter band values
  const updateCurrent = () => {
    const filterName = 'filter' + currentFilter;
    const payload = {
      ...selectedFilter,
      freq: equalizerSettings[filterName].freq,
      gain: equalizerSettings[filterName].gain,
      q: equalizerSettings[filterName].q.toFixed(1),
    };
    dispatch({
      type: 'UPDATE_SELECTED_FILTER',
      payload: payload,
    });
  };

  useEffect(() => {
    if (equalizer) {
      drawCurve();
      updateCurrent();
    }
  }, [audioNodes]);

  useEffect(() => {
    if (equalizer) {
      updateCurrent();
      drawCurve();
    }
  }, [currentFilter]);

  return (
    <>
      <div
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '90%',
          }}
        >
          <div
            sx={{
              display: 'flex',
              flexDirection: 'row',
              marginBottom: '8px',
            }}
          >
            <span>Presets:</span>
            <select
              sx={{ width: '100px', marginLeft: '23px' }}
              onChange={(e) => {
                if (equalizer) {
                  choosePreset(e.target.value);
                }
              }}
            >
              <option value="init">Init</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </div>
          <canvas
            ref={canvasRef}
            sx={{
              display: 'flex',
              bg: 'rgba(0,0,0,0.8)',
              borderRadius: '8px',
            }}
            width="600"
            height="240"
          />
          <div
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: '16px',
              marginBottom: '8px',
            }}
          >
            <button
              sx={{
                width: '106px',
                fontWeight: '300',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                color: currentFilter === 0 ? 'white' : 'black',
                backgroundColor: currentFilter === 0 ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0)',
                paddingLeft: '16px',
                paddingRight: '16px',
                paddingTop: '8px',
                paddingBottom: '8px',
                '&:hover': {
                  backgroundColor:
                    currentFilter === 0 ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.1)',
                },
              }}
              onClick={() => {
                dispatch({
                  type: 'UPDATE_SELECTED_FILTER',
                  payload: { ...selectedFilter, filter: 0 },
                });
              }}
            >
              Band 1
            </button>
            <button
              sx={{
                width: '106px',
                fontWeight: '300',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                color: currentFilter === 1 ? 'white' : 'black',
                backgroundColor: currentFilter === 1 ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0)',
                paddingLeft: '16px',
                paddingRight: '16px',
                paddingTop: '8px',
                paddingBottom: '8px',
                '&:hover': {
                  backgroundColor:
                    currentFilter === 1 ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.1)',
                },
              }}
              onClick={() => {
                dispatch({
                  type: 'UPDATE_SELECTED_FILTER',
                  payload: { ...selectedFilter, filter: 1 },
                });
              }}
            >
              Band 2
            </button>
            <button
              sx={{
                width: '106px',
                fontWeight: '300',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                color: currentFilter === 2 ? 'white' : 'black',
                backgroundColor: currentFilter === 2 ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0)',
                paddingLeft: '16px',
                paddingRight: '16px',
                paddingTop: '8px',
                paddingBottom: '8px',
                '&:hover': {
                  backgroundColor:
                    currentFilter === 2 ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.1)',
                },
              }}
              onClick={() => {
                dispatch({
                  type: 'UPDATE_SELECTED_FILTER',
                  payload: { ...selectedFilter, filter: 2 },
                });
              }}
            >
              Band 3
            </button>
            <button
              sx={{
                width: '106px',
                fontWeight: '300',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                color: currentFilter === 3 ? 'white' : 'black',
                backgroundColor: currentFilter === 3 ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0)',
                paddingLeft: '16px',
                paddingRight: '16px',
                paddingTop: '8px',
                paddingBottom: '8px',
                '&:hover': {
                  backgroundColor:
                    currentFilter === 3 ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.1)',
                },
              }}
              onClick={() => {
                dispatch({
                  type: 'UPDATE_SELECTED_FILTER',
                  payload: { ...selectedFilter, filter: 3 },
                });
              }}
            >
              Band 4
            </button>
            <button
              sx={{
                width: '106px',
                fontWeight: '300',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                color: currentFilter === 4 ? 'white' : 'black',
                backgroundColor: currentFilter === 4 ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0)',
                paddingLeft: '16px',
                paddingRight: '16px',
                paddingTop: '8px',
                paddingBottom: '8px',
                '&:hover': {
                  backgroundColor:
                    currentFilter === 4 ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.1)',
                },
              }}
              onClick={() => {
                dispatch({
                  type: 'UPDATE_SELECTED_FILTER',
                  payload: { ...selectedFilter, filter: 4 },
                });
              }}
            >
              Band 5
            </button>
            <button
              sx={{
                width: '106px',
                fontWeight: '300',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                color: currentFilter === 5 ? 'white' : 'black',
                backgroundColor: currentFilter === 5 ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0)',
                paddingLeft: '16px',
                paddingRight: '16px',
                paddingTop: '8px',
                paddingBottom: '8px',
                '&:hover': {
                  backgroundColor:
                    currentFilter === 5 ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.1)',
                },
              }}
              onClick={() => {
                dispatch({
                  type: 'UPDATE_SELECTED_FILTER',
                  payload: { ...selectedFilter, filter: 5 },
                });
              }}
            >
              Band 6
            </button>
          </div>
          <hr
            sx={{
              width: '100%',
              backgroundColor: 'rgb(0,0,0,0.5)',
            }}
          />
          <div
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <div
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <span>Freq</span>
              <Range
                handleChange={(e) => {
                  dispatch({
                    type: 'UPDATE_SELECTED_FILTER',
                    payload: { ...selectedFilter, freq: parseInt(e.target.value) },
                  });
                  if (equalizer) {
                    equalizer.frequencyHandler(currentFilter, currentFreq);
                    drawCurve();
                  }
                }}
                min={20}
                max={20000}
                value={currentFreq}
                width={100}
                margin={8}
              />
              <span>{currentFreq}</span>
            </div>
            <div
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <span>Gain</span>
              <Range
                handleChange={(e) => {
                  dispatch({
                    type: 'UPDATE_SELECTED_FILTER',
                    payload: { ...selectedFilter, gain: parseInt(e.target.value - 12) },
                  });
                  if (equalizer) {
                    equalizer.gainHandler(currentFilter, currentGain);
                    drawCurve();
                  }
                }}
                min={0}
                max={24}
                value={currentGain + 12}
                width={100}
                margin={8}
              />
              <span>{currentGain}</span>
            </div>
            <div
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <span>Q</span>
              <Range
                handleChange={(e) => {
                  dispatch({
                    type: 'UPDATE_SELECTED_FILTER',
                    payload: { ...selectedFilter, q: parseFloat(e.target.value) },
                  });
                  if (equalizer) {
                    equalizer.resonanceHandler(currentFilter, currentQ);
                    drawCurve();
                  }
                }}
                min={0}
                max={2}
                value={currentQ}
                steps={0.1}
                width={100}
                margin={8}
              />
              <span>{currentQ}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
