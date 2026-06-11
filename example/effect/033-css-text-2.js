BL.register({
  id: '033',
  name: '033 CSS Text-Shadow Animation',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 33,
  src: 'CSS Text-Shadow Animation · CodePen',
  css: `@import url("https://fonts.googleapis.com/css2?family=Titan+One&display=swap");
.bl-wrap {
  background: #000;
}

.wrapper {
  width: 100%;
  text-align: center;
}
.wrapper .ch {
  -webkit-text-stroke-width: 1.25px;
  -webkit-text-stroke-color: #000;
  font-size: 100px;
  text-shadow: 0 0px #f3c623, 0 0px #f2aaaa;
  transform: translate(0, 100%) rotate(4deg);
  animation: jump 2s ease-in-out infinite;
  animation-delay: calc(var(--i) * 120ms);
  display: inline-block;
  font-family: "Titan One", cursive;
  color: #fff;
  /* 按歌词时间逐字符出现:字符 i 在 reveal>i/n 即自身 start 时刻显示 */
  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);
}

@keyframes jump {
  33% {
    text-shadow: 0 60px #f37121, 0 150px #f2aaaa;
  }
  50% {
    transform: translate(0, 0) rotate(-4deg);
    text-shadow: 0 0px #8fc0a9, 0 0px #84a9ac;
  }
  66.67% {
    text-shadow: 0 -60px #d54062, 0 -150px #8fc0a9;
  }
}
/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字符显示 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }`,
  html: `<div class="wrapper">{{LETTERS}}</div>`,
  letterTpl: `<span class="ch" style="--i:{i};--n:{n}">{ch}</span>`
});
