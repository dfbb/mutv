BL.register({
  id: '078',
  name: '078 Neon',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 78,
  src: 'Neon · CodePen',
  css: `
@import url('https://fonts.googleapis.com/css?family=Vibur&display=swap');

.bl-wrap {
  background-color: #141414;
}

.neon-span {
  font-family: "Vibur", cursive;
  font-size: 5.6rem;
  text-align: center;
  line-height: 1;
  color: #c6e2ff;
  animation: neon249 0.08s ease-in-out infinite alternate;
}

@keyframes neon249 {
  from {
    text-shadow:
      0 0 6px rgba(202, 228, 225, 0.92),
      0 0 30px rgba(202, 228, 225, 0.34),
      0 0 12px rgba(30, 132, 242, 0.52),
      0 0 21px rgba(30, 132, 242, 0.92),
      0 0 34px rgba(30, 132, 242, 0.78),
      0 0 54px rgba(30, 132, 242, 0.92);
  }
  to {
    text-shadow:
      0 0 6px rgba(202, 228, 225, 0.98),
      0 0 30px rgba(202, 228, 225, 0.42),
      0 0 12px rgba(30, 132, 242, 0.58),
      0 0 22px rgba(30, 132, 242, 0.84),
      0 0 38px rgba(30, 132, 242, 0.88),
      0 0 60px #1e84f2;
  }
}

/* 取消引擎遮罩,改用逐字露出 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }

/* 恢复霓虹文字颜色 */
:host .bl-wrap .neon-span,
:host .bl-wrap .neon-span .bl-char {
  color: #c6e2ff !important;
  -webkit-text-fill-color: #c6e2ff !important;
}

/* 逐字露出 */
.bl-char {
  display: inline-block;
  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);
}
`,
  letterTpl: `<span class="bl-char" style="--i:{i};--n:{n}">{ch}</span>`,
  html: `<span class="neon-span">{{LETTERS}}</span>`
});
