// 05 模糊淡出 — 行模糊 = 5×1.6×distanceFactor px，opacity = 1−df（当前行清晰）
BL.register({
  id:'005', name:'005 模糊淡出（距离驱动）', kind:'text', group:'歌词文字效果', order:5,
  src:'模糊淡出 blur=5×df · LyricsAnimator.cs',
  line(api, L, ln){
    const { clamp } = api, df = ln.df, isCur = ln.isCur;
    if(!isCur) L.el.style.filter = `blur(${(5*1.6*df).toFixed(2)}px)`;
    return { scale: isCur?1.0:(1-df*0.08), opacity: isCur?1.0:clamp(1-df,0.04,1) };
  }
});
