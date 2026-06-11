import type {TextEffect} from '../../types';

// 006 视线外（缩小+淡隐）· LyricsAnimator.cs（源 example/effect/006-out-of.js）
export const effect: TextEffect = {
  id: '006', name: '视线外（缩小+淡隐）', src: '视线外 scale=1−df×0.25 · LyricsAnimator.cs',
  line(api, ctx) {
    const {df, isCur} = ctx;
    return {base: {scale: isCur ? 1 : 1 - df * 0.25, opacity: isCur ? 1 : api.clamp(1 - df, 0.05, 1)}};
  },
};
