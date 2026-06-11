BL.register({
  id: '048',
  name: '048 Sliced Text Effect',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 48,
  src: 'Sliced Text Effect · CodePen',
  css: `
@import url("https://fonts.googleapis.com/css2?family=Oswald:wght@700&display=swap");
:root {
  --background-color: black;
  --text-color: hsl(0, 0%, 100%);
}
.bl-wrap {
  background-color: var(--background-color);
  display: grid;
  place-content: center;
  font-family: "Oswald", sans-serif;
  font-size: clamp(1.5rem, 1rem + 10vw, 10rem);
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-color);
}
.sliced-wrapper {
  display: grid;
  position: relative;
}
.sliced-wrapper > div {
  grid-area: 1/1/-1/-1;
}
.top {
  clip-path: polygon(0% 0%, 100% 0%, 100% 48%, 0% 58%);
}
.bottom {
  clip-path: polygon(0% 60%, 100% 50%, 100% 100%, 0% 100%);
  color: transparent;
  background: linear-gradient(177deg, black 53%, var(--text-color) 65%);
  background-clip: text;
  -webkit-background-clip: text;
  transform: translateX(-0.02em);
}
/* 逐字符显示:上下两切片层共享 --i/--n 同步逐字露出,clip-path 切片效果不受影响 */
.bl-char {
  display: inline-block;
  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);
}
/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字符显示 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }
`,
  html: `<div class="sliced-wrapper"><div class="top">{{LETTERS}}</div><div class="bottom" aria-hidden="true">{{LETTERS}}</div></div>`,
  letterTpl: `<span class="bl-char" style="--i:{i};--n:{n}">{ch}</span>`
});
