import type {TextEffect} from '../../types';

// 009 3D 透视 · LyricsRenderer.CalculateLyrics3DMatrix（源 example/effect/009-3d-perspective.js）
export const effect: TextEffect = {
  id: '009', name: '3D 透视', src: '3D透视 · LyricsRenderer.CalculateLyrics3DMatrix',
  frame() {
    return {stagePerspective: '800px', trackTransform: 'rotateX(16deg)'};
  },
};
