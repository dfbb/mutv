// 12 动态流体背景 — 4 个彩色径向渐变球游动叠加（lighter 混合）
BL.register({
  id:'fluid', name:'12 动态流体背景', kind:'bg', group:'背景效果', order:12,
  src:'动态流体 · FluidBackgroundRenderer.cs + Shaders/FluidBackgroundEffect.cs',
  init(){
    return { blobs: [
      {c:'#1a237e', x:.3,y:.4, ax:.18,ay:.12, px:0,   py:1.7, r:.55},
      {c:'#4a148c', x:.7,y:.3, ax:.22,ay:.16, px:2.1, py:.6,  r:.6},
      {c:'#006064', x:.5,y:.7, ax:.25,ay:.14, px:4.0, py:3.1, r:.5},
      {c:'#b71c1c', x:.4,y:.6, ax:.2, ay:.2,  px:1.0, py:5.0, r:.5},
    ]};
  },
  draw(api, st){
    const g=api.g, BW=api.BW, BH=api.BH, t=api.ms/1000;
    g.clearRect(0,0,BW,BH);
    g.fillStyle='#050508'; g.fillRect(0,0,BW,BH);
    g.globalCompositeOperation='lighter';
    st.blobs.forEach(b=>{
      const cx=(b.x+Math.sin(t*b.ax+b.px)*0.22)*BW;
      const cy=(b.y+Math.cos(t*b.ay+b.py)*0.22)*BH;
      const rad=b.r*Math.min(BW,BH);
      const rg=g.createRadialGradient(cx,cy,0,cx,cy,rad);
      rg.addColorStop(0,b.c); rg.addColorStop(1,'rgba(0,0,0,0)');
      g.globalAlpha=0.55; g.fillStyle=rg;
      g.beginPath(); g.arc(cx,cy,rad,0,Math.PI*2); g.fill();
    });
    g.globalCompositeOperation='source-over'; g.globalAlpha=1;
  }
});
