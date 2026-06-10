import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {AudioViz} from './AudioViz';
import {padding} from './Dots';

export const Bottom: React.FC<{audioSrc: string; title: string}> = ({
	audioSrc,
	title,
}) => {
	const {height} = useVideoConfig();
	return (
		<AbsoluteFill>
			<div
				style={{
					position: 'absolute',
					bottom: padding / 2,
					left: padding + 22,
					display: 'flex',
					flexDirection: 'row',
					alignItems: 'flex-end',
				}}
			>
				<AudioViz audioSrc={audioSrc} />
				<h1
					style={{
						color: 'white',
						fontSize: Math.round((32 * height) / 720),
						marginBottom: 0,
						marginLeft: 20,
					}}
				>
					{title}
				</h1>
			</div>
		</AbsoluteFill>
	);
};
