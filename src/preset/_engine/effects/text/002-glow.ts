import type {TextEffect} from '../../types';
import type {CSSProperties} from 'react';

// 002 发光（长音脉冲≥700ms）· LyricsAnimator.cs（源 example/effect/002-glow.js）
export const effect: TextEffect = {
  id: '002', name: '发光（长音脉冲）', src: '发光(长音脉冲≥700ms) · LyricsAnimator.cs',
  line(api, ctx) {
    if (!ctx.isCur) return;
    const charStyles = ctx.info.charTimes.map((ct): CSSProperties => {
      const style: CSSProperties = {color: api.ms >= ct.start ? '#fff' : 'rgba(255,255,255,0.4)'};
      if (ct.dur >= api.LONG_SYLLABLE) {
        const p = api.clamp((api.ms - ct.start) / ct.dur, 0, 1);
        if (p > 0 && p < 1) {
          const r = Math.sin(p * Math.PI) * 22;
          style.textShadow = `0 0 ${r.toFixed(1)}px #fff, 0 0 ${(r * 2).toFixed(1)}px rgba(255,255,255,0.6)`;
        }
      }
      return style;
    });
    return {charStyles};
  },
};
