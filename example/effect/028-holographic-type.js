BL.register({
  id: '028',
  name: '028 Holographic type',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 28,
  src: 'Holographic type · CodePen',
  css: `.bl-wrap {
  font-size: 5em;
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
    Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
  font-weight: 800;
  background: linear-gradient(135deg, #eee, #ccc);
}

section {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 400px;
  height: 310px;
  animation-duration: 2s;
  animation-name: cube-rotate;
  animation-iteration-count: infinite;
  animation-direction: alternate;
  animation-timing-function: ease-in-out;
}

.isolate {
  isolation: isolate;
  position: absolute;
  top: 0;
  height: 100%;
  width: 100%;
}

@keyframes cube-rotate {
  from {
    transform: perspective(600px) rotate3d(0.6, 0.05, 0.2, 0deg);
  }
  to {
    transform: perspective(600px) rotate3d(0.6, 0.05, 0.2, 20deg);
  }
}

@keyframes shimmer {
  from {
    filter: contrast(190%) brightness(500%);
  }
  to {
    filter: contrast(190%) brightness(130%);
  }
}

.noise {
  width: 100%;
  height: 100%;
  padding: 8px;
  background: linear-gradient(24deg, rgba(50, 0, 255, 0.1), CornflowerBlue), url("data:image/svg+xml,%3Csvg viewBox='0 0 400 310' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.55' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  animation-duration: 2s;
  animation-name: shimmer;
  animation-iteration-count: infinite;
  animation-direction: alternate;
}

.overlay {
  position: absolute;
  top: 0;
  width: 100%;
  height: 100%;
  background: antiquewhite;
  mix-blend-mode: multiply;
}

@media all and (-webkit-min-device-pixel-ratio:0) and (min-resolution: .001dpcm) {
  .overlay {
    opacity: 0.6;
  }
}
/* 逐字全息:每字各自把噪点+渐变 clip 进字形(用 :host 盖过 VISUAL_OVERRIDE 的
   background:transparent / fill:green),并按歌词时间逐字符出现。父级 .noise 的
   shimmer 滤镜仍作用于这些 span。 */
:host .nl {
  display: inline-block;
  background: linear-gradient(24deg, rgba(50, 0, 255, 0.1), CornflowerBlue), url("data:image/svg+xml,%3Csvg viewBox='0 0 400 310' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.55' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E") !important;
  background-clip: text !important;
  -webkit-background-clip: text !important;
  color: transparent !important;
  -webkit-text-fill-color: transparent !important;
  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);
}
/* 取消引擎按 --reveal 的遮罩露出(会把字从中间切断),改用上面的逐字符显示 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }`,
  html: `<section>
  <div class="isolate">
    <div class="noise">{{LETTERS}}</div>
    <div class="overlay"></div>
  </div>
</section>`,
  letterTpl: `<span class="nl" style="--i:{i}; --n:{n}">{ch}</span>`
});
