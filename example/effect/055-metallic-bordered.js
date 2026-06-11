BL.register({
  id: '055',
  name: '055 Metallic Bordered Text with CSS',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 55,
  src: 'Metallic Bordered Text with CSS · CodePen',
  css: `@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@900&display=swap");

:host {
  --gold: #ffb338;
  --light-shadow: #77571d;
  --dark-shadow: #3e2904;
}

.bl-wrap {
  background: radial-gradient(#272727, #1b1b1b);
  text-transform: uppercase;
}

.metallic-wrap {
  display: grid;
  grid-template-areas: 'overlap';
  place-content: center;
}

.metallic-wrap > div {
  background-clip: text;
  -webkit-background-clip: text;
  color: #363833;
  font-family: 'Poppins', sans-serif;
  font-weight: 900;
  font-size: clamp(3em, 18vw, 10rem);
  grid-area: overlap;
  letter-spacing: 1px;
  -webkit-text-stroke: 4px transparent;
}

.metallic-wrap .bg {
  background-image: repeating-linear-gradient(105deg,
    var(--gold) 0%,
    var(--dark-shadow) 5%,
    var(--gold) 12%);
  color: transparent;
  filter: drop-shadow(5px 15px 15px black);
  transform: scaleY(1.05);
  transform-origin: top;
}

.metallic-wrap .fg {
  background-image: repeating-linear-gradient(5deg,
    var(--gold) 0%,
    var(--light-shadow) 23%,
    var(--gold) 31%);
  color: #1e2127;
  transform: scale(1);
}
/* 用更高优先级(:host .bl-wrap .x = 0,3,0)覆盖顶层 VISUAL_OVERRIDE 的强制绿字,恢复金属渐变 */
:host .bl-wrap .metallic-wrap .bg {
  background-image: repeating-linear-gradient(105deg,
    var(--gold) 0%, var(--dark-shadow) 5%, var(--gold) 12%) !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  color: transparent !important;
  -webkit-text-fill-color: transparent !important;
}
:host .bl-wrap .metallic-wrap .fg {
  background-image: repeating-linear-gradient(5deg,
    var(--gold) 0%, var(--light-shadow) 23%, var(--gold) 31%) !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  color: #1e2127 !important;
  -webkit-text-fill-color: #1e2127 !important;
}
/* 两层金属文字保持渐变连续,按 --reveal 裁切(CJK 等宽 => 恰好逐字步进露出) */
:host .bl-wrap .metallic-wrap > div {
  clip-path: inset(0 calc((1 - var(--reveal, 1)) * 100%) 0 0);
}
/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字裁切 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }`,
  html: `<div class="metallic-wrap"><div class="bg">{{LINE}}</div><div class="fg">{{LINE}}</div></div>`
});
