BL.register({
  id: '012',
  name: '012 CSS only marquee with slow on hover',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 12,
  src: 'CSS only marquee with slow on hover · CodePen',
  css: `
@import url("https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap");

/* 方案 B：只显示一行、绕中心倾斜（去掉 6 遍重复滚动），整行对称落在屏幕正中 */
:host { overflow: visible !important; }
/* 跑马灯本是滚动效果，关掉引擎注入的逐字遮罩，避免 mask-clip 把倾斜溢出裁掉 */
.bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }

.marquee {
  transform: rotate(-5deg);
  transform-origin: center center;
  font-family: "Bebas Neue", sans-serif;
}
.marquee p {
  margin: 0;
  font-weight: bold;
  line-height: 1.1;
  text-transform: uppercase;
}
`,
  html: `<div class="marquee"><p>{{LINE}}</p></div>`
});
