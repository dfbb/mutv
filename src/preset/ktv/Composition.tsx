import React from 'react';
import {AbsoluteFill, Audio, Img, staticFile} from 'remotion';
import {MVInputProps} from '../../types';
import {Lyrics} from './Lyrics';

/**
 * Classic KTV / ASS-subtitle style karaoke (native Remotion reimplementation,
 * referencing karaoke-gen's ASS karaoke output).
 *
 * Visual style:
 *   - background image with a dark overlay (or solid dark) for contrast
 *   - centered, multi-line visible lyrics (upcoming lines previewed)
 *   - per-word sweep highlight: unsung = blue, sung = white, hard blue outline
 *   - lead-in arrows before a line when there's a long instrumental gap
 */
export const KtvLyrics: React.FC<MVInputProps> = ({
  audioFileName,
  backgroundImage,
  lyrics,
  lyricOffset,
  title,
}) => {
  const audioSrc = audioFileName.startsWith('http')
    ? audioFileName
    : staticFile(audioFileName);
  const bgSrc = backgroundImage
    ? backgroundImage.startsWith('http')
      ? backgroundImage
      : staticFile(backgroundImage)
    : '';

  return (
    <AbsoluteFill style={{backgroundColor: '#05060f'}}>
      {bgSrc ? (
        <AbsoluteFill>
          <Img
            src={bgSrc}
            style={{width: '100%', height: '100%', objectFit: 'cover'}}
          />
          <AbsoluteFill style={{background: 'rgba(5, 6, 15, 0.55)'}} />
        </AbsoluteFill>
      ) : (
        <AbsoluteFill
          style={{
            background:
              'linear-gradient(180deg, #0a1030 0%, #05060f 60%, #03040a 100%)',
          }}
        />
      )}

      <Audio src={audioSrc} />

      <Lyrics lyrics={lyrics} lyricOffset={lyricOffset} title={title} />
    </AbsoluteFill>
  );
};
