// 10 扇形展开 — angle = fan × distanceFactor × (在下方?+1:−1)，绕左边缘
BL.register({
  id:'010', name:'010 扇形展开', kind:'text', group:'歌词文字效果', order:10,
  src:'扇形 angle=fan×df×(±1) · LyricsAnimator.cs',
  line(api, L, ln){
    const { clamp } = api, df = ln.df;
    const rotate = 7 * df * (ln.d > 0 ? 1 : -1);
    return { rotate, origin:'0% 50%', opacity: ln.isCur?1.0:clamp(1-df*0.7,0.1,1) };
  }
});
