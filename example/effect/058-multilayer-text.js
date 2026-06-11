BL.register({
  id: '058',
  name: '058 Multilayer text',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 58,
  src: 'Multilayer text · CodePen',
  css: `@import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@1,900&display=swap');

.bl-wrap {
  background: black;
}

.multilayer {
  position: relative;
  display: inline-block;
  color: #cf1b1b;
  font-family: 'Poppins', sans-serif;
  font-size: clamp(3rem, 10vw, 7rem);
  letter-spacing: 8px;
  cursor: pointer;
  text-transform: uppercase;
}

.multilayer::before {
  content: attr(data-text);
  position: absolute;
  color: transparent;
  background-image: repeating-linear-gradient(
    45deg,
    transparent 0,
    transparent 2px,
    white 2px,
    white 4px
  );
  -webkit-background-clip: text;
  top: 0px;
  left: 0;
  z-index: -1;
  transition: 1s;
  width: 100%;
}

.multilayer::after {
  content: attr(data-text);
  position: absolute;
  color: transparent;
  background-image: repeating-linear-gradient(
    135deg,
    transparent 0,
    transparent 2px,
    white 2px,
    white 4px
  );
  -webkit-background-clip: text;
  top: 0px;
  left: 0;
  transition: 1s;
  width: 100%;
}

.multilayer:hover::before {
  top: 10px;
  left: 10px;
}

.multilayer:hover::after {
  top: -10px;
  left: -10px;
}
/* 恢复原红字(覆盖顶层 VISUAL_OVERRIDE 的强制绿);
   主红字 + ::before/::after 斜纹叠层整体按 --reveal 裁切(CJK 等宽 => 逐字步进露出) */
:host .bl-wrap .multilayer {
  color: #cf1b1b !important;
  -webkit-text-fill-color: #cf1b1b !important;
  clip-path: inset(0 calc((1 - var(--reveal, 1)) * 100%) 0 0);
}
/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字裁切 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }`,
  html: `<span class="multilayer" data-text="{{LINE}}">{{LINE}}</span>`
});
