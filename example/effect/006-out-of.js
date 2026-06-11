// 06 视线外 — scale = 1 − df×0.25（缩到 0.75），opacity = 1 − df，无模糊
BL.register({
  id:'006', name:'006 视线外（缩小+淡隐）', kind:'text', group:'歌词文字效果', order:6,
  src:'视线外 scale=1−df×0.25 · LyricsAnimator.cs',
  line(api, L, ln){
    const { clamp } = api, df = ln.df, isCur = ln.isCur;
    return { scale: isCur?1.0:(1.0-df*0.25), opacity: isCur?1.0:clamp(1-df,0.05,1) };
  }
});
