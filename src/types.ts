export interface LyricLine {
  start: number;
  end: number;
  text: string;
}

export interface MVInputProps extends Record<string, unknown> {
  /** Path to audio file (relative to public/ or absolute URL) */
  audioFileName: string;
  /** Lyrics as JSON array [{start, end, text}] */
  lyrics: LyricLine[];
  /** Main title displayed at top */
  title: string;
  /** Subtitle displayed below title */
  subtitle: string;
  /** Bottom credit text */
  creditText: string;
  /** Audio duration in seconds (used to calculate total frames) */
  durationInSeconds: number;
  /** Lyric timing offset in seconds (positive = delay, negative = advance) */
  lyricOffset: number;
  /** Background image filename (relative to public/ or absolute URL). */
  backgroundImage: string;
  /** Background video filename (relative to public/ or absolute URL). Takes priority over image/anim. */
  backgroundVideo: string;
  /** Animated background HTML filename in public/ (copied from animbg/<label>/index.html). Loaded via IFrame src. */
  backgroundAnim: string;
  /** Carousel HTML filename in public/ (multi-image dir slideshow). Loaded via IFrame src. */
  backgroundCarousel: string;
  /** Whether the animated background reacts to the music beat (butterchurn-style). */
  backgroundAnimBeat: boolean;
  /** Animated background kind: 'winamp' uses the butterchurn player, '' is a normal HTML effect. */
  backgroundAnimKind: string;
  /** Output width in pixels (set via CLI --res) */
  width: number;
  /** Output height in pixels (set via CLI --res) */
  height: number;
  /** Frames per second (set via CLI --fps) */
  fps: number;
  /** Custom font family name to prepend to text (from --font); '' = use preset default. */
  fontFamily: string;
  /** Custom font file in public/ (e.g. 'fonts/Foo.woff2'), loaded via @font-face; '' = none. */
  fontFile: string;
  /** Global font-size multiplier (from --font-scale); 1 = preset default. */
  fontScale: number;
}

export const defaultProps: MVInputProps = {
  audioFileName: 'celebration.mp3',
  lyrics: [],
  title: 'ACE-Step',
  subtitle: 'v1.5',
  creditText: 'Powered by Claude Code + ACE-Step',
  durationInSeconds: 150,
  lyricOffset: -0.5,
  backgroundImage: '',
  backgroundVideo: '',
  backgroundAnim: '',
  backgroundCarousel: '',
  backgroundAnimBeat: true,
  backgroundAnimKind: '',
  width: 1080,
  height: 720,
  fps: 24,
  fontFamily: '',
  fontFile: '',
  fontScale: 1,
};
