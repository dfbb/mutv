import React from 'react';
import {
  AbsoluteFill,
  Audio,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from 'remotion';
import {MVInputProps} from '../../types';
import {BackgroundLayer} from '../BackgroundLayer';
import {lyricsToData, LyricsLine} from '../lyricsToData';

// Typewriter / retro lyric overlay (ported from ai-music-video-maker's
// lyrics-overlay skill — LyricsOverlayTypewriter, "classic" theme),
// adapted to props + image/audio.

const TEXT_COLOR = '#FFFFFF';
const CURSOR_COLOR = '#FFFFFF';
const TYPE_SPEED = 20; // chars per second

const TypewriterLine: React.FC<{
  line: LyricsLine;
  frame: number;
  fps: number;
  fontSize: number;
}> = ({line, frame, fps, fontSize}) => {
  const lineStartFrame = line.lineStart * fps;
  const lineEndFrame = line.lineEnd * fps;
  if (frame < lineStartFrame || frame > lineEndFrame + 45) return null;

  // CJK lines have single-char "words" and need no separators; otherwise space-join.
  const isCJK = line.words.every((w) => Array.from(w.word).length === 1);
  const sep = isCJK ? '' : ' ';
  const fullText = line.words.map((w) => w.word).join(sep);
  const framesPerChar = fps / TYPE_SPEED;

  const localFrame = frame - lineStartFrame;
  const charsToShow = Math.floor(localFrame / framesPerChar);
  const visibleText = fullText.slice(0, Math.min(charsToShow, fullText.length));
  const isTyping = charsToShow < fullText.length;

  // Current word index by time.
  let currentWordIndex = -1;
  for (let i = 0; i < line.words.length; i++) {
    const w = line.words[i];
    if (frame >= w.start * fps && frame <= w.end * fps) {
      currentWordIndex = i;
      break;
    }
  }

  const exitStart = lineEndFrame;
  const exitProgress = frame > exitStart
    ? interpolate(frame, [exitStart, exitStart + 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
    : 0;
  const exitOpacity = 1 - exitProgress;
  const cursorVisible = isTyping && Math.floor(frame / 8) % 2 === 0;

  const renderText = () => {
    let charIdx = 0;
    return line.words.map((word, wordIdx) => {
      const wordStart = charIdx;
      const wordEnd = charIdx + word.word.length;
      charIdx = wordEnd + sep.length;
      if (wordStart >= visibleText.length) return null;
      const visibleWord = word.word.slice(0, Math.max(0, visibleText.length - wordStart));
      if (!visibleWord) return null;
      const isCurrentWord = wordIdx === currentWordIndex;
      return (
        <span key={wordIdx}>
          <span
            style={{
              color: isCurrentWord ? '#FFD700' : TEXT_COLOR,
              fontWeight: isCurrentWord ? 700 : 500,
              textShadow: isCurrentWord ? '0 0 10px #FFD700' : 'none',
            }}
          >
            {visibleWord}
          </span>
          {sep && wordEnd < visibleText.length ? sep : ''}
        </span>
      );
    });
  };

  return (
    <div
      style={{
        opacity: exitOpacity,
        padding: '20px 40px',
        background: 'rgba(0, 0, 0, 0.7)',
        borderRadius: 8,
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)',
        textAlign: 'left',
        maxWidth: '90%',
        margin: '0 auto',
      }}
    >
      <span
        style={{
          fontSize,
          fontFamily: '"Courier Prime", "Courier New", monospace',
          letterSpacing: '0.02em',
          lineHeight: 1.4,
        }}
      >
        {renderText()}
        {cursorVisible && (
          <span
            style={{
              display: 'inline-block',
              width: 2,
              height: '1.1em',
              background: CURSOR_COLOR,
              marginLeft: 2,
              verticalAlign: 'text-bottom',
            }}
          />
        )}
      </span>
    </div>
  );
};

// PLACEHOLDER_TW_REST

export const TypewriterComposition: React.FC<MVInputProps> = ({
  audioFileName,
  backgroundImage,
  backgroundVideo,
  backgroundAnim,
  backgroundCarousel,
  backgroundAnimBeat,
  lyrics,
  lyricOffset,
}) => {
  const frame = useCurrentFrame();
  const {fps, height} = useVideoConfig();
  const data = lyricsToData(lyrics, lyricOffset);
  const fontSize = Math.round(height * 0.044);

  const audioSrc = audioFileName.startsWith('http') ? audioFileName : staticFile(audioFileName);

  return (
    <AbsoluteFill style={{backgroundColor: '#0a0a0a'}}>
      <BackgroundLayer
        backgroundVideo={backgroundVideo}
        backgroundImage={backgroundImage}
        backgroundAnim={backgroundAnim}
        backgroundCarousel={backgroundCarousel}
        audioFileName={audioFileName}
        beatReactive={backgroundAnimBeat}
        fallbackGradient="linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)"
      />

      <Audio src={audioSrc} />

      <div style={{position: 'absolute', top: '50%', left: 40, right: 40, transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 20}}>
        {data.lines.map((line, index) => (
          <TypewriterLine key={index} line={line} frame={frame} fps={fps} fontSize={fontSize} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

