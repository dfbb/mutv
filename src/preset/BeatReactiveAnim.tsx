import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  delayRender,
  continueRender,
} from 'remotion';
import {useAudioData, visualizeAudio} from '@remotion/media-utils';
import {bandSums, createBeatState, beatStyle} from '../lib/beatLevels.mjs';

const NUM_SAMPLES = 512;

type Levels = {bass: number; mid: number; treb: number};
type FrameData = {levels: Levels; virtualTimeMs: number};
type Cache = {
  state: ReturnType<typeof createBeatState>;
  frames: FrameData[];
  vtMs: number;
};
const caches = new Map<string, Cache>();

function getFrameData(
  audioData: NonNullable<ReturnType<typeof useAudioData>>,
  frame: number,
  fps: number
): FrameData {
  let cache = caches.get(audioData.resultId);
  if (!cache) {
    cache = {state: createBeatState(fps), frames: [], vtMs: 0};
    caches.set(audioData.resultId, cache);
  }
  for (let f = cache.frames.length; f <= frame; f++) {
    const spectrum = visualizeAudio({
      fps,
      frame: f,
      audioData,
      numberOfSamples: NUM_SAMPLES,
      optimizeFor: 'speed',
    });
    const imm = bandSums(spectrum, audioData.sampleRate);
    const levels = cache.state.step(imm, f);
    const {timeGain} = beatStyle(levels);
    cache.vtMs += (1000 / fps) * timeGain;
    cache.frames[f] = {levels, virtualTimeMs: cache.vtMs};
  }
  return cache.frames[frame];
}

/**
 * 节拍反应动画背景。
 * @param src     anim HTML 文件名(public/)或 http URL
 * @param audioSrc 音频文件名(public/)或 http URL,用于取频谱
 */
export const BeatReactiveAnim: React.FC<{src: string; audioSrc: string}> = ({
  src,
  audioSrc,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const audioData = useAudioData(audioSrc);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  // 音频未就绪:中性基线(scale=1 等),iframe 照常显示,不阻塞。
  const data: FrameData = audioData
    ? getFrameData(audioData, frame, fps)
    : {levels: {bass: 1, mid: 1, treb: 1}, virtualTimeMs: (frame / fps) * 1000};

  const st = beatStyle(data.levels);

  // 时钟通道:每帧把虚拟时间喂进 iframe,等一帧绘制后再放行截图。
  React.useEffect(() => {
    const handle = delayRender(`beat frame ${frame}`);
    let cancelled = false;
    let raf = 0;
    const tick = () => {
      if (cancelled) return;
      const win = iframeRef.current?.contentWindow as
        | (Window & {__beatTick?: (ms: number) => void})
        | undefined;
      if (win && typeof win.__beatTick === 'function') {
        win.__beatTick(data.virtualTimeMs);
        raf = requestAnimationFrame(() => {
          if (!cancelled) continueRender(handle);
        });
        return;
      }
      // iframe 未注入 __beatTick(未加载完/模板异常):跳过时钟通道,直接放行。
      continueRender(handle);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      continueRender(handle);
    };
  }, [frame, data.virtualTimeMs]);

  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <iframe
        ref={iframeRef}
        src={src}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          transformOrigin: 'center center',
          transform: `scale(${st.scale})`,
          filter: `brightness(${st.brightness}) saturate(${st.saturate})`,
          willChange: 'transform, filter',
        }}
      />
    </AbsoluteFill>
  );
};
