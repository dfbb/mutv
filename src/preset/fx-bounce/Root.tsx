import React from 'react';
import {Composition, CalculateMetadataFunction} from 'remotion';
import {BounceComposition} from './Composition';
import {MVInputProps, defaultProps} from '../../types';

const calculateMetadata: CalculateMetadataFunction<MVInputProps> = ({props}) => {
  const fps = props.fps;
  return {
    durationInFrames: Math.ceil(props.durationInSeconds * fps),
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
        component={BounceComposition}
        fps={defaultProps.fps}
        width={defaultProps.width}
        height={defaultProps.height}
        defaultProps={defaultProps}
        calculateMetadata={calculateMetadata}
      />
    </>
  );
};
