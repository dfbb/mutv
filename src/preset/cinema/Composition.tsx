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
} from 'remotion';
import {MVInputProps} from '../../types';
import {BackgroundLayer} from '../BackgroundLayer';
import {lyricsToData, LyricsLine, LyricWord} from '../lyricsToData';

// Cinematic / movie-trailer lyric overlay (ported from ai-music-video-maker's
// lyrics-overlay skill — LyricsOverlayCinematic), adapted to props + image/audio.

const ACCENT = '#FFD700'; // gold
const PRIMARY = '#E8E8E8';
const LETTER_SPACING = 0.15;

const CinemaWord: React.FC<{
  word: LyricWord;
  lineEnd: number;
  frame: number;
  fps: number;
  fontSize: number;
}> = ({word, lineEnd, frame, fps, fontSize}) => {
  const wordStartFrame = word.start * fps;
  const wordEndFrame = word.end * fps;
  const lineEndFrame = lineEnd * fps;
  const localFrame = frame - wordStartFrame;

  if (frame < wordStartFrame - 10) return null;

  const isActive = frame >= wordStartFrame && frame <= wordEndFrame;
  const isPast = frame > wordEndFrame;

  const entranceScale = spring({frame: Math.max(0, localFrame), fps, config: {damping: 15, stiffness: 100, mass: 0.8}});
  const preEntranceScale = frame < wordStartFrame
    ? interpolate(frame, [wordStartFrame - 10, wordStartFrame], [2.5, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
    : 1;
  const preEntranceOpacity = frame < wordStartFrame
    ? interpolate(frame, [wordStartFrame - 10, wordStartFrame], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
    : 1;

  const exitDuration = 45;
  const exitStart = lineEndFrame;
  const exitProgress = frame > exitStart
    ? interpolate(frame, [exitStart, exitStart + exitDuration], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)})
    : 0;
  const exitScale = 1 + exitProgress * 0.15;
  const exitOpacity = 1 - exitProgress;

  const blur = frame < wordStartFrame
    ? interpolate(frame, [wordStartFrame - 10, wordStartFrame], [8, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
    : exitProgress * 4;

  const glowIntensity = isActive ? 40 : isPast ? 15 : 25;
  const textShadow = `0 0 ${glowIntensity}px ${ACCENT}, 0 0 ${glowIntensity * 2}px ${ACCENT}88, 0 0 ${glowIntensity * 3}px ${ACCENT}44, 0 8px 30px rgba(0,0,0,0.9)`;

  const finalScale = preEntranceScale * entranceScale * exitScale;
  const finalOpacity = preEntranceOpacity * exitOpacity;

  return (
    <span
      style={{
        display: 'inline-block',
        opacity: finalOpacity,
        transform: `scale(${finalScale})`,
        fontSize,
        fontWeight: 800,
        color: isActive ? '#FFFFFF' : PRIMARY,
        textShadow,
        filter: `blur(${blur}px)`,
        letterSpacing: `${LETTER_SPACING}em`,
        textTransform: 'uppercase',
        marginRight: 20,
      }}
    >
      {word.word}
    </span>
  );
};

// PLACEHOLDER_CINEMA_REST

const CinemaLine: React.FC<{
  line: LyricsLine;
  frame: number;
  fps: number;
  fontSize: number;
}> = ({line, frame, fps, fontSize}) => {
  const lineStartFrame = line.lineStart * fps;
  const lineEndFrame = line.lineEnd * fps;
  if (frame < lineStartFrame - 15 || frame > lineEndFrame + 50) return null;
  return (
    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap'}}>
      {line.words.map((word, index) => (
        <CinemaWord key={`${word.word}-${index}`} word={word} lineEnd={line.lineEnd} frame={frame} fps={fps} fontSize={fontSize} />
      ))}
    </div>
  );
};

export const CinemaComposition: React.FC<MVInputProps> = ({
  audioFileName,
  backgroundImage,
  backgroundVideo,
  backgroundAnimHtml,
  lyrics,
  lyricOffset,
}) => {
  const frame = useCurrentFrame();
  const {fps, height} = useVideoConfig();
  const data = lyricsToData(lyrics, lyricOffset);
  const fontSize = Math.round(height * 0.083);

  const audioSrc = audioFileName.startsWith('http') ? audioFileName : staticFile(audioFileName);

  return (
    <AbsoluteFill style={{fontFamily: '"Bebas Neue", "Anton", Impact, sans-serif', backgroundColor: '#000'}}>
      <BackgroundLayer
        backgroundVideo={backgroundVideo}
        backgroundImage={backgroundImage}
        backgroundAnimHtml={backgroundAnimHtml}
        fallbackGradient="radial-gradient(ellipse at center, #1a1a1a 0%, #000 100%)"
      />

      <Audio src={audioSrc} />

      {/* Cinematic letterbox bars */}
      <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: '15%', background: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, transparent 100%)'}} />
      <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: '15%', background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)'}} />

      {/* Vignette */}
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)', pointerEvents: 'none'}} />

      <div style={{position: 'absolute', top: '50%', left: 80, right: 80, transform: 'translateY(-50%)', textAlign: 'center'}}>
        {data.lines.map((line, index) => (
          <CinemaLine key={index} line={line} frame={frame} fps={fps} fontSize={fontSize} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

