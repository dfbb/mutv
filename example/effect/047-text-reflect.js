BL.register({
  id: '047',
  name: '047 Text Reflect Effect Demo',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 47,
  src: 'Text Reflect Effect Demo · CodePen',
  css: `
@import url("https://fonts.googleapis.com/css2?family=Carter+One&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Monoton&display=swap");
.bl-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Monoton", "Carter One", cursive;
}
.reflect-wrap {
  position: relative;
  display: inline-block;
}
p {
  position: relative;
  text-align: center;
  font-size: 72px;
  font-weight: bold;
  margin: 0;
}
p::before {
  content: attr(data-text);
  position: absolute;
  inset: 0;
  transform: rotatex(180deg) translatey(15px);
  transform-origin: 50% 100%;
  white-space: nowrap;
  -webkit-mask: linear-gradient(transparent, #000);
  mask: linear-gradient(transparent, #000);
  /* 倒影用 attr(data-text) 画整行,无法逐字,改用按 --reveal 比例从左到右裁切,与出字同步 */
  clip-path: inset(0 calc((1 - var(--reveal, 1)) * 100%) 0 0);
}
/* 逐字符显示:前景 p 拆成逐字,按歌词时间逐个露出 */
p .bl-char {
  display: inline-block;
  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);
}
/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字符显示 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }
`,
  html: `<div class="reflect-wrap"><p data-text="{{LINE}}">{{LETTERS}}</p></div>`,
  letterTpl: `<span class="bl-char" style="--i:{i};--n:{n}">{ch}</span>`
});
