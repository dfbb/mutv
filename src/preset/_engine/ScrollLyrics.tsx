import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {useAudioData, visualizeAudio} from '@remotion/media-utils';
import {MVInputProps} from '../../types';
import {BackgroundLayer} from '../_shared/BackgroundLayer';
import {StudioControlBar} from '../_shared/StudioControlBar';
import {FontLoader} from '../_shared/FontLoader';
import {TextColorOverride} from '../_shared/TextColorOverride';
import {buildLineInfo, currentLineIndex} from './timing.mjs';
import type {TextEffect, TextEffectApi} from './types';

// 滚动锚点引擎：当前行居中，远行缩小淡出，逐字卡拉OK。
// demo 主循环（example/lyrics-demo.html）的确定性 Remotion 版本——每帧独立计算，
// 无跨帧状态（Remotion 各帧并行渲染）。

const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOutSine = (x: number) => Math.sin(clamp(x, 0, 1) * Math.PI / 2);

export const ScrollLyrics: React.FC<MVInputProps & {effect: TextEffect}> = ({
  effect,
  audioFileName,
  backgroundImage,
  backgroundVideo,
  backgroundAnim,
  backgroundCarousel,
  lyrics,
  lyricOffset,
  fontFamily,
  fontFile,
  fontScale = 1,
  fontFgColor = '',
  fontBgColor = '',
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();

  const audioSrc = audioFileName.startsWith('http') ? audioFileName : staticFile(audioFileName);
  // hook 顺序必须稳定：无条件调用 useAudioData，仅在 needsAudio 时做昂贵计算。
  const audioData = useAudioData(audioSrc);

  const ms = (frame / fps) * 1000;
  const info = buildLineInfo(lyrics, lyricOffset);
  const cur = currentLineIndex(info, ms);
  const curForScroll = Math.max(cur, 0);

  const fontSize = Math.round(height * 0.055 * fontScale);
  const GAP = Math.round(fontSize * 2.1);
  const HALF = 3 * GAP;

  // bassEnergy：复现 demo 的 attack/decay 非对称滤波，从行起始确定性迭代到当前帧。
  let bassEnergy = 0;
  if (effect.needsAudio && audioData) {
    const fromFrame = cur >= 0 ? Math.floor(info[cur].start / 1000 * fps) : 0;
    let c = 0;
    for (let f = fromFrame; f <= frame; f++) {
      const spectrum = visualizeAudio({audioData, frame: f, fps, numberOfSamples: 32});
      const target = clamp((spectrum[0] + spectrum[1] + spectrum[2]) / 3 * 4, 0, 1);
      c += (target - c) * (target > c ? 0.2 : 0.05);
    }
    bassEnergy = c;
  }

  // 确定性滚动：每次切行后 450ms 内从上一行锚点缓动到当前行锚点。
  const anchor = (i: number) => height / 2 - (i * GAP + GAP / 2);
  const t = cur >= 0 ? clamp((ms - info[cur].start) / 450, 0, 1) : 1;
  const scrollY = lerp(anchor(Math.max(curForScroll - 1, 0)), anchor(curForScroll), easeOutSine(t));

  const api: TextEffectApi = {
    ms,
    cur,
    width,
    height,
    fontSize,
    GAP,
    HALF,
    DEFAULT_SCALE: 0.75,
    LONG_SYLLABLE: 700,
    FLOAT_PX: fontSize * 0.3,
    FLOAT_DUR: 450,
    clamp,
    lerp,
    easeOutSine,
    bassEnergy,
  };

  const extra = effect.frame?.(api);

  const ff = fontFamily ? `"${fontFamily}", serif` : '"Noto Serif SC", serif';

  const trackTransform = `translateY(${scrollY}px)` + (extra?.trackTransform ? ' ' + extra.trackTransform : '');

  return (
    <AbsoluteFill style={{backgroundColor: '#000', fontFamily: ff, perspective: extra?.stagePerspective}}>
      <BackgroundLayer
        backgroundVideo={backgroundVideo}
        backgroundImage={backgroundImage}
        backgroundAnim={backgroundAnim}
        backgroundCarousel={backgroundCarousel}
        fallbackGradient="#000"
      />
      <StudioControlBar />
      <FontLoader fontFamily={fontFamily} fontFile={fontFile} />
      <TextColorOverride fgColor={fontFgColor} bgColor={fontBgColor} />

      <Audio src={audioSrc} />

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          transform: trackTransform,
          transformOrigin: 'center center',
          maskImage: extra?.stageMask,
          WebkitMaskImage: extra?.stageMask,
        }}
      >
        {info.map((li, i) => {
          if (Math.abs(i - curForScroll) > 6) return null;
          const isCur = i === cur;
          const d = i - curForScroll;
          const df = clamp(Math.abs(d) * GAP / HALF, 0, 1);

          const r = effect.line?.(api, {i, isCur, d, df, info: li}) || {};
          const base = {
            scale: isCur ? 1 : 1 - df * 0.25,
            opacity: isCur ? 1 : clamp(1 - df, 0.06, 1),
            rotate: 0,
            origin: 'center center',
            ...r.base,
          };

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: i * GAP,
                height: GAP,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexWrap: 'wrap',
                textAlign: 'center',
                fontSize,
                lineHeight: 1.3,
                padding: '0 6%',
                color: isCur ? '#fff' : `rgba(255,255,255,${(0.4 * (1 - df * 0.7)).toFixed(3)})`,
                fontWeight: isCur ? 700 : 400,
                transformOrigin: base.origin,
                opacity: base.opacity,
                transform: `scale(${base.scale})` + (base.rotate ? ` rotate(${base.rotate}deg)` : ''),
                ...r.lineStyle,
              }}
            >
              {li.chars.map((ch, k) => (
                <span
                  key={k}
                  style={{display: 'inline-block', whiteSpace: 'pre', ...r.charStyles?.[k]}}
                >
                  {ch === ' ' ? '  ' : ch}
                </span>
              ))}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
