// 08 边缘渐隐遮罩 — 歌词区上下边缘渐变遮罩（滚入/滚出渐隐）
BL.register({
  id:'008', name:'008 边缘渐隐遮罩', kind:'text', group:'歌词文字效果', order:8,
  src:'边缘渐隐遮罩 · EdgeFadeMaskRenderer.cs',
  frame(api){
    const mg = 'linear-gradient(180deg, transparent 0%, #000 18%, #000 82%, transparent 100%)';
    api.stage.style.maskImage = mg;
    api.stage.style.webkitMaskImage = mg;
  }
});
