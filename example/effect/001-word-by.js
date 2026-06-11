// 01 逐字卡拉OK — 整行线性渐变扫描（已唱亮/未唱暗，软边约半字宽）
BL.register({
  id:'001', name:'001 逐字卡拉OK', kind:'text', group:'歌词文字效果', order:1,
  src:'逐字卡拉OK · Renderer/LyricsLineRenderer.cs',
  line(api, L, ln){
    if(!ln.isCur) return;
    const { ms, clamp } = api, info = ln.info;
    L.chEls.forEach((s,k)=>{
      const ct = info.charTimes[k];
      const p = clamp((ms-ct.start)/ct.dur, 0, 1);
      if(p>=1){ s.style.color='#fff'; }
      else if(p<=0){ s.style.color='rgba(255,255,255,0.32)'; }
      else {
        const pc=(p*100).toFixed(1), soft=(p*100+22).toFixed(1);
        s.style.color='transparent'; s.style.webkitTextFillColor='transparent';
        s.style.background=`linear-gradient(90deg,#fff ${pc}%, rgba(255,255,255,0.32) ${soft}%)`;
        s.style.webkitBackgroundClip='text'; s.style.backgroundClip='text';
      }
    });
  }
});
