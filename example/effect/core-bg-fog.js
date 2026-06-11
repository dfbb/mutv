// 15 雾气 — 多层柔边雾团缓慢飘移（lighter 叠加）
BL.register({
  id:'fog', name:'15 雾气', kind:'bg', group:'背景效果', order:15,
  src:'雾气 · FogRenderer.cs + Shaders/FogEffect.cs',
  init(){
    return { puffs: Array.from({length:6}, ()=>({
      x:Math.random(), y:Math.random(), r:60+Math.random()*240,
      vx:(Math.random()-.5)*0.00006, vy:(Math.random()-.5)*0.00004,
      a:0.05+Math.random()*0.07, hue:Math.random()<.5?'255,255,255':'150,200,210'
    })) };
  },
  draw(api, st){
    const g=api.g, BW=api.BW, BH=api.BH;
    g.clearRect(0,0,BW,BH);
    g.fillStyle='#080c10'; g.fillRect(0,0,BW,BH);
    g.globalCompositeOperation='lighter';
    st.puffs.forEach(p=>{
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<-.3)p.x=1.3; if(p.x>1.3)p.x=-.3;
      if(p.y<-.3)p.y=1.3; if(p.y>1.3)p.y=-.3;
      const cx=p.x*BW, cy=p.y*BH;
      const rg=g.createRadialGradient(cx,cy,0,cx,cy,p.r);
      rg.addColorStop(0,`rgba(${p.hue},${p.a})`); rg.addColorStop(1,`rgba(${p.hue},0)`);
      g.fillStyle=rg; g.beginPath(); g.arc(cx,cy,p.r,0,Math.PI*2); g.fill();
    });
    g.globalCompositeOperation='source-over';
  }
});
