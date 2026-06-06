// Word-level subtitle model consumed by this preset's karaoke renderer.
// Synthesized from line-level LyricLine[] in Subtitles.tsx (no real Whisper data).
export interface Word {
	word: string;
	start: number;
	end: number;
}

export interface Segment {
	id: number;
	start: number;
	end: number;
	words: Word[];
}
