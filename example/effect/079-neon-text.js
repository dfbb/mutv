BL.register({
  id: '079',
  name: '079 Neon Text Effect',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 79,
  src: 'Neon Text Effect · CodePen',
  css: `
.bl-wrap {
  background-color: #010a00;
}

.neon {
  color: #fff;
  font-weight: 400;
  text-align: center;
  text-transform: uppercase;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  font-size: 3rem;
  text-shadow:
    0 0 5px #fff,
    0 0 10px #fff,
    0 0 20px #fff,
    0 0 40px #0ff,
    0 0 80px #0ff,
    0 0 90px #0ff,
    0 0 100px #0ff,
    0 0 150px #0ff;
}

/* 取消引擎遮罩,改用逐字露出 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }

/* 恢复颜色: 霓虹白字 (text-shadow 未被覆盖,青色辉光自动显现) */
:host .bl-wrap .neon,
:host .bl-wrap .neon .bl-char { color: #fff !important; -webkit-text-fill-color: #fff !important; }

/* 逐字露出 */
.bl-char { display: inline-block; opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1); }
`,
  letterTpl: `<span class="bl-char" style="--i:{i};--n:{n}">{ch}</span>`,
  html: `<h1 class="neon">{{LETTERS}}</h1>`
});
