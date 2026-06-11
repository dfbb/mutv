// 14 纯色背景 — 单一深色径向渐变
BL.register({
  id:'pure', name:'14 纯色背景', kind:'bg', group:'背景效果', order:14,
  src:'纯色 · PureColorBackgroundRenderer.cs',
  init(){ return {}; },
  draw(api){
    const g=api.g, BW=api.BW, BH=api.BH;
    g.clearRect(0,0,BW,BH);
    const rg=g.createRadialGradient(BW/2,BH*0.4,0,BW/2,BH*0.4,Math.max(BW,BH)*0.8);
    rg.addColorStop(0,'#141c2b'); rg.addColorStop(1,'#0d1117');
    g.fillStyle=rg; g.fillRect(0,0,BW,BH);
  }
});
