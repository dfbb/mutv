BL.register({
  id: '039',
  name: '039 mix-blend-mode',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 39,
  src: 'mix-blend-mode · CodePen',
  css: `
:host {
  --primary-color: #6CD9CE;
  --secondary-color: #D93BA1;
  --complimentary-color: #2E2473;
}
.bl-wrap {
  background-color: var(--complimentary-color);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  position: relative;
  overflow: hidden;
}
h1.bl-mixblend {
  font-size: clamp(3rem, 10vw, 9rem);
  color: var(--primary-color);
  transform: translateY(-600px);
  animation: bl-slideIn 1.2s ease-in-out forwards 1s;
  z-index: 10;
  position: relative;
  margin: 0;
}
h1.bl-mixblend::before {
  content: '';
  /* 粉色横条宽度跟随逐字露出比例(引擎每帧设的 --reveal),不再提前画满 */
  width: calc(var(--reveal, 1) * 100%);
  height: 76px;
  background-color: var(--secondary-color);
  position: absolute;
  left: 0;
  bottom: -10px;
  mix-blend-mode: screen;
}
.bl-overlay {
  position: absolute;
  width: 100%;
  top: 0;
  bottom: 0;
  opacity: 0;
  left: 0;
  right: 0;
  background-color: var(--secondary-color);
  transform: scale(0.5);
  animation: bl-slideIn 0.5s ease-in-out forwards, bl-skewBg 1s ease-in-out;
}
@keyframes bl-skewBg {
  0%   { transform: scale(0.5); }
  100% { transform: scale(1); }
}
@keyframes bl-slideIn {
  100% { transform: translateY(0px); opacity: 1; }
}
/* 逐字符显示:整行保留 translateY 滑入入场,字符按歌词时间逐个露出,
   字符 i 在 reveal>i/n 即自身 start 时刻出现 */
.bl-char {
  display: inline-block;
  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);
}
/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字符显示 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }
`,
  html: `<h1 class="bl-mixblend">{{LETTERS}}</h1><div class="bl-overlay"></div>`,
  letterTpl: `<span class="bl-char" style="--i:{i};--n:{n}">{ch}</span>`
});
