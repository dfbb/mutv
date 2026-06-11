BL.register({
  id: '038',
  name: '038 Breathe (Coded on iOS)',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 38,
  src: 'Breathe (Coded on iOS) · CodePen',
  css: `
@font-face {
  font-family: Clip;
  src: url("https://acupoftee.github.io/fonts/Clip.ttf");
}
.bl-wrap {
  background-color: #141114;
  background-image: linear-gradient(335deg, black 23px, transparent 23px),
    linear-gradient(155deg, black 23px, transparent 23px),
    linear-gradient(335deg, black 23px, transparent 23px),
    linear-gradient(155deg, black 23px, transparent 23px);
  background-size: 58px 58px;
  background-position: 0px 2px, 4px 35px, 29px 31px, 34px 6px;
}
.bl-sign {
  display: flex;
  justify-content: center;
  align-items: center;
  background-image: radial-gradient(ellipse 50% 35% at 50% 50%, #6b1839, transparent);
  font-family: "Clip";
  text-transform: uppercase;
  font-size: 6em;
  color: #ffe6ff;
  text-shadow: 0 0 0.6rem #ffe6ff, 0 0 1.5rem #ff65bd,
    -0.2rem 0.1rem 1rem #ff65bd, 0.2rem 0.1rem 1rem #ff65bd,
    0 -0.5rem 2rem #ff2483, 0 0.5rem 3rem #ff2483;
  animation: bl-shine 2s forwards, bl-flicker 3s infinite;
}
@keyframes bl-blink {
  0%, 22%, 36%, 75% {
    color: #ffe6ff;
    text-shadow: 0 0 0.6rem #ffe6ff, 0 0 1.5rem #ff65bd,
      -0.2rem 0.1rem 1rem #ff65bd, 0.2rem 0.1rem 1rem #ff65bd,
      0 -0.5rem 2rem #ff2483, 0 0.5rem 3rem #ff2483;
  }
  28%, 33% { color: #ff65bd; text-shadow: none; }
  82%, 97% { color: #ff2483; text-shadow: none; }
}
@keyframes bl-shine {
  0%   { color: #6b1839; text-shadow: none; }
  100% { color: #ffe6ff; text-shadow: 0 0 0.6rem #ffe6ff, 0 0 1.5rem #ff65bd, -0.2rem 0.1rem 1rem #ff65bd, 0.2rem 0.1rem 1rem #ff65bd, 0 -0.5rem 2rem #ff2483, 0 0.5rem 3rem #ff2483; }
}
@keyframes bl-flicker {
  from { opacity: 1; }
  4%   { opacity: 0.9; }
  6%   { opacity: 0.85; }
  8%   { opacity: 0.95; }
  10%  { opacity: 0.9; }
  11%  { opacity: 0.922; }
  12%  { opacity: 0.9; }
  14%  { opacity: 0.95; }
  16%  { opacity: 0.98; }
  17%  { opacity: 0.9; }
  19%  { opacity: 0.93; }
  20%  { opacity: 0.99; }
  24%  { opacity: 1; }
  26%  { opacity: 0.94; }
  28%  { opacity: 0.98; }
  37%  { opacity: 0.93; }
  38%  { opacity: 0.5; }
  39%  { opacity: 0.96; }
  42%  { opacity: 1; }
  44%  { opacity: 0.97; }
  46%  { opacity: 0.94; }
  56%  { opacity: 0.9; }
  58%  { opacity: 0.9; }
  60%  { opacity: 0.99; }
  68%  { opacity: 1; }
  70%  { opacity: 0.9; }
  72%  { opacity: 0.95; }
  93%  { opacity: 0.93; }
  95%  { opacity: 0.95; }
  97%  { opacity: 0.93; }
  to   { opacity: 1; }
}
/* 逐字符显示:霓虹辉光/闪烁仍在 .bl-sign 容器上(color/text-shadow 被子 span 继承),
   字符按歌词时间逐个露出,字符 i 在 reveal>i/n 即自身 start 时刻出现 */
.bl-char {
  display: inline-block;
  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);
}
/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字符显示 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }
`,
  html: `<div class="bl-sign">{{LETTERS}}</div>`,
  letterTpl: `<span class="bl-char" style="--i:{i};--n:{n}">{ch}</span>`
});
