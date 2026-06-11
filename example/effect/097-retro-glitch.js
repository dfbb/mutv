BL.register({
  id: '097',
  name: '097 Retro Glitch Effect Colors RGB',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 97,
  src: 'Retro Glitch Effect Colors RGB (Daily Design + Code #6) · CodePen',
  css: `
:host {
  --red: #FF0000;
  --green: #00FF00;
  --blue: #0000FF;
}

.bl-wrap {
  background-color: #000000;
  font-family: 'Inter', sans-serif;
  overflow: hidden;
}

.rgb-glitch {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.rgb-layer {
  position: absolute;
  font-size: 6vmin;
  font-weight: 700;
  text-transform: uppercase;
  mix-blend-mode: screen;
  white-space: nowrap;
}

.rgb-layer.layer-r {
  color: var(--red);
  transform: translate(4px, 4px);
  animation: rgb-set1 1s infinite;
}

.rgb-layer.layer-g {
  color: var(--green);
  transform: translate(0, 0);
  animation: rgb-set2 1s infinite;
}

.rgb-layer.layer-b {
  color: var(--blue);
  transform: translate(-4px, -4px);
  animation: rgb-set3 1s infinite;
}

.rgb-spacer {
  font-size: 6vmin;
  font-weight: 700;
  text-transform: uppercase;
  visibility: hidden;
  white-space: nowrap;
}

@keyframes rgb-set1 {
  0%   { transform: translate(4px, 4px); }
  15%  { transform: translate(5px, 6px); }
  30%  { transform: translate(4px, 4px); }
  45%  { transform: translate(5px, 6px); }
  60%  { transform: translate(4px, 4px); }
  75%  { transform: translate(6px, -2px); }
  100% { transform: translate(4px, 4px); }
}

@keyframes rgb-set2 {
  0%   { transform: translate(0px, 0px); }
  15%  { transform: translate(-1px, -2px); }
  30%  { transform: translate(0px, 0px); }
  45%  { transform: translate(-1px, -2px); }
  60%  { transform: translate(0px, 0px); }
  75%  { transform: translate(-1px, 1px); }
  100% { transform: translate(0px, 0px); }
}

@keyframes rgb-set3 {
  0%   { transform: translate(-4px, -4px); }
  15%  { transform: translate(-6px, -6px); }
  30%  { transform: translate(-4px, -4px); }
  45%  { transform: translate(0px, 0px); }
  60%  { transform: translate(-4px, -4px); }
  75%  { transform: translate(-3px, -5px); }
  100% { transform: translate(-4px, -4px); }
}

/* 取消引擎遮罩,改用逐字露出 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }

/* 恢复 RGB 三层原色 */
:host .bl-wrap .rgb-layer.layer-r { color: var(--red) !important; -webkit-text-fill-color: var(--red) !important; }
:host .bl-wrap .rgb-layer.layer-g { color: var(--green) !important; -webkit-text-fill-color: var(--green) !important; }
:host .bl-wrap .rgb-layer.layer-b { color: var(--blue) !important; -webkit-text-fill-color: var(--blue) !important; }

/* 逐字露出:对每个文字层做 clip-path */
:host .bl-wrap .rgb-layer { clip-path: inset(0 calc((1 - var(--reveal, 1)) * 100%) 0 0); }
`,
  html: `<div class="rgb-glitch">
  <span class="rgb-layer layer-r">{{LINE}}</span>
  <span class="rgb-layer layer-g">{{LINE}}</span>
  <span class="rgb-layer layer-b">{{LINE}}</span>
  <span class="rgb-spacer">{{LINE}}</span>
</div>`
});
