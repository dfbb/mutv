// 17 雪花粒子 — 飘落雪花，独立下落速度/摆动/透明度，部分为六瓣雪晶
BL.register({
  id:'snow', name:'17 雪花粒子', kind:'bg', group:'背景效果', order:17,
  src:'雪花 · SnowRenderer.cs + Shaders/SnowEffect.cs',
  init(){
    return { flakes: Array.from({length:260}, ()=>({
      x:Math.random(), y:Math.random(), r:1+Math.random()*3,
      sp:.0006+Math.random()*.0016, sway:.3+Math.random()*1.6, ph:Math.random()*6.28,
      a:.3+Math.random()*.6, crystal:Math.random()<.18
    })) };
  },
  draw(api, st){
    const g=api.g, BW=api.BW, BH=api.BH, t=api.ms/1000;
    g.clearRect(0,0,BW,BH);
    const rg=g.createLinearGradient(0,0,0,BH);
    rg.addColorStop(0,'#0a1020'); rg.addColorStop(1,'#050810');
    g.fillStyle=rg; g.fillRect(0,0,BW,BH);
    st.flakes.forEach(f=>{
      f.y+=f.sp; if(f.y>1.02){ f.y=-.02; f.x=Math.random(); }
      const x=(f.x+Math.sin(t*0.8+f.ph)*f.sway*0.01)*BW, y=f.y*BH;
      g.globalAlpha=f.a; g.fillStyle='#fff';
      if(f.crystal){
        g.save(); g.translate(x,y); g.strokeStyle=`rgba(255,255,255,${f.a})`; g.lineWidth=1;
        for(let k=0;k<6;k++){ g.rotate(Math.PI/3); g.beginPath(); g.moveTo(0,0); g.lineTo(0,f.r*2.4); g.stroke(); }
        g.restore();
      } else { g.beginPath(); g.arc(x,y,f.r,0,Math.PI*2); g.fill(); }
    });
    g.globalAlpha=1;
  }
});
