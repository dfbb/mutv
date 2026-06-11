// 09 3D 透视 — 整块歌词层 perspective + rotateX（绕中心倾斜）
BL.register({
  id:'009', name:'009 3D 透视', kind:'text', group:'歌词文字效果', order:9,
  src:'3D透视 · LyricsRenderer.CalculateLyrics3DMatrix',
  frame(api){
    api.stage.style.perspective = '800px';
    return 'rotateX(16deg)';
  }
});
