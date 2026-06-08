import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  delayRender,
  continueRender,
} from 'remotion';
import {useAudioData} from '@remotion/media-utils';
import {floatWindowToBytes, FFT_SIZE} from '../lib/waveformBytes.mjs';

/**
 * WINAMP/butterchurn 动画背景。逐帧从音频波形取一个 FFT_SIZE 窗口,转 Uint8
 * 时域字节,经 delayRender 喂进 iframe 内的 __bcRenderAt(确定性、防黑帧)。
 * 音频未就绪或 iframe 未 ready 时静默降级。
 */
export const ButterchurnAnim: React.FC<{src: string; audioSrc: string}> = ({
  src,
  audioSrc,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const audioData = useAudioData(audioSrc);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  React.useEffect(() => {
    const handle = delayRender(`butterchurn frame ${frame}`);
    let cancelled = false;
    let raf = 0;

    const silent = new Uint8Array(FFT_SIZE).fill(128);
    let bytes = silent;
    if (audioData) {
      const wave = audioData.channelWaveforms[0];
      const start = Math.floor((frame / fps) * audioData.sampleRate);
      bytes = floatWindowToBytes(wave, start);
    }
    const elapsedTime = frame / fps;

    const tick = () => {
      if (cancelled) return;
      const win = iframeRef.current?.contentWindow as
        | (Window & {
            __bcReady?: boolean;
            __bcRenderAt?: (af: {
              timeByteArray: Uint8Array;
              timeByteArrayL: Uint8Array;
              timeByteArrayR: Uint8Array;
              elapsedTime: number;
            }) => void;
          })
        | undefined;
      if (win && win.__bcReady && typeof win.__bcRenderAt === 'function') {
        win.__bcRenderAt({
          timeByteArray: bytes,
          timeByteArrayL: bytes,
          timeByteArrayR: bytes,
          elapsedTime,
        });
        raf = requestAnimationFrame(() => {
          if (!cancelled) continueRender(handle);
        });
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      continueRender(handle);
    };
  }, [frame, fps, audioData]);

  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <iframe
        ref={iframeRef}
        src={src}
        style={{width: '100%', height: '100%', border: 'none'}}
      />
    </AbsoluteFill>
  );
};
