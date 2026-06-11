// 07 阴影 — 当前行强立体投影+彩色辉光，非当前行弱投影
BL.register({
  id:'007', name:'007 阴影', kind:'text', group:'歌词文字效果', order:7,
  src:'阴影 · LyricsLineRenderer.cs',
  line(api, L, ln){
    L.el.style.textShadow = ln.isCur
      ? '2px 4px 8px rgba(0,0,0,0.8), 0 0 30px rgba(200,180,255,0.4)'
      : '1px 2px 4px rgba(0,0,0,0.5)';
    if(ln.isCur) L.el.style.color = '#fffde7';
  }
});
