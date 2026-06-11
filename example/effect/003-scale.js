// 03 缩放 — 仅 ≥700ms 长音节，字符 1.0→1.15→1.0 瞬态脉冲（Sine）
BL.register({
  id:'003', name:'003 缩放（长音脉冲）', kind:'text', group:'歌词文字效果', order:3,
  src:'缩放(长音脉冲≥700ms) · LyricsAnimator.cs',
  line(api, L, ln){
    if(!ln.isCur) return;
    const { ms, clamp, LONG_SYLLABLE } = api, info = ln.info;
    api.charPlayedColor(L, info, ms);
    L.chEls.forEach((s,k)=>{
      const ct = info.charTimes[k];
      if(ct.dur >= LONG_SYLLABLE){
        const p = clamp((ms-ct.start)/ct.dur, 0, 1);
        const cs = 1 + 0.15 * Math.sin(p*Math.PI);
        s.style.transform = `scale(${cs.toFixed(3)})`;
      }
    });
  }
});
