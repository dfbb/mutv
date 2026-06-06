import React from 'react';
import {Composition, CalculateMetadataFunction} from 'remotion';
import {MyComposition} from './Composition';
import {MVInputProps, defaultProps} from '../../types';

// Resolution / fps / duration come from the input props (set via CLI).
// Same contract as preset/orig so the shared render.mjs ("MusicVideo") works unchanged.
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
				component={MyComposition}
				fps={defaultProps.fps}
				width={defaultProps.width}
				height={defaultProps.height}
				defaultProps={defaultProps}
				calculateMetadata={calculateMetadata}
			/>
		</>
	);
};
