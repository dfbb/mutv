BL.register({
  id: '054',
  name: '054 Gradient Stroke',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 54,
  src: 'Gradient Stroke · CodePen',
  css: `@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@700&display=swap");

:host {
  --color-background: #000119;
  --stroke-width: calc(1em / 16);
  --font-weight: 700;
  --letter-spacing: calc(1em / 8);
}

.bl-wrap {
  background-color: var(--color-background, #000119);
  padding: 5vmin;
}

.gradient-stroke {
  -webkit-background-clip: text;
  background-clip: text;
  background-image: linear-gradient(to right, #09f1b8, #00a2ff, #ff00d2, #fed90f);
  color: var(--color-background, #000119);
  font-family: Poppins, sans-serif;
  font-size: clamp(3rem, 15vw, 8rem);
  font-weight: var(--font-weight, 700);
  letter-spacing: var(--letter-spacing, calc(1em / 8));
  -webkit-text-stroke-color: transparent;
  -webkit-text-stroke-width: var(--stroke-width, calc(1em / 16));
  text-align: center;
  margin: 0;
}
/* 用更高优先级(:host .bl-wrap .x = 0,3,0)覆盖顶层 VISUAL_OVERRIDE 的强制绿字,恢复渐变描边 */
:host .bl-wrap .gradient-stroke {
  background: linear-gradient(to right, #09f1b8, #00a2ff, #ff00d2, #fed90f) !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  color: var(--color-background, #000119) !important;
  -webkit-text-fill-color: var(--color-background, #000119) !important;
  /* 整行渐变保持连续,按 --reveal 裁切(CJK 等宽 => 恰好逐字步进露出) */
  clip-path: inset(0 calc((1 - var(--reveal, 1)) * 100%) 0 0);
}
/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字裁切 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }`,
  html: `<h1 class="gradient-stroke">{{LINE}}</h1>`
});
