BL.register({
  id: '024',
  name: '024 EAT SLEEP RAVE - 3D ROTATE',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 24,
  src: 'EAT SLEEP RAVE - 3D ROTATE · CodePen',
  css: `
@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@800;900&display=swap");

.bl-wrap {
  background-color: #222;
  overflow: hidden;
}
.container {
  display: flex;
  justify-content: center;
  align-items: center;
}
.box {
  transform-style: preserve-3d;
  animation: animate3d 7s ease-in-out infinite alternate;
}
.box span {
  background: linear-gradient(90deg, rgba(0,0,0,.1), rgba(0,0,0,.5) 90%, transparent);
  text-transform: uppercase;
  line-height: 0.76em;
  position: absolute;
  color: #fff;
  font-size: clamp(1.5rem, 3.5vw, 3.5em);
  white-space: nowrap;
  font-weight: bold;
  font-family: "Poppins", sans-serif;
  padding: 0px 10px;
  transform-style: preserve-3d;
  text-shadow: 0 10px 15px rgba(0,0,0,.3);
  transform: translate(-50%, -50%) rotateX(calc(var(--i) * 22.5deg)) translateZ(220px);
}
@keyframes animate3d {
  0%   { transform: perspective(500px) rotateX(0deg) rotate(5deg); }
  100% { transform: perspective(50px) rotateX(360deg) rotate(5deg); }
}
/* 修复黑屏:引擎将 .bl-wrap 设为 width:max-content,而所有 .box span 均为 position:absolute,
   宽度坍缩为 0,基于 0 宽的引擎遮罩把内容全部遮没。去掉引擎遮罩并给容器明确尺寸;
   .box 设为定位上下文,使绝对定位的 span 以 .box 中心(被 flex 居中)为锚点形成 3D 文字环。 */
:host .bl-wrap {
  width: 90vw !important; max-width: 90vw !important; height: 100% !important;
  display: flex; align-items: center; justify-content: center;
  -webkit-mask-image: none !important; mask-image: none !important;
}
/* 仅上下翻转(scaleY(-1)):背面环的 span 因 rotateX 越过 90° 呈上下颠倒(左右不反),
   翻正后背面/环内一侧正向可读(代价:正面变上下颠倒,符合"正面反、背面正"取向)。 */
.container { width: 100%; height: 100%; transform: scaleY(-1); }
.box { position: relative; }
`,
  html: `<div class="container">
  <div class="box">
    <span style="--i: 1">{{LINE}}</span>
    <span style="--i: 2">{{LINE}}</span>
    <span style="--i: 3">{{LINE}}</span>
    <span style="--i: 4">{{LINE}}</span>
    <span style="--i: 5">{{LINE}}</span>
    <span style="--i: 6">{{LINE}}</span>
    <span style="--i: 7">{{LINE}}</span>
    <span style="--i: 8">{{LINE}}</span>
    <span style="--i: 9">{{LINE}}</span>
    <span style="--i: 10">{{LINE}}</span>
    <span style="--i: 11">{{LINE}}</span>
    <span style="--i: 12">{{LINE}}</span>
    <span style="--i: 13">{{LINE}}</span>
    <span style="--i: 14">{{LINE}}</span>
    <span style="--i: 15">{{LINE}}</span>
    <span style="--i: 16">{{LINE}}</span>
  </div>
</div>`
});
