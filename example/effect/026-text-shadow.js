BL.register({
  id: '026',
  name: '026 Text Shadow',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 26,
  src: 'Text Shadow · CodePen',
  css: `@import url("https://fonts.googleapis.com/css2?family=Alumni+Sans:wght@400;600;700&display=swap");
.bl-wrap {
  font-family: "Alumni Sans", sans-serif;
  font-size: 16px;
  background: #212121;
  color: #fff;
  text-transform: uppercase;
}

h1.text-shadow {
  font-size: 2.5em;
  text-decoration: underline;
}

.text-shadow {
  font-style: italic;
  text-transform: uppercase;
  color: transparent;
  -webkit-text-stroke: #fff;
  -webkit-text-stroke-width: 1px;
  text-shadow: 2px 2px 10px #2962ff;
  text-align: center;
  letter-spacing: 0.2em;
}

/* 外层:按歌词时间逐字符出现(reveal 门控)。字符 i 在 reveal>i/n 即自身 start 时刻显示 */
.ts {
  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);
}
/* 内层:保留原 flicker 闪烁(opacity 与阴影脉动);与外层 reveal 门控相乘 */
.ts-g {
  -webkit-animation: flicker 0.5s ease-in-out infinite alternate;
          animation: flicker 0.5s ease-in-out infinite alternate;
}

@-webkit-keyframes flicker {
  0%   { opacity: 0.5; text-shadow: 2px 2px 10px #2962ff; }
  100% { opacity: 1;   text-shadow: 2px 2px 20px #2962ff; }
}
@keyframes flicker {
  0%   { opacity: 0.5; text-shadow: 2px 2px 10px #2962ff; }
  100% { opacity: 1;   text-shadow: 2px 2px 20px #2962ff; }
}
/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字符显示 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }`,
  html: `<h1 class="text-shadow">{{LETTERS}}</h1>`,
  letterTpl: `<span class="ts" style="--i:{i}; --n:{n}"><span class="ts-g">{ch}</span></span>`
});
