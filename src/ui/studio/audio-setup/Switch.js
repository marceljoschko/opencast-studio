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
        className="switch-checkbox"
        id={'switch-' + mode}
        type="checkbox"
        disabled={echoTest ? 'disabled' : ''}
      />
      <label className="switch-label" htmlFor={'switch-' + mode}>
        <span className={'switch-button'} />
      </label>
    </>
  );
}
