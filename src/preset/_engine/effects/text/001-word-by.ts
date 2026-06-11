import type {TextEffect} from '../../types';

// 001 逐字卡拉OK · Renderer/LyricsLineRenderer.cs（源 example/effect/001-word-by.js）
export const effect: TextEffect = {
  id: '001',
  name: '逐字卡拉OK',
  src: '逐字卡拉OK · Renderer/LyricsLineRenderer.cs',
  line(api, ctx) {
    if (!ctx.isCur) return;
    const charStyles = ctx.info.charTimes.map((ct) => {
      const p = api.clamp((api.ms - ct.start) / ct.dur, 0, 1);
      if (p >= 1) return {color: '#fff'};
      if (p <= 0) return {color: 'rgba(255,255,255,0.32)'};
      const pc = p * 100;
      const soft = pc + 22;
      return {
        color: 'transparent',
        WebkitTextFillColor: 'transparent',
        background: `linear-gradient(90deg,#fff ${pc.toFixed(1)}%, rgba(255,255,255,0.32) ${soft.toFixed(1)}%)`,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
      } as const;
    });
    return {charStyles};
  },
};
