BL.register({
  id: '060',
  name: '060 DECONSTRUCTED',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 60,
  src: 'DECONSTRUCTED · CodePen',
  css: `
@import url('https://fonts.googleapis.com/css2?family=Cambay:wght@700&display=swap');

.bl-wrap {
  background-color: black;
  overflow: hidden;
}

.deconstructed {
  position: relative;
  margin: auto;
  height: 1.05em;
  color: transparent;
  font-family: 'Cambay', sans-serif;
  font-size: 10vw;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.05em;
}

.deconstructed > div {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  color: #ffff64;
  pointer-events: none;
}

.deconstructed > div:nth-child(1) {
  -webkit-mask-image: linear-gradient(black 25%, transparent 25%);
  mask-image: linear-gradient(black 25%, transparent 25%);
  animation: deconstructed1 5s infinite;
}

.deconstructed > div:nth-child(2) {
  -webkit-mask-image: linear-gradient(transparent 25%, black 25%, black 50%, transparent 50%);
  mask-image: linear-gradient(transparent 25%, black 25%, black 50%, transparent 50%);
  animation: deconstructed2 5s infinite;
}

.deconstructed > div:nth-child(3) {
  -webkit-mask-image: linear-gradient(transparent 50%, black 50%, black 75%, transparent 75%);
  mask-image: linear-gradient(transparent 50%, black 50%, black 75%, transparent 75%);
  animation: deconstructed3 5s infinite;
}

.deconstructed > div:nth-child(4) {
  -webkit-mask-image: linear-gradient(transparent 75%, black 75%);
  mask-image: linear-gradient(transparent 75%, black 75%);
  animation: deconstructed4 5s infinite;
}

@keyframes deconstructed1 {
  0% { transform: translateX(100%); }
  26% { transform: translateX(0%); }
  83% { transform: translateX(-0.1%); }
  100% { transform: translateX(-120%); }
}

@keyframes deconstructed2 {
  0% { transform: translateX(100%); }
  24% { transform: translateX(0.5%); }
  82% { transform: translateX(-0.2%); }
  100% { transform: translateX(-125%); }
}

@keyframes deconstructed3 {
  0% { transform: translateX(100%); }
  22% { transform: translateX(0%); }
  81% { transform: translateX(0%); }
  100% { transform: translateX(-130%); }
}

@keyframes deconstructed4 {
  0% { transform: translateX(100%); }
  20% { transform: translateX(0%); }
  80% { transform: translateX(0%); }
  100% { transform: translateX(-135%); }
}

/* 取消引擎遮罩,改用逐字露出 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }

/* 恢复颜色: 四层切片文字本应为黄色 #ffff64 */
:host .bl-wrap .deconstructed > div {
  color: #ffff64 !important;
  -webkit-text-fill-color: #ffff64 !important;
}
`,
  html: `<div class="deconstructed">
  {{LINE}}
  <div>{{LINE}}</div>
  <div>{{LINE}}</div>
  <div>{{LINE}}</div>
  <div>{{LINE}}</div>
</div>`
});
