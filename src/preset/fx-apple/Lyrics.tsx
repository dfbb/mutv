import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {LyricLine} from '../../types';

const LINE_HEIGHT = 130; // vertical spacing between lines (px)

type Word = {text: string; start: number; end: number};
type Line = {start: number; end: number; words: Word[]};

/**
 * Split each line into "words" and interpolate per-word timings from the
 * line's [start, end] window (we don't have real word-level data).
 * CJK (no spaces) splits per-character; space-separated text splits on spaces.
 */
function buildLines(lyrics: LyricLine[], offset: number): Line[] {
  return lyrics.map((line) => {
    const start = line.start + offset;
    const end = line.end + offset;
    const hasSpaces = /\s/.test(line.text.trim());
    const tokens = hasSpaces
      ? line.text.split(/(\s+)/).filter((t) => t.length > 0)
      : Array.from(line.text);
    const weights = tokens.map((t) => Math.max(t.trim().length, 0.0001));
    const total = weights.reduce((a, b) => a + b, 0);
    const span = Math.max(end - start, 0.001);
    let cursor = start;
    const words = tokens.map((tok, i) => {
      const wStart = cursor;
      const wEnd = cursor + (weights[i] / total) * span;
      cursor = wEnd;
      return {text: tok, start: wStart, end: wEnd};
    });
    return {start, end, words};
  });
}

// PLACEHOLDER_COMPONENT

const WordSpan: React.FC<{word: Word; time: number; active: boolean}> = ({
  word,
  time,
  active,
}) => {
  // Per-word fade-in highlight while the active line is playing.
  let opacity = 0.35;
  if (active) {
    if (time >= word.end) opacity = 1;
    else if (time <= word.start) opacity = 0.35;
    else {
      const p = (time - word.start) / Math.max(word.end - word.start, 0.001);
      opacity = 0.35 + p * 0.65;
    }
  }
  return (
    <span style={{opacity, transition: 'opacity 0.1s linear', whiteSpace: 'pre-wrap'}}>
      {word.text}
    </span>
  );
};

export const Lyrics: React.FC<{
  lyrics: LyricLine[];
  lyricOffset: number;
  fps: number;
  fontFamily?: string;
  fontScale?: number;
}> = ({lyrics, lyricOffset, fps, fontFamily, fontScale = 1}) => {
  const frame = useCurrentFrame();
  const {height} = useVideoConfig();
  const time = frame / fps;

  if (!lyrics || lyrics.length === 0) return null;
  const lines = buildLines(lyrics, lyricOffset);

  // Active line = last line whose start has passed (sticks until next begins).
  let activeIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (time >= lines[i].start) activeIndex = i;
    else break;
  }

  // Smoothly scroll so the active line sits at ~42% of the height.
  // Interpolate the scroll position between lines for a gliding feel.
  let scrollLine = 0;
  if (activeIndex < 0) {
    scrollLine = -0.5;
  } else if (activeIndex >= lines.length - 1) {
    scrollLine = activeIndex;
  } else {
    const cur = lines[activeIndex];
    const next = lines[activeIndex + 1];
    const p = Math.min(
      Math.max((time - cur.start) / Math.max(next.start - cur.start, 0.001), 0),
      1
    );
    // ease the last 30% of the gap into the upcoming line
    const eased = p < 0.7 ? 0 : (p - 0.7) / 0.3;
    scrollLine = activeIndex + eased;
  }

  const anchor = 0.42; // active line vertical anchor (fraction of height)

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        fontFamily: fontFamily
          ? `"${fontFamily}", "Noto Sans CJK SC", "Noto Sans CJK JP", "Hiragino Sans GB", "Microsoft YaHei", -apple-system, sans-serif`
          : '"Noto Sans CJK SC", "Noto Sans CJK JP", "Hiragino Sans GB", "Microsoft YaHei", -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 90,
          right: 90,
          top: `${anchor * 100}%`,
          transform: `translateY(${-scrollLine * LINE_HEIGHT}px)`,
        }}
      >
        {lines.map((line, i) => {
          const dist = i - activeIndex;
          const isActive = i === activeIndex;
          const blur = isActive ? 0 : Math.min(Math.abs(dist) * 1.4 + 1.5, 8);
          const opacity = isActive ? 1 : Math.max(0.5 - Math.abs(dist) * 0.12, 0.16);
          const scale = isActive ? 1 : 0.82;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: i * LINE_HEIGHT,
                left: 0,
                right: 0,
                color: 'white',
                fontSize: Math.round((58 * height * fontScale) / 720),
                fontWeight: 700,
                lineHeight: 1.15,
                transformOrigin: 'left center',
                transform: `scale(${scale})`,
                filter: blur ? `blur(${blur}px)` : 'none',
                opacity,
                textShadow: '0 2px 30px rgba(0,0,0,0.55)',
                transition: 'opacity 0.2s linear, filter 0.2s linear',
              }}
            >
              {line.words.map((w, j) => (
                <WordSpan key={j} word={w} time={time} active={isActive} />
              ))}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

