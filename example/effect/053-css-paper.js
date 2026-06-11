BL.register({
  id: '053',
  name: '053 CSS Paper Cut-out Effect',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 53,
  src: 'CSS Paper Cut-out Effect · CodePen',
  css: `@import url("https://fonts.googleapis.com/css2?family=Titillium+Web:wght@900&display=swap");

:host {
  --hs: 225, 100%;
  --paper: hsl(var(--hs), 25%);
  --highlight: hsl(var(--hs), 45%);
  --shadow: hsl(var(--hs), 15%);
}

.bl-wrap {
  background-color: var(--paper, hsl(225, 100%, 25%));
}

.cutout-text {
  font-family: "Titillium Web", sans-serif;
  font-size: clamp(4rem, 15vw, 12rem);
  letter-spacing: 0.1em;
  display: grid;
  place-items: center;
  grid-template-areas: "text";
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  background-image: linear-gradient(305deg, tomato, gold, cyan);
  margin: 0;
  text-transform: uppercase;
}

.cutout-text > *, .cutout-text::after {
  grid-area: text;
}

.cutout-text::after {
  content: attr(data-text);
  color: var(--paper, hsl(225, 100%, 25%));
  transform: translate(0.1em, 0.1em);
  filter: drop-shadow(0.015em 0.015em 0.025em var(--shadow, hsl(225, 100%, 15%)));
  -webkit-background-clip: text;
  color: transparent;
  background-image: linear-gradient(var(--highlight, hsl(225, 100%, 45%)), var(--paper, hsl(225, 100%, 25%)));
  /* 偏移层用 attr(data-text) 画整行,无法逐字,改用按 --reveal 比例从左到右裁切,与出字同步 */
  clip-path: inset(0 calc((1 - var(--reveal, 1)) * 100%) 0 0);
}
/* 逐字符显示:前景 span 拆成逐字,按歌词时间逐个露出 */
.cutout-text .bl-char {
  display: inline-block;
  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);
}
/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字符显示 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }
`,
  html: `<h1 class="cutout-text" data-text="{{LINE}}"><span>{{LETTERS}}</span></h1>`,
  letterTpl: `<span class="bl-char" style="--i:{i};--n:{n}">{ch}</span>`
});
