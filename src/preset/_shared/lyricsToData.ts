import {LyricLine} from '../../types';

// Word-level lyric model used by the lyrics-overlay style presets
// (neon / cinema / bounce / typewriter), ported from
// ai-music-video-maker's lyrics-overlay skill.
export interface LyricWord {
  word: string;
  start: number; // seconds
  end: number; // seconds
}

export interface LyricsLine {
  words: LyricWord[];
  lineStart: number; // seconds
  lineEnd: number; // seconds
}

export interface LyricsData {
  lines: LyricsLine[];
}

/**
 * Convert line-level lyrics (shared LyricLine[] from SRT/LRC) into the
 * word-level LyricsData these presets expect. We have no real word timings,
 * so each line's [start,end] window is split across its "words" proportionally
 * to length. CJK (no spaces) splits per-character; otherwise on whitespace.
 */
export function lyricsToData(lyrics: LyricLine[], offset: number): LyricsData {
  const lines: LyricsLine[] = lyrics.map((line) => {
    const lineStart = line.start + offset;
    const lineEnd = line.end + offset;
    const hasSpaces = /\s/.test(line.text.trim());
    const tokens = hasSpaces
      ? line.text.trim().split(/\s+/)
      : Array.from(line.text.trim());
    const weights = tokens.map((t) => Math.max(t.length, 0.0001));
    const total = weights.reduce((a, b) => a + b, 0);
    const span = Math.max(lineEnd - lineStart, 0.001);
    let cursor = lineStart;
    const words: LyricWord[] = tokens.map((tok, i) => {
      const start = cursor;
      const end = cursor + (weights[i] / total) * span;
      cursor = end;
      return {word: tok, start, end};
    });
    return {words, lineStart, lineEnd};
  });
  return {lines};
}
