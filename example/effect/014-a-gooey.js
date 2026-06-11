BL.register({
  id: '014',
  name: '014 A Gooey Marquee',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 14,
  src: 'A Gooey Marquee · CodePen',
  css: `
@import url("https://fonts.googleapis.com/css?family=Raleway:400,400i,700");

.bl-wrap {
  font-family: Raleway, sans-serif;
  background-color: #000;
  color: #fff;
  font-size: 24px;
}
.marquee {
  position: relative;
  width: 100%;
  height: 2em;
  font-size: 5em;
  font-weight: 900;
  display: grid;
  place-items: center;
  overflow: hidden;
}
.marquee_text {
  position: absolute;
  min-width: 100%;
  white-space: nowrap;
  animation: marquee 16s infinite linear;
}
@keyframes marquee {
  from { translate: 70%; }
  to   { translate: -70%; }
}
.marquee_blur {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background-color: black;
  background-image: linear-gradient(to right, white, 1rem, transparent 50%), linear-gradient(to left, white, 1rem, transparent 50%);
  filter: contrast(28);
}
.marquee_blur p {
  filter: blur(0.10em);
}
.marquee_clear {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
}

/* === 修复黑屏 ===
   引擎把 .bl-wrap 设为 width:max-content，但本特效内容全是 position:absolute，
   max-content 宽度坍缩为 0 + overflow:hidden 把文字全裁掉 → 整屏黑。
   这里给容器明确宽度；跑马灯是连续滚动，关掉引擎的逐字露出遮罩；
   并恢复被引擎 background:transparent 清空、黏稠(contrast)所必需的实底色与边缘渐变。 */
/* === 修复黑屏 ===
   引擎把 .bl-wrap 设为 width:max-content，但本特效内容全是 position:absolute，
   max-content 宽度坍缩为 0 + overflow:hidden 把文字全裁掉 → 整屏黑。
   引擎的 VISUAL_OVERRIDE 拼在模块 css 之后，需用更高特异度(:host .bl-wrap)压过它。
   跑马灯是连续滚动，关掉逐字露出遮罩；并恢复黏稠(contrast)所必需的实底色与边缘渐变。 */
:host .bl-wrap {
  width: 90vw !important;
  max-width: 90vw !important;
  -webkit-mask-image: none !important;
          mask-image: none !important;
}
.marquee { width: 100%; }
:host .marquee_blur {
  background-color: #000 !important;
  background-image: none !important;
}
/* 歌词很短、每行仅显示数秒，原 ±70% 行程会让文字整段滚出屏外（看似黑屏）。
   让文字居中并收窄跑马灯行程，使短歌词始终可见，同时保留黏稠漂移。 */
:host .marquee_text { text-align: center; }
@keyframes marquee {
  from { translate: 30%; }
  to   { translate: -30%; }
}
`,
  html: `<div class="marquee">
  <div class="marquee_blur" aria-hidden="true">
    <p class="marquee_text">{{LINE}}</p>
  </div>
  <div class="marquee_clear">
    <p class="marquee_text">{{LINE}}</p>
  </div>
</div>`
});
