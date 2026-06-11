// 16 雨滴玻璃 — 细雨线下落 + 雨滴折射高光，淡入停留后下滑消失
BL.register({
  id:'rain', name:'16 雨滴玻璃', kind:'bg', group:'背景效果', order:16,
  src:'雨滴 · RaindropRenderer.cs + Shaders/RaindropEffect.cs',
  init(){
    return { drops:[], streaks: Array.from({length:40},()=>({
      x:Math.random(), y:Math.random(), len:8+Math.random()*16, sp:.004+Math.random()*.006, a:.12+Math.random()*.18
    })) };
  },
  draw(api, st){
    const g=api.g, BW=api.BW, BH=api.BH;
    g.clearRect(0,0,BW,BH);
    g.fillStyle='#0a0e14'; g.fillRect(0,0,BW,BH);
    g.strokeStyle='rgba(180,200,220,1)';
    st.streaks.forEach(s=>{
      s.y+=s.sp; if(s.y>1.05){ s.y=-.05; s.x=Math.random(); }
      g.globalAlpha=s.a; g.lineWidth=1;
      g.beginPath(); g.moveTo(s.x*BW,s.y*BH); g.lineTo(s.x*BW+2,s.y*BH+s.len); g.stroke();
    });
    g.globalAlpha=1;
    if(Math.random()<0.4) st.drops.push({x:Math.random(),y:Math.random()*0.8,r:6+Math.random()*16,life:0,max:120+Math.random()*120});
    st.drops = st.drops.filter(d=>{
      d.life++; if(d.life>d.max) return false;
      const prog=d.life/d.max;
      if(prog>0.6) d.y += 0.0015*(prog-0.6)*10;
      const cx=d.x*BW, cy=d.y*BH;
      const a = prog<0.2 ? prog/0.2 : (prog>0.85?(1-prog)/0.15:1);
      const rg=g.createRadialGradient(cx-d.r*0.3,cy-d.r*0.3,1,cx,cy,d.r);
      rg.addColorStop(0,`rgba(220,235,255,${0.55*a})`);
      rg.addColorStop(0.7,`rgba(160,185,210,${0.18*a})`);
      rg.addColorStop(1,`rgba(160,185,210,0)`);
      g.fillStyle=rg; g.beginPath(); g.arc(cx,cy,d.r,0,Math.PI*2); g.fill();
      g.strokeStyle=`rgba(255,255,255,${0.3*a})`; g.lineWidth=1;
      g.beginPath(); g.arc(cx-d.r*0.25,cy-d.r*0.25,d.r*0.4,Math.PI,Math.PI*1.6); g.stroke();
      return true;
    });
  }
});
