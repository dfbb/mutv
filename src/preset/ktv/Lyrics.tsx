import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  interpolateColors,
} from 'remotion';
import {LyricLine} from '../../types';

// KTV color scheme (referencing karaoke-gen's ASS defaults):
// unsung text = blue, sung text = white, hard blue outline.
const UNSUNG = 'rgb(150, 162, 255)';
const SUNG = 'rgb(255, 255, 255)';
const OUTLINE = 'rgb(26, 58, 235)';

const MAX_VISIBLE = 4; // lines visible at once (current + upcoming preview)
const LEAD_IN_GAP = 5; // seconds of gap that triggers the lead-in arrows
const FADE = 0.25; // line fade in/out seconds

type Word = {text: string; start: number; end: number};
type Line = {start: number; end: number; words: Word[]};

/**
 * Split each line into "words" and interpolate per-word timings from the
 * line's [start, end] window (no real word-level data from SRT/LRC).
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

// Text shadow that fakes the ASS hard outline (4-directional + glow).
const outlineShadow =
  `-3px -3px 0 ${OUTLINE}, 3px -3px 0 ${OUTLINE}, -3px 3px 0 ${OUTLINE}, ` +
  `3px 3px 0 ${OUTLINE}, 0 0 18px rgba(0,0,0,0.7)`;

// PLACEHOLDER_COMPONENT

// One word: each character lights up at its own time (no2-style per-character
// reveal). Solid fill (not background-clip) so the blue outline stays sharp.
const WordSpan: React.FC<{word: Word; time: number}> = ({word, time}) => {
  const chars = Array.from(word.text);
  const span = Math.max(word.end - word.start, 0.001);
  const per = span / chars.length;
  return (
    <>
      {chars.map((ch, i) => {
        const cStart = word.start + i * per;
        const cEnd = cStart + per;
        const t = interpolate(time, [cStart, cEnd], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const color = interpolateColors(t, [0, 1], [UNSUNG, SUNG]);
        return (
          <span key={i} style={{whiteSpace: 'pre-wrap', color}}>
            {ch}
          </span>
        );
      })}
    </>
  );
};

// Lead-in arrows: shown in the gap before a line that follows a long silence.
const LeadIn: React.FC<{lineStart: number; gap: number; time: number}> = ({
  lineStart,
  time,
}) => {
  // Appear ~2s before the line, count down with growing arrows.
  const appear = lineStart - 2;
  const opacity = interpolate(
    time,
    [appear, appear + 0.4, lineStart - 0.15, lineStart],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );
  if (opacity <= 0) return null;
  // Number of lit arrows grows as the line approaches.
  const lit = Math.floor(
    interpolate(time, [appear, lineStart], [0, 4], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );
  return (
    <div style={{opacity, display: 'flex', gap: 14, marginBottom: 24}}>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          style={{
            fontSize: 64,
            fontWeight: 900,
            color: i < lit ? SUNG : UNSUNG,
            textShadow: outlineShadow,
          }}
        >
          ▶
        </span>
      ))}
    </div>
  );
};

export const Lyrics: React.FC<{
  lyrics: LyricLine[];
  lyricOffset: number;
  title: string;
  fontFamily?: string;
}> = ({lyrics, lyricOffset, fontFamily}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const time = frame / fps;

  if (!lyrics || lyrics.length === 0) return null;
  const lines = buildLines(lyrics, lyricOffset);

  // Active line = last line whose start has passed (holds until next begins).
  let activeIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (time >= lines[i].start) activeIndex = i;
    else break;
  }

  // Page the lyrics into fixed groups of MAX_VISIBLE; show the page that holds
  // the active line. Before the first line starts, show the first page.
  const idxForPage = activeIndex < 0 ? 0 : activeIndex;
  const pageStart = Math.floor(idxForPage / MAX_VISIBLE) * MAX_VISIBLE;
  const pageLines = lines.slice(pageStart, pageStart + MAX_VISIBLE);

  // Lead-in: gap between previous line end and the next upcoming line start.
  const nextIndex = activeIndex + 1;
  let leadIn: {start: number; gap: number} | null = null;
  if (nextIndex < lines.length) {
    const prevEnd = activeIndex >= 0 ? lines[activeIndex].end : 0;
    const gap = lines[nextIndex].start - prevEnd;
    if (gap >= LEAD_IN_GAP && time < lines[nextIndex].start) {
      leadIn = {start: lines[nextIndex].start, gap};
    }
  }

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 8%',
        fontFamily: fontFamily
          ? `"${fontFamily}", "Noto Sans CJK SC", "Noto Sans CJK JP", "Hiragino Sans GB", "Microsoft YaHei", sans-serif`
          : '"Noto Sans CJK SC", "Noto Sans CJK JP", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
      }}
    >
      {leadIn ? (
        <LeadIn lineStart={leadIn.start} gap={leadIn.gap} time={time} />
      ) : null}

      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30}}>
        {pageLines.map((line, j) => {
          const globalIndex = pageStart + j;
          const isActive = globalIndex === activeIndex;
          const isPast = globalIndex < activeIndex;
          const fadeIn = interpolate(time, [line.start - FADE, line.start], [0.55, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const opacity = isActive ? 1 : isPast ? 0.4 : Math.min(0.65, fadeIn);
          return (
            <div
              key={globalIndex}
              style={{
                fontSize: isActive ? 88 : 60,
                fontWeight: 800,
                textAlign: 'center',
                lineHeight: 1.2,
                opacity,
                transform: `scale(${isActive ? 1 : 0.92})`,
                textShadow: outlineShadow,
                transition: 'font-size 0.15s linear',
              }}
            >
              {isActive ? (
                line.words.map((w, k) => <WordSpan key={k} word={w} time={time} />)
              ) : (
                <span style={{color: isPast ? UNSUNG : UNSUNG, opacity: 0.9}}>
                  {line.words.map((w) => w.text).join('')}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

