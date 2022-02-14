//; -*- mode: rjsx;-*-
/** @jsx jsx */
import { jsx } from 'theme-ui';
// eslint-disable-next-line
import React from 'react';

export default function Range({ handleChange, min, max, value, steps = 1, width, margin }) {
  const getBackgroundSize = () => {
    return {
      backgroundSize: `${(value * 100) / max}% 100%`,
      width: `${width}%`,
      marginBottom: `${margin}px`,
      marginTop: `${margin}px`,
    };
  };

  return (
    <>
      <input
        type="range"
        onChange={handleChange}
        min={min}
        max={max}
        value={value}
        step={steps}
        style={getBackgroundSize()}
      />
    </>
  );
}
