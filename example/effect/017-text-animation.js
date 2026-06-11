BL.register({
  id: '017',
  name: '017 Text Animation Inspired By Apple Event',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 17,
  src: 'Text Animation Inspired By Apple Event #apple #iphone #appleevent · CodePen',
  css: `
.bl-wrap {
  background: #000;
  color: #fff;
  font-family: Arial, sans-serif;
  font-weight: bold;
  font-size: 36px;
  overflow: hidden;
}
.apple-text {
  animation: come2life linear 10s infinite;
  transform-origin: center center;
  opacity: 0;
  backface-visibility: hidden;
  text-align: center;
}
@keyframes come2life {
  0% {
    transform: scale3d(0,0,1) rotate(0.02deg);
    opacity: 0;
    filter: blur(10px);
  }
  25% {
    transform: scale3d(1,1,1) rotate(0.02deg);
    opacity: 1;
    filter: blur(0px);
  }
  40% {
    opacity: 1;
    filter: blur(0px);
  }
  80% {
    opacity: 0;
  }
  100% {
    transform: scale3d(4,4,1) rotate(0.02deg);
    filter: blur(10px);
  }
}
/* 去掉引擎按 --reveal 注入的逐字露出遮挡；并放开容器裁切，
   使 come2life 放大(scale 最大 4)过程中字体不被 overflow:hidden 切掉 */
:host { overflow: visible !important; }
:host .bl-wrap {
  overflow: visible !important;
  -webkit-mask-image: none !important;
          mask-image: none !important;
}
`,
  html: `<div class="apple-text">{{LINE}}</div>`
});
