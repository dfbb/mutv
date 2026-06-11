import type {TextEffect} from '../../types';

// 005 模糊淡出（距离驱动）· LyricsAnimator.cs（源 example/effect/005-blur-fade.js）
export const effect: TextEffect = {
  id: '005', name: '模糊淡出（距离驱动）', src: '模糊淡出 blur=5×df · LyricsAnimator.cs',
  line(api, ctx) {
    const {df, isCur} = ctx;
    return {
      base: {scale: isCur ? 1 : 1 - df * 0.08, opacity: isCur ? 1 : api.clamp(1 - df, 0.04, 1)},
      lineStyle: isCur ? undefined : {filter: `blur(${(5 * 1.6 * df).toFixed(2)}px)`},
    };
  },
};
