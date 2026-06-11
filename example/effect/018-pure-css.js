BL.register({
  id: '018',
  name: '018 Pure CSS pseudo-randomized keyboard pressing text',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 18,
  src: 'Pure CSS pseudo-randomized keyboard pressing text effect · CodePen',
  css: `
@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@400;900&display=swap");

.bl-wrap {
  background-color: #101013;
  color: #fff;
  font-family: "Poppins", sans-serif;
  font-weight: 900;
}
.key {
  font-size: clamp(2rem, 10vw, 8rem);
  display: inline-block;
  letter-spacing: -0.05em;
  transition: transform 0.2s;
  animation-duration: calc(2s + var(--i) * 0.3s);
  animation-iteration-count: infinite;
  animation-name: pressDown;
  animation-delay: calc(var(--i) * 0.27s);
  /* 按歌词时间逐字符显示:reveal=已到时间字符数/总数,字符 i 在 reveal>i/n 即自身 start 时刻瞬时出现 */
  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);
}
@keyframes pressDown {
  30%, 40%, 100% { transform: translateY(0); }
  35% { transform: translateY(10px); }
}
/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字符显示 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }
`,
  html: `<div class="keyboard">{{LETTERS}}</div>`,
  letterTpl: `<span class="key" style="--i:{i}; --n:{n}">{ch}</span>`
});
