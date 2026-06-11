import type {TextEffect} from '../../types';

// 010 扇形展开 · LyricsAnimator.cs（源 example/effect/010-fan.js）
export const effect: TextEffect = {
  id: '010', name: '扇形展开', src: '扇形 angle=fan×df×(±1) · LyricsAnimator.cs',
  line(api, ctx) {
    const df = ctx.df;
    return {base: {rotate: 7 * df * (ctx.d > 0 ? 1 : -1), origin: '0% 50%', opacity: ctx.isCur ? 1 : api.clamp(1 - df * 0.7, 0.1, 1)}};
  },
};
