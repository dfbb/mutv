BL.register({
  id: '052',
  name: '052 Pure CSS Animated 3D Text Effect + Fade In As Outline Text Effect',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 52,
  src: 'Pure CSS Animated 3D Text Effect + Fade In As Outline Text Effect · CodePen',
  css: `@import url("https://fonts.googleapis.com/css2?family=Audiowide&display=swap");

.bl-wrap {
  background-color: #ffdd40;
  font-family: "Audiowide", cursive;
  color: #333;
}

.rise {
  font-size: 4rem;
  text-shadow: -0.01em -0.01em 0.01em #000;
  animation: rise 2s ease-in-out 0.5s forwards;
}

@keyframes rise {
  to {
    text-shadow:
      0em 0.01em #ff5,
      0em 0.02em #ff5,
      0em 0.02em 0.03em #ff5,
      -0.01em 0.01em #333,
      -0.02em 0.02em #333,
      -0.03em 0.03em #333,
      -0.04em 0.04em #333,
      -0.01em -0.01em 0.03em #000,
      -0.02em -0.02em 0.03em #000,
      -0.03em -0.03em 0.03em #000;
    transform: translateY(-0.025em) translateX(0.04em);
  }
}
/* 逐字符显示:color/text-shadow(含 rise 动画)由 .rise 继承,字符按歌词时间逐个露出 */
.bl-char {
  display: inline-block;
  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);
}
/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字符显示 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }
`,
  html: `<p class="rise">{{LETTERS}}</p>`,
  letterTpl: `<span class="bl-char" style="--i:{i};--n:{n}">{ch}</span>`
});
