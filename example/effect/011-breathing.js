// 11 呼吸 — 低音律动，非对称插值 attack0.2/decay0.05，仅当前行
(function(){
  let breathScale = 1.0;
  BL.register({
    id:'011', name:'011 呼吸（低音律动）', kind:'text', group:'歌词文字效果', order:11,
    src:'呼吸 attack0.2/decay0.05 · BreathingRendererBase.cs',
    frame(api){
      const ms = api.ms, beat = 545;
      const ph = (ms % beat) / beat;
      const bass = Math.pow(Math.max(0, Math.sin(ph*Math.PI)), 6); // 0..1 尖峰
      const target = 1 + bass * (80/100);
      breathScale += (target > breathScale ? 0.2 : 0.05) * (target - breathScale);
    },
    line(api, L, ln){ if(ln.isCur) return { scale: breathScale }; }
  });
})();
