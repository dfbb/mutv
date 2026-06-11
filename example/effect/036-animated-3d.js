BL.register({
  id: '036',
  name: '036 3D Text (scss) - animated',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 36,
  src: '3D Text (scss) - animated · CodePen',
  css: `
@import url(https://fonts.googleapis.com/css?family=Archivo+Black&display=swap);
.bl-wrap {
  background-color: #E4FFF7;
}
h1.playful {
  font-size: 65px;
  text-transform: uppercase;
  font-family: "Archivo Black", "Archivo", sans-serif;
  font-weight: normal;
  display: block;
  text-align: center;
}
h1.playful .text-letter {
  position: relative;
  display: inline-block;
  /* 按歌词时间逐字符显示:字符 i 在 reveal>i/n 即自身 start 时刻瞬时出现 */
  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);
  color: #5362F6;
  text-shadow: 0.25px 0.25px #E485F8, 0.5px 0.5px #E485F8, 0.75px 0.75px #E485F8, 1px 1px #E485F8, 1.25px 1.25px #E485F8, 1.5px 1.5px #E485F8, 1.75px 1.75px #E485F8, 2px 2px #E485F8, 2.25px 2.25px #E485F8, 2.5px 2.5px #E485F8, 2.75px 2.75px #E485F8, 3px 3px #E485F8, 3.25px 3.25px #E485F8, 3.5px 3.5px #E485F8, 3.75px 3.75px #E485F8, 4px 4px #E485F8, 4.25px 4.25px #E485F8, 4.5px 4.5px #E485F8, 4.75px 4.75px #E485F8, 5px 5px #E485F8, 5.25px 5.25px #E485F8, 5.5px 5.5px #E485F8, 5.75px 5.75px #E485F8, 6px 6px #E485F8;
  animation: bl-scatter 1.75s infinite;
}
h1.playful .text-letter:nth-child(2n) {
  color: #ED625C;
  text-shadow: 0.25px 0.25px #F2A063, 0.5px 0.5px #F2A063, 0.75px 0.75px #F2A063, 1px 1px #F2A063, 1.25px 1.25px #F2A063, 1.5px 1.5px #F2A063, 1.75px 1.75px #F2A063, 2px 2px #F2A063, 2.25px 2.25px #F2A063, 2.5px 2.5px #F2A063, 2.75px 2.75px #F2A063, 3px 3px #F2A063, 3.25px 3.25px #F2A063, 3.5px 3.5px #F2A063, 3.75px 3.75px #F2A063, 4px 4px #F2A063, 4.25px 4.25px #F2A063, 4.5px 4.5px #F2A063, 4.75px 4.75px #F2A063, 5px 5px #F2A063, 5.25px 5.25px #F2A063, 5.5px 5.5px #F2A063, 5.75px 5.75px #F2A063, 6px 6px #F2A063;
  animation-delay: 0.3s;
}
h1.playful .text-letter:nth-child(3n) {
  color: #FFD913;
  text-shadow: 0.25px 0.25px #6EC0A9, 0.5px 0.5px #6EC0A9, 0.75px 0.75px #6EC0A9, 1px 1px #6EC0A9, 1.25px 1.25px #6EC0A9, 1.5px 1.5px #6EC0A9, 1.75px 1.75px #6EC0A9, 2px 2px #6EC0A9, 2.25px 2.25px #6EC0A9, 2.5px 2.5px #6EC0A9, 2.75px 2.75px #6EC0A9, 3px 3px #6EC0A9, 3.25px 3.25px #6EC0A9, 3.5px 3.5px #6EC0A9, 3.75px 3.75px #6EC0A9, 4px 4px #6EC0A9, 4.25px 4.25px #6EC0A9, 4.5px 4.5px #6EC0A9, 4.75px 4.75px #6EC0A9, 5px 5px #6EC0A9, 5.25px 5.25px #6EC0A9, 5.5px 5.5px #6EC0A9, 5.75px 5.75px #6EC0A9, 6px 6px #6EC0A9;
  animation-delay: 0.15s;
}
h1.playful .text-letter:nth-child(5n) {
  color: #555BFF;
  text-shadow: 0.25px 0.25px #E485F8, 0.5px 0.5px #E485F8, 0.75px 0.75px #E485F8, 1px 1px #E485F8, 1.25px 1.25px #E485F8, 1.5px 1.5px #E485F8, 1.75px 1.75px #E485F8, 2px 2px #E485F8, 2.25px 2.25px #E485F8, 2.5px 2.5px #E485F8, 2.75px 2.75px #E485F8, 3px 3px #E485F8, 3.25px 3.25px #E485F8, 3.5px 3.5px #E485F8, 3.75px 3.75px #E485F8, 4px 4px #E485F8, 4.25px 4.25px #E485F8, 4.5px 4.5px #E485F8, 4.75px 4.75px #E485F8, 5px 5px #E485F8, 5.25px 5.25px #E485F8, 5.5px 5.5px #E485F8, 5.75px 5.75px #E485F8, 6px 6px #E485F8;
  animation-delay: 0.4s;
}
h1.playful .text-letter:nth-child(7n),
h1.playful .text-letter:nth-child(11n) {
  color: #FF9C55;
  text-shadow: 0.25px 0.25px #FF5555, 0.5px 0.5px #FF5555, 0.75px 0.75px #FF5555, 1px 1px #FF5555, 1.25px 1.25px #FF5555, 1.5px 1.5px #FF5555, 1.75px 1.75px #FF5555, 2px 2px #FF5555, 2.25px 2.25px #FF5555, 2.5px 2.5px #FF5555, 2.75px 2.75px #FF5555, 3px 3px #FF5555, 3.25px 3.25px #FF5555, 3.5px 3.5px #FF5555, 3.75px 3.75px #FF5555, 4px 4px #FF5555, 4.25px 4.25px #FF5555, 4.5px 4.5px #FF5555, 4.75px 4.75px #FF5555, 5px 5px #FF5555, 5.25px 5.25px #FF5555, 5.5px 5.5px #FF5555, 5.75px 5.75px #FF5555, 6px 6px #FF5555;
  animation-delay: 0.25s;
}
@keyframes bl-scatter {
  0% { top: 0; }
  50% { top: -10px; }
  100% { top: 0; }
}
/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字符显示 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }
`,
  html: `<h1 class="playful">{{LETTERS}}</h1>`,
  letterTpl: `<span class="text-letter" style="--i:{i};--n:{n}" aria-hidden="true">{ch}</span>`
});
