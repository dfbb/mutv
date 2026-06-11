BL.register({
  id: '092',
  name: '092 Awesome Text-Shadow',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 92,
  src: 'Awesome Text-Shadow · CodePen',
  css: `
.bl-wrap {
  background-color: #ece5da;
  text-align: center;
}

.awesome-shadow {
  font-family: "Paytone One", "Arial Black", sans-serif;
  color: #202020;
  text-transform: uppercase;
  letter-spacing: -2px;
  font-size: 6vmin;
  font-weight: 900;
  line-height: 1.2;
  text-shadow: 0 13.36px 8.896px #c4b59d, 0 -2px 1px #fff;
}

/* 取消引擎遮罩,改用逐字露出 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }

/* 恢复原始字色 */
:host .bl-wrap .awesome-shadow,
:host .bl-wrap .awesome-shadow .bl-char {
  color: #202020 !important;
  -webkit-text-fill-color: #202020 !important;
}

/* 逐字露出 */
.bl-char {
  display: inline-block;
  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);
}
`,
  html: `<div class="awesome-shadow">{{LETTERS}}</div>`,
  letterTpl: `<span class="bl-char" style="--i:{i};--n:{n}">{ch}</span>`
});
