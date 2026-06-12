import React from 'react';
import {AbsoluteFill, Img, IFrame, Video, staticFile, useCurrentFrame, useVideoConfig, delayRender, continueRender, getInputProps} from 'remotion';
import {BeatReactiveAnim} from './BeatReactiveAnim';
import {ButterchurnAnim} from './ButterchurnAnim';

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
const BackgroundSource: React.FC<{
  backgroundVideo?: string;
  backgroundCarousel?: string;
  backgroundImage?: string;
  backgroundAnim?: string;
  /** Audio filename in public/ (or http URL), needed for beat-reactive anim. */
  audioFileName?: string;
  /** When true and backgroundAnim is set, drive it with the music beat. */
  beatReactive?: boolean;
  /** 'winamp' → butterchurn player; otherwise normal HTML effect. */
  animKind?: string;
  fallbackGradient: string;
  /** Optional dark overlay over video/image for text readability (e.g. 'rgba(0,0,0,0.45)'). */
  overlay?: string;
}> = ({backgroundVideo, backgroundCarousel, backgroundImage, backgroundAnim, audioFileName, beatReactive, animKind, fallbackGradient, overlay}) => {
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
    return <CarouselBackground src={toSrc(backgroundCarousel)} />;
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
    const audioSrc = audioFileName
      ? (audioFileName.startsWith('http') ? audioFileName : staticFile(audioFileName))
      : '';
    if (animKind === 'winamp' && audioSrc) {
      return <ButterchurnAnim src={toSrc(backgroundAnim)} audioSrc={audioSrc} />;
    }
    if (beatReactive && audioFileName) {
      return <BeatReactiveAnim src={toSrc(backgroundAnim)} audioSrc={audioSrc} />;
    }
    return (
      <AbsoluteFill>
        <IFrame src={toSrc(backgroundAnim)} style={{width: '100%', height: '100%', border: 'none'}} />
      </AbsoluteFill>
    );
  }

  return <AbsoluteFill style={{background: fallbackGradient}} />;
};

/** Pexels 署名：最后 1 秒右下角，zIndex 置顶（合规要求，不允许被前景遮挡）。 */
const PexelsCredits: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames, fps} = useVideoConfig();
  const text = (getInputProps() as {pexelsCreditsText?: string}).pexelsCreditsText || '';
  if (!text || frame < durationInFrames - fps) return null;
  return (
    <div style={{
      position: 'absolute', right: 24, bottom: 24, zIndex: 9999,
      background: 'rgba(0,0,0,0.28)', color: '#fff', fontSize: 18,
      padding: '6px 14px', borderRadius: 8, fontFamily: 'sans-serif',
    }}>
      {text}
    </div>
  );
};

export const BackgroundLayer: React.FC<Parameters<typeof BackgroundSource>[0]> = (props) => (
  <>
    <BackgroundSource {...props} />
    <PexelsCredits />
  </>
);

/**
 * Carousel background driven by a self-contained CSS slideshow inside an iframe.
 *
 * Why a controlled iframe + delayRender instead of <IFrame src=...#t=ms>:
 * Remotion's <IFrame> only waits for the iframe's `load` event. But our runtime
 * builds its layers and paints on `load` too, so a screenshot could race the very
 * first paint → black flash. Here we instead:
 *   1. Load the iframe ONCE (src has no hash; we don't reload it per frame).
 *   2. Per frame, block that frame with delayRender until the iframe reports
 *      __carouselReady, then call __carouselRenderAt(timeMs) to draw the exact
 *      frame synchronously, then continueRender. "Load first, then record."
 */
const CarouselBackground: React.FC<{src: string}> = ({src}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const timeMs = (frame / fps) * 1000;
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  // One delayRender handle per frame: released only after the carousel has drawn
  // this frame's content, so Remotion never screenshots an unpainted iframe.
  React.useEffect(() => {
    const handle = delayRender(`carousel frame ${frame}`);
    let cancelled = false;
    let raf = 0;

    const tick = () => {
      if (cancelled) return;
      const win = iframeRef.current?.contentWindow as
        | (Window & {__carouselReady?: boolean; __carouselRenderAt?: (ms: number) => void})
        | undefined;
      if (win && win.__carouselReady && typeof win.__carouselRenderAt === 'function') {
        win.__carouselRenderAt(timeMs);
        // wait one frame so the style/layout change is painted before screenshot
        raf = requestAnimationFrame(() => {
          if (!cancelled) continueRender(handle);
        });
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      continueRender(handle);
    };
  }, [frame, timeMs]);

  return (
    <AbsoluteFill>
      <iframe
        ref={iframeRef}
        src={src}
        style={{width: '100%', height: '100%', border: 'none'}}
        // include the start time in the hash too, so a fresh load paints the right
        // frame immediately even before __carouselRenderAt is called.
      />
    </AbsoluteFill>
  );
};
