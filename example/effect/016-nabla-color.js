BL.register({
  id: '016',
  name: '016 Nabla color font!',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 16,
  src: 'Nabla color font! · CodePen',
  css: `
@import url("https://fonts.googleapis.com/css2?family=Nabla:EDPT,EHLT@30..200,24&display=swap");

.bl-wrap {
  background-color: #000;
}
h1.nabla-title {
  font-size: 12vw;
  font-family: Nabla;
  margin: 0;
}
@font-palette-values --Nabla {
  font-family: Nabla;
  base-palette: 2;
}
.nabla-letter {
  animation: depth 1s ease-in-out alternate infinite;
  position: relative;
  display: inline-block;
  font-variation-settings: "EDPT" 30;
  font-palette: --Nabla;
  animation-delay: calc(var(--i) * 0.1s);
  /* 按时间逐字符显示：reveal=已到时间字符数/总数；字符 i 在 reveal>i/n 即自身 start 时刻瞬时出现，
     与字幕时间轴完全同步(不加 opacity 过渡，避免淡入造成滞后) */
  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);
}
@keyframes depth {
  0% {
    transform: translateX(0) translateY(0);
  }
  100% {
    font-variation-settings: "EDPT" 200;
    transform: translateX(0.15em) translateY(0.1em);
  }
}
/* 取消引擎按宽度推进的逐字遮罩(与变宽字体+位移动画不同步、显得慢)，改用上面的逐字符显示 */
:host .bl-wrap {
  -webkit-mask-image: none !important;
          mask-image: none !important;
}
`,
  html: `<h1 class="nabla-title">{{LETTERS}}</h1>`,
  letterTpl: `<span class="nabla-letter" style="--i:{i}; --n:{n}">{ch}</span>`
});
