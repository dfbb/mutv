// 02 发光 — 仅 ≥700ms 长音节，sin 脉冲发光（0→峰→0），作用于已唱部分
BL.register({
  id:'002', name:'002 发光（长音脉冲）', kind:'text', group:'歌词文字效果', order:2,
  src:'发光(长音脉冲≥700ms) · LyricsAnimator.cs',
  line(api, L, ln){
    if(!ln.isCur) return;
    const { ms, clamp, LONG_SYLLABLE } = api, info = ln.info;
    api.charPlayedColor(L, info, ms);
    L.chEls.forEach((s,k)=>{
      const ct = info.charTimes[k];
      if(ct.dur >= LONG_SYLLABLE){
        const p = clamp((ms-ct.start)/ct.dur, 0, 1);
        if(p>0 && p<1){
          const r = Math.sin(p*Math.PI) * 22;
          s.style.textShadow = `0 0 ${r.toFixed(1)}px #fff, 0 0 ${(r*2).toFixed(1)}px rgba(255,255,255,0.6)`;
        }
      }
    });
  }
});
