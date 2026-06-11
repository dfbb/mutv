import type {TextEffect} from '../../types';

// 008 边缘渐隐遮罩 · EdgeFadeMaskRenderer.cs（源 example/effect/008-edge-fade.js）
export const effect: TextEffect = {
  id: '008', name: '边缘渐隐遮罩', src: '边缘渐隐遮罩 · EdgeFadeMaskRenderer.cs',
  frame() {
    return {stageMask: 'linear-gradient(180deg, transparent 0%, #000 18%, #000 82%, transparent 100%)'};
  },
};
