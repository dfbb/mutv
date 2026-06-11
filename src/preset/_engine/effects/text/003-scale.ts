import type {TextEffect} from '../../types';
import type {CSSProperties} from 'react';

// 003 缩放（长音脉冲≥700ms，1.0→1.15→1.0）· LyricsAnimator.cs（源 example/effect/003-scale.js）
export const effect: TextEffect = {
  id: '003', name: '缩放（长音脉冲）', src: '缩放(长音脉冲≥700ms) · LyricsAnimator.cs',
  line(api, ctx) {
    if (!ctx.isCur) return;
    const charStyles = ctx.info.charTimes.map((ct): CSSProperties => {
      const style: CSSProperties = {color: api.ms >= ct.start ? '#fff' : 'rgba(255,255,255,0.4)'};
      if (ct.dur >= api.LONG_SYLLABLE) {
        const p = api.clamp((api.ms - ct.start) / ct.dur, 0, 1);
        if (p > 0 && p < 1) {
          style.transform = `scale(${(1 + 0.15 * Math.sin(p * Math.PI)).toFixed(3)})`;
        }
      }
      return style;
    });
    return {charStyles};
  },
};
