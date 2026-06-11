// 04 浮动 — 未唱字符下沉 +FLOAT，随演唱每字 450ms 上浮回基线（Sine）
BL.register({
  id:'004', name:'004 浮动（逐字升起）', kind:'text', group:'歌词文字效果', order:4,
  src:'浮动(逐字升起) · LyricsAnimator.cs',
  line(api, L, ln){
    if(!ln.isCur) return;
    const { ms, FLOAT_PX, FLOAT_DUR, easeOutSine } = api, info = ln.info;
    api.charPlayedColor(L, info, ms);
    L.chEls.forEach((s,k)=>{
      const ct = info.charTimes[k];
      let ty;
      if(ms < ct.start) ty = FLOAT_PX;
      else ty = FLOAT_PX * (1 - easeOutSine((ms-ct.start)/FLOAT_DUR));
      s.style.transform = `translateY(${ty.toFixed(2)}px)`;
    });
  }
});
