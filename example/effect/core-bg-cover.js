// 13 专辑封面模糊 — 程序化生成封面，高斯模糊铺底 + 右下角清晰缩略图
BL.register({
  id:'cover', name:'13 专辑封面模糊', kind:'bg', group:'背景效果', order:13,
  src:'封面模糊 · CoverBackgroundRenderer.cs',
  init(){
    const oc=document.createElement('canvas'); oc.width=300; oc.height=300;
    const o=oc.getContext('2d');
    const g=o.createLinearGradient(0,0,300,300);
    g.addColorStop(0,'#2b3a52'); g.addColorStop(1,'#10151f');
    o.fillStyle=g; o.fillRect(0,0,300,300);
    o.strokeStyle='rgba(212,175,90,0.9)'; o.lineWidth=3;
    o.beginPath(); o.arc(150,150,95,0,Math.PI*2); o.stroke();
    o.strokeStyle='rgba(212,175,90,0.5)'; o.lineWidth=2;
    for(let k=0;k<5;k++){ o.beginPath(); o.moveTo(60,120+k*22);
      o.bezierCurveTo(120,100+k*22,180,180+k*18,240,130+k*20); o.stroke(); }
    o.fillStyle='rgba(212,175,90,0.85)'; o.beginPath(); o.arc(150,150,10,0,Math.PI*2); o.fill();
    return { cover: oc };
  },
  draw(api, st){
    const g=api.g, BW=api.BW, BH=api.BH, t=api.ms/1000, cov=st.cover;
    g.clearRect(0,0,BW,BH);
    g.save();
    g.filter='blur(60px) brightness(0.6) saturate(1.5)';
    const s=Math.max(BW,BH)*1.4, ox=(BW-s)/2, oy=(BH-s)/2;
    g.drawImage(cov, ox+Math.sin(t*0.2)*20, oy+Math.cos(t*0.15)*20, s, s);
    g.filter='none'; g.restore();
    const tw=84, m=18, rx=BW-tw-m, ry=BH-tw-m;
    g.save(); g.beginPath(); g.roundRect(rx,ry,tw,tw,10); g.clip(); g.drawImage(cov,rx,ry,tw,tw); g.restore();
    g.strokeStyle='rgba(255,255,255,0.25)'; g.lineWidth=1;
    g.beginPath(); g.roundRect(rx,ry,tw,tw,10); g.stroke();
  }
});
