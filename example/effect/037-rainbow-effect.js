BL.register({
  id: '037',
  name: '037 Rainbow and Trail Effect',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 37,
  src: 'Rainbow and Trail Effect · CodePen',
  css: `
@import url("https://fonts.googleapis.com/css?family=Righteous&display=swap");
:host {
  --color-background: #31037D;
  --axis-x: 1px;
  --axis-y: 1rem;
  --delay: 10;
  --color-black: #000;
  --color-white: #fff;
  --color-orange: #D49C3D;
  --color-red: #D14B3D;
  --color-violet: #CF52EB;
  --color-blue: #44A3F7;
  --color-green: #5ACB3C;
  --color-yellow: #DEBF40;
  --color-foreground: var(--color-white);
  --font-name: Righteous;
}
.bl-wrap {
  background-color: var(--color-background);
  font-size: 24px;
  font-family: var(--font-name);
}
.c-rainbow {
  counter-reset: rainbow;
  position: relative;
  display: block;
  list-style: none;
  padding: 0;
  margin: 0;
}
.c-rainbow__layer {
  --text-color: var(--color-foreground);
  counter-increment: rainbow;
  font-size: 3rem;
  color: var(--text-color);
  text-shadow: -1px -1px 0 var(--color-black), 1px -1px 0 var(--color-black), -1px 1px 0 var(--color-black), 1px 1px 0 var(--color-black), 4px 4px 0 rgba(0, 0, 0, 0.2);
  animation: bl-rainbow 1.5s ease-in-out infinite;
}
.c-rainbow__layer:nth-child(1) { animation-delay: calc(1 / var(--delay) * 1s); left: calc(var(--axis-x) * 1); z-index: -10; }
.c-rainbow__layer:nth-child(2) { animation-delay: calc(2 / var(--delay) * 1s); left: calc(var(--axis-x) * 2); z-index: -20; }
.c-rainbow__layer:nth-child(3) { animation-delay: calc(3 / var(--delay) * 1s); left: calc(var(--axis-x) * 3); z-index: -30; }
.c-rainbow__layer:nth-child(4) { animation-delay: calc(4 / var(--delay) * 1s); left: calc(var(--axis-x) * 4); z-index: -40; }
.c-rainbow__layer:nth-child(5) { animation-delay: calc(5 / var(--delay) * 1s); left: calc(var(--axis-x) * 5); z-index: -50; }
.c-rainbow__layer:nth-child(6) { animation-delay: calc(6 / var(--delay) * 1s); left: calc(var(--axis-x) * 6); z-index: -60; }
.c-rainbow__layer:nth-child(7) { animation-delay: calc(7 / var(--delay) * 1s); left: calc(var(--axis-x) * 7); z-index: -70; }
.c-rainbow__layer:not(:first-child) {
  position: absolute;
  top: 0;
}
.c-rainbow__layer--white  { --text-color: var(--color-white); }
.c-rainbow__layer--orange { --text-color: var(--color-orange); }
.c-rainbow__layer--red    { --text-color: var(--color-red); }
.c-rainbow__layer--violet { --text-color: var(--color-violet); }
.c-rainbow__layer--blue   { --text-color: var(--color-blue); }
.c-rainbow__layer--green  { --text-color: var(--color-green); }
.c-rainbow__layer--yellow { --text-color: var(--color-yellow); }
@keyframes bl-rainbow {
  0%, 100% { transform: translatey(var(--axis-y)); }
  50%       { transform: translatey(calc(var(--axis-y) * -1)); }
}
/* 逐字符显示:每层(7 色)内的字符按歌词时间同步露出,字符 i 在 reveal>i/n 即自身 start 时刻出现 */
.c-rainbow__char {
  display: inline-block;
  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);
}
/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字符显示 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }
`,
  html: `<ul class="c-rainbow">
  <li class="c-rainbow__layer c-rainbow__layer--white">{{LETTERS}}</li>
  <li class="c-rainbow__layer c-rainbow__layer--orange">{{LETTERS}}</li>
  <li class="c-rainbow__layer c-rainbow__layer--red">{{LETTERS}}</li>
  <li class="c-rainbow__layer c-rainbow__layer--violet">{{LETTERS}}</li>
  <li class="c-rainbow__layer c-rainbow__layer--blue">{{LETTERS}}</li>
  <li class="c-rainbow__layer c-rainbow__layer--green">{{LETTERS}}</li>
  <li class="c-rainbow__layer c-rainbow__layer--yellow">{{LETTERS}}</li>
</ul>`,
  letterTpl: `<span class="c-rainbow__char" style="--i:{i};--n:{n}">{ch}</span>`
});
