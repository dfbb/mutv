BL.register({
  id: '019',
  name: '019 CSS Neon Text Animation',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 19,
  src: 'CSS Neon Text Animation · CodePen',
  css: `
@font-face {
  font-family: "Liberty";
  src: url("https://s3-us-west-2.amazonaws.com/s.cdpn.io/907368/liberty.otf");
}
.bl-wrap {
  background-color: #1b2431;
  display: flex;
  flex-flow: column;
  justify-content: center;
  align-items: center;
}
.neon-text {
  font-family: "Liberty", serif;
  font-weight: 100;
  font-size: clamp(3rem, 10vw, 7rem);
  letter-spacing: normal;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}
.neon-letter {
  color: #d9fdff;
  text-shadow: 0 0 2rem #00f0ff;
  display: inline-block;
  /* 按歌词时间逐字符显示:字符 i 在 reveal>i/n 即自身 start 时刻瞬时出现 */
  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);
}
/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字符显示 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }
`,
  html: `<h1 class="neon-text">{{LETTERS}}</h1>`,
  letterTpl: `<span class="neon-letter" style="--i:{i}; --n:{n}">{ch}</span>`
});
