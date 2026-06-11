BL.register({
  id: '077',
  name: '077 Flickering Neon Sign Effect using CSS Text & Box Shadow',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 77,
  src: 'Flickering Neon Sign Effect using CSS Text & Box Shadow · CodePen',
  css: `
@import url(https://fonts.googleapis.com/css?family=Exo+2:200i);

:root {
  --neon-text-color: #f40;
  --neon-border-color: #08f;
}

.bl-wrap {
  background: #000;
  font-family: 'Exo 2', sans-serif;
}

.neon-box {
  font-size: 8rem;
  font-weight: 200;
  font-style: italic;
  color: #fff;
  padding: 2rem 3rem 2.5rem;
  border: 0.4rem solid #fff;
  border-radius: 2rem;
  text-transform: uppercase;
  animation: flicker248 1.5s infinite alternate;
}

@keyframes flicker248 {
  0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% {
    text-shadow:
      -0.2rem -0.2rem 1rem #fff,
      0.2rem 0.2rem 1rem #fff,
      0 0 2rem var(--neon-text-color),
      0 0 4rem var(--neon-text-color),
      0 0 6rem var(--neon-text-color),
      0 0 8rem var(--neon-text-color),
      0 0 10rem var(--neon-text-color);
    box-shadow:
      0 0 .5rem #fff,
      inset 0 0 .5rem #fff,
      0 0 2rem var(--neon-border-color),
      inset 0 0 2rem var(--neon-border-color),
      0 0 4rem var(--neon-border-color),
      inset 0 0 4rem var(--neon-border-color);
  }
  20%, 24%, 55% {
    text-shadow: none;
    box-shadow: none;
  }
}

/* 取消引擎遮罩,改用逐字露出 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }

/* 恢复颜色: 白色霓虹文字 */
:host .bl-wrap .neon-box,
:host .bl-wrap .neon-box .bl-char {
  color: #fff !important;
  -webkit-text-fill-color: #fff !important;
}

/* 逐字露出 */
.bl-char {
  display: inline-block;
  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);
}
`,
  letterTpl: `<span class="bl-char" style="--i:{i};--n:{n}">{ch}</span>`,
  html: `<h1 class="neon-box">{{LETTERS}}</h1>`
});
