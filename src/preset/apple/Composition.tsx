import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from 'remotion';
import {MVInputProps} from '../../types';
import {Lyrics} from './Lyrics';

/**
 * Apple Music-like lyric video (native Remotion reimplementation).
 *
 * Visual style references the iPad Apple Music lyric page:
 *   - full-bleed blurred & scaled background that slowly drifts (CSS, no WebGL)
 *   - large left-aligned lyrics, current line bright & scaled up,
 *     other lines dimmed & blurred, per-word fade-in highlight
 */
export const AppleLyrics: React.FC<MVInputProps> = ({
  audioFileName,
  backgroundImage,
  lyrics,
  lyricOffset,
  title,
  subtitle,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const audioSrc = audioFileName.startsWith('http')
    ? audioFileName
    : staticFile(audioFileName);
  const bgSrc = backgroundImage
    ? backgroundImage.startsWith('http')
      ? backgroundImage
      : staticFile(backgroundImage)
    : '';

  // Slow drift over the whole video for the "fluid" feel.
  const drift = interpolate(frame, [0, durationInFrames], [0, 1]);
  const scale = 1.25 + Math.sin(drift * Math.PI * 2) * 0.08;
  const translateX = Math.sin(drift * Math.PI * 2) * 4;
  const translateY = Math.cos(drift * Math.PI * 2) * 4;
  const hue = interpolate(frame, [0, durationInFrames], [0, 40]);

  return (
    <AbsoluteFill style={{backgroundColor: '#0a0a0a'}}>
      {/* Background: blurred, scaled, slowly drifting image — or animated gradient */}
      {bgSrc ? (
        <AbsoluteFill>
          <Img
            src={bgSrc}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: `blur(60px) saturate(1.8) brightness(0.75) hue-rotate(${hue}deg)`,
              transform: `scale(${scale}) translate(${translateX}%, ${translateY}%)`,
            }}
          />
          {/* Darkening + vignette overlay for lyric readability */}
          <AbsoluteFill
            style={{
              background:
                'radial-gradient(ellipse at 30% 50%, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.6) 100%)',
            }}
          />
        </AbsoluteFill>
      ) : (
        <AbsoluteFill
          style={{
            background: `linear-gradient(135deg, hsl(${260 + hue}, 55%, 22%) 0%, hsl(${320 + hue}, 50%, 14%) 100%)`,
            transform: `scale(${scale})`,
          }}
        />
      )}

      <Audio src={audioSrc} />

      <Lyrics lyrics={lyrics} lyricOffset={lyricOffset} fps={fps} />

      {/* Song header: top-left, fades in at the start (Apple Music style) */}
      {(title || subtitle) && (
        <div
          style={{
            position: 'absolute',
            top: 70,
            left: 90,
            opacity: interpolate(frame, [0, 20], [0, 1], {
              extrapolateRight: 'clamp',
            }),
            fontFamily:
              '"Noto Sans CJK SC", "Noto Sans CJK JP", "Hiragino Sans GB", "Microsoft YaHei", -apple-system, sans-serif',
            textShadow: '0 2px 20px rgba(0,0,0,0.6)',
          }}
        >
          <div style={{fontSize: 44, fontWeight: 700, color: 'white'}}>
            {title}
          </div>
          {subtitle ? (
            <div
              style={{
                fontSize: 30,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.7)',
                marginTop: 6,
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>
      )}
    </AbsoluteFill>
  );
};
