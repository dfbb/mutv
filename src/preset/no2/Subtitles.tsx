import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SegmentComp} from './Segment';
import {Segment} from './types';
import {LyricLine} from '../../types';

/**
 * Convert line-level lyrics (from SRT/LRC, the shared LyricLine[] format) into
 * the word-level Segment[] this preset's karaoke renderer expects.
 *
 * We don't have real Whisper word timestamps, so we synthesize them: each line
 * is split into "words" and the line's [start, end] window is distributed across
 * them proportionally to word length. CJK text (no spaces) is split per-character;
 * space-separated text is split on whitespace.
 */
function lyricsToSegments(lyrics: LyricLine[], offset: number): Segment[] {
	return lyrics.map((line, id) => {
		const start = line.start + offset;
		const end = line.end + offset;
		const text = line.text;

		const hasSpaces = /\s/.test(text.trim());
		const tokens = hasSpaces
			? text.split(/(\s+)/).filter((t) => t.length > 0) // keep spaces as their own tokens
			: Array.from(text); // CJK: one char per token

		// Weight each token by its length so longer words get more time.
		const weights = tokens.map((t) => Math.max(t.trim().length, 0.0001));
		const totalWeight = weights.reduce((a, b) => a + b, 0);
		const span = Math.max(end - start, 0.001);

		let cursor = start;
		const words = tokens.map((tok, i) => {
			const wStart = cursor;
			const wEnd = cursor + (weights[i] / totalWeight) * span;
			cursor = wEnd;
			return {word: tok, start: wStart, end: wEnd};
		});

		return {id, start, end, words};
	});
}

export const Subtitles: React.FC<{
	lyrics: LyricLine[];
	lyricOffset: number;
}> = ({lyrics, lyricOffset}) => {
	if (!lyrics || lyrics.length === 0) {
		return null;
	}

	const segments = lyricsToSegments(lyrics, lyricOffset);

	return (
		<AbsoluteFill
			style={{
				color: 'white',
			}}
		>
			{segments.map((segment) => {
				return <SegmentComp key={segment.id} segment={segment} />;
			})}
		</AbsoluteFill>
	);
};
