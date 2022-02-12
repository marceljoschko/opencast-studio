//; -*- mode: rjsx;-*-
/** @jsx jsx */
import { jsx } from 'theme-ui';
// eslint-disable-next-line
import React from 'react';

export default function Switch({ echoTest, handleToggle, mode }) {
  return (
    <>
      <input
        onChange={handleToggle}
        className="react-switch-checkbox"
        id={'switch-' + mode}
        type="checkbox"
        disabled={echoTest ? 'disabled' : ''}
      />
      <label className="react-switch-label" htmlFor={'switch-' + mode}>
        <span className={'react-switch-button'} />
      </label>
    </>
  );
}
