import React from 'react';
import {AbsoluteFill, Img, IFrame, Video, staticFile} from 'remotion';

/**
 * Shared background layer for all presets. Renders exactly one source by
 * priority: video > carousel > image > anim > fallback gradient.
 *
 * - backgroundVideo:    looping Video, cover
 * - backgroundCarousel: carousel HTML slideshow (filename in public/) in an <IFrame src>
 * - backgroundImage:    Img, cover (+ optional dark overlay)
 * - backgroundAnim:     animated HTML effect (filename in public/) in an <IFrame src>
 * - fallbackGradient:   CSS background value supplied by each preset so its
 *                       own visual style is preserved when no source is given
 */
export const BackgroundLayer: React.FC<{
  backgroundVideo?: string;
  backgroundCarousel?: string;
  backgroundImage?: string;
  backgroundAnim?: string;
  fallbackGradient: string;
  /** Optional dark overlay over video/image for text readability (e.g. 'rgba(0,0,0,0.45)'). */
  overlay?: string;
}> = ({backgroundVideo, backgroundCarousel, backgroundImage, backgroundAnim, fallbackGradient, overlay}) => {
  const toSrc = (s: string) => (s.startsWith('http') ? s : staticFile(s));

  if (backgroundVideo) {
    return (
      <>
        <AbsoluteFill>
          <Video
            src={toSrc(backgroundVideo)}
            muted
            loop
            style={{width: '100%', height: '100%', objectFit: 'cover'}}
          />
        </AbsoluteFill>
        {overlay ? <AbsoluteFill style={{background: overlay}} /> : null}
      </>
    );
  }

  if (backgroundCarousel) {
    return (
      <AbsoluteFill>
        <IFrame src={toSrc(backgroundCarousel)} style={{width: '100%', height: '100%', border: 'none'}} />
      </AbsoluteFill>
    );
  }

  if (backgroundImage) {
    return (
      <>
        <AbsoluteFill>
          <Img src={toSrc(backgroundImage)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        </AbsoluteFill>
        {overlay ? <AbsoluteFill style={{background: overlay}} /> : null}
      </>
    );
  }

  if (backgroundAnim) {
    return (
      <AbsoluteFill>
        <IFrame src={toSrc(backgroundAnim)} style={{width: '100%', height: '100%', border: 'none'}} />
      </AbsoluteFill>
    );
  }

  return <AbsoluteFill style={{background: fallbackGradient}} />;
};
