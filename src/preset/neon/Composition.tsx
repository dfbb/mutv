import React from 'react';
import {
  AbsoluteFill,
  Audio,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
  random,
} from 'remotion';
import {MVInputProps} from '../../types';
import {BackgroundLayer} from '../BackgroundLayer';
import {StudioControlBar} from '../StudioControlBar';
import {lyricsToData, LyricsLine, LyricWord} from '../lyricsToData';

// Neon / cyberpunk lyric overlay (ported from ai-music-video-maker's
// lyrics-overlay skill — LyricsOverlayNeon), adapted to props + image/audio.

const GLOW = '#FF00FF'; // magenta neon
const PRIMARY = '#E0E0E0';

const NeonWord: React.FC<{
  word: LyricWord;
  lineEnd: number;
  frame: number;
  fps: number;
  index: number;
  fontSize: number;
  glitchIntensity: number;
  seed: string;
}> = ({word, lineEnd, frame, fps, index, fontSize, glitchIntensity, seed}) => {
  const wordStartFrame = word.start * fps;
  const wordEndFrame = word.end * fps;
  const lineEndFrame = lineEnd * fps;
  const localFrame = frame - wordStartFrame;

  if (frame < wordStartFrame) {
    return (
      <span
        style={{
          opacity: 0.15,
          display: 'inline-block',
          color: PRIMARY,
          fontSize,
          filter: 'blur(2px)',
        }}
      >
        {word.word}
      </span>
    );
  }

  const isActive = frame >= wordStartFrame && frame <= wordEndFrame;
  const isPast = frame > wordEndFrame;
  const justAppeared = localFrame < 8;

  const scale = spring({frame: localFrame, fps, config: {damping: 10, stiffness: 200, mass: 0.3}});
  const glitchOffset = justAppeared
    ? random(`${seed}-glitch-${index}`) * 6 * glitchIntensity * (1 - localFrame / 8)
    : 0;
  const chromaOffset = isActive ? 2 : 0;
  const translateY = interpolate(localFrame, [0, 6], [25, 0], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(1.5)),
  });
  const opacity = interpolate(localFrame, [0, 4], [0, 1], {extrapolateRight: 'clamp'});

  const exitDuration = 35;
  const exitStart = lineEndFrame;
  const exitProgress = frame > exitStart
    ? interpolate(frame, [exitStart, exitStart + exitDuration], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
    : 0;
  const exitOpacity = 1 - exitProgress;
  const exitScale = 1 - exitProgress * 0.2;
  const exitBlur = exitProgress * 4;

  const flicker = isActive ? 0.9 + random(`${seed}-flicker-${frame % 5}`) * 0.1 : 1;
  const glowIntensity = isActive ? 1 : isPast ? 0.4 : 0.2;
  const textShadow = `0 0 ${10 * glowIntensity}px ${GLOW}, 0 0 ${20 * glowIntensity}px ${GLOW}, 0 0 ${40 * glowIntensity}px ${GLOW}, 0 0 ${80 * glowIntensity}px ${GLOW}88, 0 4px 20px rgba(0,0,0,0.9)`;

  return (
    <span style={{position: 'relative', display: 'inline-block', marginRight: 14}}>
      {isActive && (
        <>
          <span style={{position: 'absolute', left: -chromaOffset, top: 0, opacity: 0.7 * flicker, fontSize, fontWeight: 700, color: '#FF0066', filter: 'blur(1px)', transform: `translateY(${translateY + glitchOffset}px) scale(${scale * exitScale})`}}>{word.word}</span>
          <span style={{position: 'absolute', left: chromaOffset, top: 0, opacity: 0.7 * flicker, fontSize, fontWeight: 700, color: '#00FFFF', filter: 'blur(1px)', transform: `translateY(${translateY + glitchOffset}px) scale(${scale * exitScale})`}}>{word.word}</span>
        </>
      )}
      <span
        style={{
          position: 'relative',
          display: 'inline-block',
          opacity: opacity * exitOpacity * flicker,
          transform: `translateY(${translateY + glitchOffset}px) scale(${scale * exitScale})`,
          fontSize,
          fontWeight: 700,
          color: isActive ? '#FFFFFF' : PRIMARY,
          textShadow,
          filter: `blur(${exitBlur}px)`,
          letterSpacing: isActive ? '0.05em' : '0',
        }}
      >
        {word.word}
      </span>
    </span>
  );
};

// PLACEHOLDER_NEON_REST

const NeonLine: React.FC<{
  line: LyricsLine;
  frame: number;
  fps: number;
  fontSize: number;
  glitchIntensity: number;
  lineIndex: number;
}> = ({line, frame, fps, fontSize, glitchIntensity, lineIndex}) => {
  const lineStartFrame = line.lineStart * fps;
  const lineEndFrame = line.lineEnd * fps;
  if (frame < lineStartFrame - 5 || frame > lineEndFrame + 40) return null;
  return (
    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px 0'}}>
      {line.words.map((word, index) => (
        <NeonWord
          key={`${word.word}-${index}`}
          word={word}
          lineEnd={line.lineEnd}
          frame={frame}
          fps={fps}
          index={index}
          fontSize={fontSize}
          glitchIntensity={glitchIntensity}
          seed={`line-${lineIndex}-word-${index}`}
        />
      ))}
    </div>
  );
};

export const NeonComposition: React.FC<MVInputProps> = ({
  audioFileName,
  backgroundImage,
  backgroundVideo,
  backgroundAnim,
  backgroundCarousel,
  lyrics,
  lyricOffset,
}) => {
  const frame = useCurrentFrame();
  const {fps, height} = useVideoConfig();
  const data = lyricsToData(lyrics, lyricOffset);
  const fontSize = Math.round(height * 0.055);

  const audioSrc = audioFileName.startsWith('http') ? audioFileName : staticFile(audioFileName);

  return (
    <AbsoluteFill style={{fontFamily: '"Orbitron", "Rajdhani", system-ui, sans-serif', backgroundColor: '#0a0014'}}>
      <BackgroundLayer
        backgroundVideo={backgroundVideo}
        backgroundImage={backgroundImage}
        backgroundAnim={backgroundAnim}
        backgroundCarousel={backgroundCarousel}
        fallbackGradient="linear-gradient(135deg, #1a0033 0%, #0a0014 60%, #05000a 100%)"
      />
      <StudioControlBar />

      <Audio src={audioSrc} />

      {/* Bottom dark gradient for readability */}
      <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(to top, rgba(10,0,20,0.9) 0%, rgba(10,0,20,0.5) 60%, transparent 100%)', pointerEvents: 'none'}} />

      {/* Scanlines */}
      <div style={{position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)', pointerEvents: 'none', opacity: 0.3}} />

      <div style={{position: 'absolute', bottom: '12%', left: 60, right: 60}}>
        {data.lines.map((line, index) => (
          <NeonLine key={index} line={line} lineIndex={index} frame={frame} fps={fps} fontSize={fontSize} glitchIntensity={0.5} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

