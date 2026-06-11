BL.register({
  id: '082',
  name: '082 Blazing Fire',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 82,
  src: 'Blazing Fire · CodePen',
  css: `
@import url(https://fonts.googleapis.com/css?family=Akronim);

.bl-wrap {
  background: #ca8;
}

.fire-wrap {
  width: 80%;
  max-width: 1000px;
  border-radius: 10px;
  font-family: 'Akronim';
  overflow: hidden;
  text-align: center;
}

.blazing {
  display: inline-block;
  margin: 0;
  color: rgb(255, 115, 0);
  font-size: 100px;
  line-height: 1.2;
  text-shadow:
    0 3px 20px red,
    0 0 20px red,
    0 0 10px orange,
    4px -5px 6px yellow,
    -4px -10px 10px yellow,
    0 -10px 30px yellow;
  animation: blazing257 2s infinite alternate linear;
}

@keyframes blazing257 {
  0% {
    text-shadow: 0 3px 20px red, 0 0 20px red, 0 0 10px orange,
      0 0 0 yellow, 0 0 5px yellow, -2px -5px 5px yellow, 4px -10px 10px yellow;
  }
  25% {
    text-shadow: 0 3px 20px red, 0 0 30px red, 0 0 20px orange,
      0 0 5px yellow, -2px -5px 5px yellow, 3px -10px 10px yellow, -4px -15px 20px yellow;
  }
  50% {
    text-shadow: 0 3px 20px red, 0 0 20px red, 0 -5px 10px orange,
      -2px -5px 5px yellow, 3px -10px 10px yellow, -4px -15px 20px yellow,
      2px -20px 30px rgba(255,255,0,0.5);
  }
  75% {
    text-shadow: 0 3px 20px red, 0 0 20px red, 0 -5px 10px orange,
      3px -5px 5px yellow, -4px -10px 10px yellow,
      2px -20px 30px rgba(255,255,0,0.5), 0px -25px 40px rgba(255,255,0,0);
  }
  100% {
    text-shadow: 0 3px 20px red, 0 0 20px red, 0 0 10px orange,
      0 0 0 yellow, 0 0 5px yellow, -2px -5px 5px yellow, 4px -10px 10px yellow;
  }
}

/* 取消引擎遮罩,改用逐字露出 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }

/* 恢复火焰橙色 */
:host .bl-wrap .blazing,
:host .bl-wrap .blazing .bl-char {
  color: rgb(255, 115, 0) !important;
  -webkit-text-fill-color: rgb(255, 115, 0) !important;
}

.bl-char {
  display: inline-block;
  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);
}
`,
  letterTpl: `<span class="bl-char" style="--i:{i};--n:{n}">{ch}</span>`,
  html: `<div class="fire-wrap"><h1 class="blazing">{{LETTERS}}</h1></div>`
});
