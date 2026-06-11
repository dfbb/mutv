import React from 'react';
import {Composition, CalculateMetadataFunction} from 'remotion';
import {AudioVisualization} from './AudioVisualization';
import {MVInputProps, defaultProps} from '../../types';

// Resolution and fps come from the input props (set via CLI --res / --fps).
// calculateMetadata lets the canvas size adapt per render without hardcoding it here.
const calculateMetadata: CalculateMetadataFunction<MVInputProps> = ({props}) => {
  const fps = props.fps;
  const durationInFrames = Math.ceil(props.durationInSeconds * fps);
  return {
    durationInFrames,
    fps,
    width: props.width,
    height: props.height,
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MusicVideo"
        component={AudioVisualization}
        fps={defaultProps.fps}
        width={defaultProps.width}
        height={defaultProps.height}
        defaultProps={defaultProps}
        calculateMetadata={calculateMetadata}
      />
    </>
  );
};
