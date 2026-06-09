import React from 'react';
import {
  AbsoluteFill,
  Audio,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  random,
} from 'remotion';
import {MVInputProps} from '../../types';
import {BackgroundLayer} from '../BackgroundLayer';
import {StudioControlBar} from '../StudioControlBar';
import {FontLoader} from '../FontLoader';
import {lyricsToData, LyricsLine, LyricWord} from '../lyricsToData';

// Playful bounce lyric overlay (ported from ai-music-video-maker's
// lyrics-overlay skill — LyricsOverlayBounce), adapted to props + image/audio.

const HIGHLIGHT = '#FFFFFF';
const BOUNCE = 0.7;
const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#A8D8EA'];

const BounceWord: React.FC<{
  word: LyricWord;
  lineEnd: number;
  frame: number;
  fps: number;
  index: number;
  fontSize: number;
  seed: string;
}> = ({word, lineEnd, frame, fps, index, fontSize, seed}) => {
  const wordStartFrame = word.start * fps;
  const wordEndFrame = word.end * fps;
  const lineEndFrame = lineEnd * fps;
  const localFrame = frame - wordStartFrame;

  if (frame < wordStartFrame) {
    return <span style={{opacity: 0, display: 'inline-block'}}>{word.word}</span>;
  }

  const isActive = frame >= wordStartFrame && frame <= wordEndFrame;

  const startY = (random(`${seed}-y`) - 0.5) * 100 * BOUNCE;
  const startX = (random(`${seed}-x`) - 0.5) * 40 * BOUNCE;
  const startRotation = (random(`${seed}-rot`) - 0.5) * 30 * BOUNCE;

  const springProgress = spring({frame: localFrame, fps, config: {damping: 8, stiffness: 180, mass: 0.4}});
  const translateY = interpolate(springProgress, [0, 1], [startY + 60, 0]);
  const translateX = interpolate(springProgress, [0, 1], [startX, 0]);
  const rotation = interpolate(springProgress, [0, 1], [startRotation, 0]);
  const scale = spring({frame: localFrame, fps, config: {damping: 6, stiffness: 200, mass: 0.3}});

  const activeBounce = isActive ? Math.sin(localFrame * 0.5) * 3 : 0;

  const exitDuration = 35;
  const exitStart = lineEndFrame;
  const exitProgress = frame > exitStart
    ? interpolate(frame, [exitStart, exitStart + exitDuration], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
    : 0;
  const exitY = exitProgress * -50;
  const exitOpacity = 1 - exitProgress;
  const exitScale = 1 - exitProgress * 0.3;

  const opacity = interpolate(localFrame, [0, 5], [0, 1], {extrapolateRight: 'clamp'});
  const wordColor = isActive ? HIGHLIGHT : colors[index % colors.length];
  const textShadow = isActive
    ? `0 0 20px ${HIGHLIGHT}, 0 0 40px ${HIGHLIGHT}66, 0 4px 15px rgba(0,0,0,0.8)`
    : `0 4px 15px rgba(0,0,0,0.6), 0 0 10px ${wordColor}44`;

  return (
    <span
      style={{
        display: 'inline-block',
        opacity: opacity * exitOpacity,
        transform: `translateY(${translateY + activeBounce + exitY}px) translateX(${translateX}px) rotate(${rotation}deg) scale(${scale * exitScale})`,
        fontSize,
        fontWeight: 700,
        color: wordColor,
        textShadow,
        marginRight: 12,
      }}
    >
      {word.word}
    </span>
  );
};

// PLACEHOLDER_BOUNCE_REST

const BounceLine: React.FC<{
  line: LyricsLine;
  frame: number;
  fps: number;
  fontSize: number;
  lineIndex: number;
}> = ({line, frame, fps, fontSize, lineIndex}) => {
  const lineStartFrame = line.lineStart * fps;
  const lineEndFrame = line.lineEnd * fps;
  if (frame < lineStartFrame - 5 || frame > lineEndFrame + 40) return null;
  return (
    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '8px 0'}}>
      {line.words.map((word, index) => (
        <BounceWord key={`${word.word}-${index}`} word={word} lineEnd={line.lineEnd} frame={frame} fps={fps} index={index} fontSize={fontSize} seed={`line-${lineIndex}-word-${index}`} />
      ))}
    </div>
  );
};

export const BounceComposition: React.FC<MVInputProps> = ({
  audioFileName,
  backgroundImage,
  backgroundVideo,
  backgroundAnim,
  backgroundCarousel,
  lyrics,
  lyricOffset,
  fontFamily,
  fontFile,
}) => {
  const frame = useCurrentFrame();
  const {fps, height} = useVideoConfig();
  const data = lyricsToData(lyrics, lyricOffset);
  const fontSize = Math.round(height * 0.059);
  const ff = (base: string) => (fontFamily ? `"${fontFamily}", ${base}` : base);

  const audioSrc = audioFileName.startsWith('http') ? audioFileName : staticFile(audioFileName);

  return (
    <AbsoluteFill style={{fontFamily: ff('"Fredoka One", "Bubblegum Sans", "Comic Sans MS", cursive'), backgroundColor: '#10131a'}}>
      <BackgroundLayer
        backgroundVideo={backgroundVideo}
        backgroundImage={backgroundImage}
        backgroundAnim={backgroundAnim}
        backgroundCarousel={backgroundCarousel}
        fallbackGradient="linear-gradient(135deg, #2b1055 0%, #7597de 100%)"
      />
      <StudioControlBar />
      <FontLoader fontFamily={fontFamily} fontFile={fontFile} />

      <Audio src={audioSrc} />

      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)', pointerEvents: 'none'}} />

      <div style={{position: 'absolute', top: '50%', left: 60, right: 60, transform: 'translateY(-50%)', textAlign: 'center'}}>
        {data.lines.map((line, index) => (
          <BounceLine key={index} line={line} lineIndex={index} frame={frame} fps={fps} fontSize={fontSize} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

