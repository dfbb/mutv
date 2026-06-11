BL.register({
  id: '056',
  name: '056 Multi Colored Text with CSS',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 56,
  src: 'Multi Colored Text with CSS · CodePen',
  css: `@import url("https://fonts.googleapis.com/css2?family=Exo:wght@900&display=swap");

:host {
  --color-1: #186cb8;
  --color-2: #2a9a9f;
  --color-3: #f1b211;
  --color-4: #e83611;
  --color-5: #f9002f;
}

.bl-wrap {
  background: #000;
  line-height: 1;
}

.multicolor-text {
  font-family: "Exo", sans-serif;
  font-size: clamp(3rem, 12vw, 8rem);
  font-weight: 900;
  text-transform: uppercase;
  text-align: center;
  background: linear-gradient(219deg,
    var(--color-1) 19%,
    transparent 19%, transparent 20%,
    var(--color-2) 20%, var(--color-2) 39%,
    transparent 39%, transparent 40%,
    var(--color-3) 40%, var(--color-3) 59%,
    transparent 59%, transparent 60%,
    var(--color-4) 60%, var(--color-4) 79%,
    transparent 79%, transparent 80%,
    var(--color-5) 80%);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  margin: 0;
}
/* 用更高优先级(:host .bl-wrap .x = 0,3,0)覆盖顶层 VISUAL_OVERRIDE 的强制绿字,恢复多色条纹 */
:host .bl-wrap .multicolor-text {
  background: linear-gradient(219deg,
    var(--color-1) 19%,
    transparent 19%, transparent 20%,
    var(--color-2) 20%, var(--color-2) 39%,
    transparent 39%, transparent 40%,
    var(--color-3) 40%, var(--color-3) 59%,
    transparent 59%, transparent 60%,
    var(--color-4) 60%, var(--color-4) 79%,
    transparent 79%, transparent 80%,
    var(--color-5) 80%) !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  color: transparent !important;
  -webkit-text-fill-color: transparent !important;
  /* 整行多色条纹保持连续,按 --reveal 裁切(CJK 等宽 => 恰好逐字步进露出) */
  clip-path: inset(0 calc((1 - var(--reveal, 1)) * 100%) 0 0);
}
/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字裁切 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }`,
  html: `<h1 class="multicolor-text">{{LINE}}</h1>`
});
