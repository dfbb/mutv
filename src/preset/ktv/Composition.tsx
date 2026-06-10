import React from 'react';
import {AbsoluteFill, Audio, staticFile} from 'remotion';
import {MVInputProps} from '../../types';
import {BackgroundLayer} from '../BackgroundLayer';
import {StudioControlBar} from '../StudioControlBar';
import {FontLoader} from '../FontLoader';
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
  backgroundVideo,
  backgroundAnim,
  backgroundCarousel,
  backgroundAnimBeat,
  backgroundAnimKind,
  lyrics,
  lyricOffset,
  title,
  fontFamily,
  fontFile,
  fontScale = 1,
}) => {
  const audioSrc = audioFileName.startsWith('http')
    ? audioFileName
    : staticFile(audioFileName);

  return (
    <AbsoluteFill style={{backgroundColor: '#05060f'}}>
      <BackgroundLayer
        backgroundVideo={backgroundVideo}
        backgroundImage={backgroundImage}
        backgroundAnim={backgroundAnim}
        backgroundCarousel={backgroundCarousel}
        audioFileName={audioFileName}
        beatReactive={backgroundAnimBeat}
        animKind={backgroundAnimKind}
        fallbackGradient="linear-gradient(180deg, #0a1030 0%, #05060f 60%, #03040a 100%)"
        overlay="rgba(5, 6, 15, 0.55)"
      />
      <StudioControlBar />
      <FontLoader fontFamily={fontFamily} fontFile={fontFile} />

      <Audio src={audioSrc} />

      <Lyrics lyrics={lyrics} lyricOffset={lyricOffset} title={title} fontFamily={fontFamily} fontScale={fontScale} />
    </AbsoluteFill>
  );
};
