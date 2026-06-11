import type {TextEffect} from '../../types';

// 007 阴影 · LyricsLineRenderer.cs（源 example/effect/007-shadow.js）
export const effect: TextEffect = {
  id: '007', name: '阴影', src: '阴影 · LyricsLineRenderer.cs',
  line(api, ctx) {
    return {
      lineStyle: ctx.isCur
        ? {textShadow: '2px 4px 8px rgba(0,0,0,0.8), 0 0 30px rgba(200,180,255,0.4)', color: '#fffde7'}
        : {textShadow: '1px 2px 4px rgba(0,0,0,0.5)'},
    };
  },
};
