import React from 'react';
import {Composition} from 'remotion';
import type {CalculateMetadataFunction} from 'remotion';
import {MVInputProps, defaultProps} from '../../types';
import {ScrollLyrics} from './ScrollLyrics';
import type {TextEffect} from './types';

const calculateMetadata: CalculateMetadataFunction<MVInputProps> = ({props}) => ({
  durationInFrames: Math.ceil(props.durationInSeconds * props.fps),
  fps: props.fps,
  width: props.width,
  height: props.height,
});

// 为一个 text 类 preset 构造 Remotion Root 渲染函数（把效果定义注入 ScrollLyrics 引擎）。
// 实际的 registerRoot 调用放在各 preset 的 index.ts，因为 Remotion CLI 静态检查
// 要求"入口文件文本须含 registerRoot"。
export function registerTextPreset(effect: TextEffect): React.FC {
  const Comp: React.FC<MVInputProps> = (p) => <ScrollLyrics {...p} effect={effect} />;
  return () => (
    <Composition
      id="MusicVideo"
      component={Comp}
      fps={defaultProps.fps}
      width={defaultProps.width}
      height={defaultProps.height}
      defaultProps={defaultProps}
      calculateMetadata={calculateMetadata}
    />
  );
}
