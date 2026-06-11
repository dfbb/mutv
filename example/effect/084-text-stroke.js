BL.register({
  id: '084',
  name: '084 Strokes, Shadows + Halftone Effects',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 84,
  src: 'Strokes, Shadows + Halftone Effects · CodePen',
  css: `
.bl-wrap {
  background-color: #fef3c7;
}

.stroke-shadow {
  font-size: 12vw;
  font-weight: bold;
  letter-spacing: 5px;
  text-align: center;
  color: #fef3c7;
  text-shadow:
    -2px 0 #111827, 0 -2px #111827, 2px 0 #111827, 0 2px #111827,
    2px 2px #111827, -2px -2px #111827, -2px 2px #111827, 2px -2px #111827,
    6px 6px #db2777;
}

/* 取消引擎遮罩,改用逐字露出 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }

/* 恢复原始米色字面色(描边/投影由 text-shadow 提供,未被覆盖) */
:host .bl-wrap .stroke-shadow,
:host .bl-wrap .stroke-shadow .bl-char {
  color: #fef3c7 !important;
  -webkit-text-fill-color: #fef3c7 !important;
}

/* 逐字露出 */
.bl-char {
  display: inline-block;
  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);
}
`,
  letterTpl: `<span class="bl-char" style="--i:{i};--n:{n}">{ch}</span>`,
  html: `<p class="stroke-shadow">{{LETTERS}}</p>`
});
