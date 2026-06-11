import type {TextEffect} from '../../types';
import type {CSSProperties} from 'react';

// 004 浮动（逐字升起）· LyricsAnimator.cs（源 example/effect/004-float.js）
export const effect: TextEffect = {
  id: '004', name: '浮动（逐字升起）', src: '浮动(逐字升起) · LyricsAnimator.cs',
  line(api, ctx) {
    if (!ctx.isCur) return;
    const charStyles = ctx.info.charTimes.map((ct): CSSProperties => {
      const ty = api.ms < ct.start ? api.FLOAT_PX : api.FLOAT_PX * (1 - api.easeOutSine((api.ms - ct.start) / api.FLOAT_DUR));
      return {color: api.ms >= ct.start ? '#fff' : 'rgba(255,255,255,0.4)', transform: `translateY(${ty.toFixed(2)}px)`};
    });
    return {charStyles};
  },
};
