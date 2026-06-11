BL.register({
  id: '076',
  name: '076 CSS Neon Sign',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 76,
  src: 'CSS Neon Sign · CodePen',
  css: `
@import url("https://fonts.googleapis.com/css?family=Sacramento&display=swap");

.bl-wrap {
  background: #222;
  background-image: repeating-linear-gradient(
    to bottom,
    transparent 7px,
    rgba(0, 0, 0, 0.8) 9px,
    rgba(0, 0, 0, 0.8) 13px,
    transparent 13px
  );
}

.neon-sign {
  font-size: calc(20px + 18vh);
  line-height: calc(20px + 20vh);
  text-shadow: 0 0 5px #ffa500, 0 0 15px #ffa500, 0 0 20px #ffa500, 0 0 40px #ffa500,
    0 0 60px #ff0000, 0 0 10px #ff8d00, 0 0 98px #ff0000;
  color: #fff6a9;
  font-family: "Sacramento", cursive;
  text-align: center;
  animation: blink245 12s infinite;
}

@keyframes blink245 {
  20%, 24%, 55% {
    color: #111;
    text-shadow: none;
  }
  0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% {
    text-shadow: 0 0 5px #ffa500, 0 0 15px #ffa500, 0 0 20px #ffa500, 0 0 40px #ffa500,
      0 0 60px #ff0000, 0 0 10px #ff8d00, 0 0 98px #ff0000;
    color: #fff6a9;
  }
}

/* 取消引擎遮罩,改用逐字露出 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }

/* 恢复霓虹灯字色 */
:host .bl-wrap .neon-sign,
:host .bl-wrap .neon-sign .bl-char {
  color: #fff6a9 !important;
  -webkit-text-fill-color: #fff6a9 !important;
}

/* 逐字露出 */
.bl-char {
  display: inline-block;
  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);
}
`,
  html: `<h1 class="neon-sign">{{LETTERS}}</h1>`,
  letterTpl: `<span class="bl-char" style="--i:{i};--n:{n}">{ch}</span>`
});
