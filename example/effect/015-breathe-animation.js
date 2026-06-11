BL.register({
  id: '015',
  name: '015 Breathe animation – Variable Font',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 15,
  src: 'Breathe animation – Variable Font, HTML · CodePen',
  css: `
@font-face {
  font-family: 'TheFont';
  src: url("https://garet.typeforward.com/assets/fonts/shared/TFMixVF.woff2") format('woff2');
}

.bl-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: black;
}
.breathe-text {
  font-family: 'TheFont', sans-serif;
  font-size: clamp(10vw, 20vw, 50vh);
  color: white;
  text-align: center;
  animation: letter-breathe 3s ease-in-out infinite;
}
@keyframes letter-breathe {
  from, to {
    font-variation-settings: 'wght' 100;
  }
  50% {
    font-variation-settings: 'wght' 900;
  }
}
/* 恢复白字(覆盖顶层强制绿);呼吸动画 font-variation-settings 在 .breathe-text 上,子 span 继承 */
:host .bl-wrap .breathe-text,
:host .bl-wrap .breathe-text .bl-char {
  color: #fff !important;
  -webkit-text-fill-color: #fff !important;
}
/* 逐字符显示:字符按歌词时间逐个露出 */
.bl-char {
  display: inline-block;
  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);
}
/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字符显示 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }
`,
  html: `<span class="breathe-text">{{LETTERS}}</span>`,
  letterTpl: `<span class="bl-char" style="--i:{i};--n:{n}">{ch}</span>`
});
