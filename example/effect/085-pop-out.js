BL.register({
  id: '085',
  name: '085 popout text',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 85,
  src: 'popout text · CodePen',
  css: `
.bl-wrap {
  background: white;
}

.popout {
  font-family: Futura, sans-serif;
  font-weight: 900;
  font-size: 80px;
  text-align: center;
}

.popout-letter {
  position: relative;
  display: inline-block;
  animation: popout263 1s infinite alternate cubic-bezier(0.86, 0, 0.07, 1);
  animation-delay: calc(var(--i) * -0.1666666667s);
}

@keyframes popout263 {
  0% {
    transform: translate3d(0, 0, 0);
    text-shadow: 0em 0em 0 lightblue;
    color: #00e676;
  }
  30% {
    transform: translate3d(0, 0, 0);
    text-shadow: 0em 0em 0 lightblue;
    color: #00e676;
  }
  70% {
    transform: translate3d(0.08em, -0.08em, 0);
    text-shadow: -0.08em 0.08em lightblue;
    color: #00e676;
  }
  100% {
    transform: translate3d(0.08em, -0.08em, 0);
    text-shadow: -0.08em 0.08em lightblue;
    color: #00e676;
  }
}

/* 取消引擎遮罩,改用逐字露出 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }

/* 恢复颜色: 绿色字体 (text-shadow 已保留) */
:host .bl-wrap .popout,
:host .bl-wrap .popout .popout-letter {
  color: #00e676 !important;
  -webkit-text-fill-color: #00e676 !important;
}

/* 逐字露出 */
:host .bl-wrap .popout-letter {
  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);
}
`,
  html: `<p class="popout">{{LETTERS}}</p>`,
  letterTpl: `<span class="popout-letter" style="--i:{i};--n:{n}">{ch}</span>`
});
