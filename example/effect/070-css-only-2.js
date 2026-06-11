BL.register({
  id:'070',
  name:'070 CSS only 3D paper fold text effect',
  kind:'visual',
  group:'Visual 数据集特效',
  order:70,
  src:'CSS only 3D paper fold text effect · CodePen',
  css:`@import url('https://fonts.googleapis.com/css?family=Source+Code+Pro:700,900');

.bl-wrap {
  background: linear-gradient(45deg, lch(90 2.22 62.5) 80%, lch(78 2.15 94.43) 100%);
}

h1 {
  font-family: "Source Code Pro", monospace;
  font-weight: 900;
  font-size: calc(20vw + 0.5rem);
  white-space: nowrap;
  color: lch(76 39.21 9.23/0.5);
  text-transform: uppercase;
  transform: skew(10deg) rotate(-10deg);
  text-shadow: 1px 4px 6px lch(90 2.22 62.5), 0 0 0 lch(28 26.21 12.27), 1px 4px 6px lch(90 2.22 62.5);
}
h1::before {
  content: attr(data-heading);
  position: absolute;
  left: 0;
  top: -4.8%;
  overflow: hidden;
  height: 50%;
  color: lch(97 2.19 62.49);
  transform: translate(1.6vw, 0) skew(-13deg) scale(1, 1.2);
  text-shadow: 2px -1px 6px rgba(0, 0, 0, 0.2);
}
h1::after {
  content: attr(data-heading);
  position: absolute;
  left: 0;
  color: lch(83 2.26 62.51);
  transform: translate(0, 0) skew(13deg) scale(1, 0.8);
  clip-path: polygon(0 50%, 100% 50%, 100% 100%, 0% 100%);
  text-shadow: 2px -1px 6px lch(0 0 0/0.3);
}

/* 取消引擎遮罩,改用逐字露出 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }

/* 恢复 h1 主体颜色(::before/::after 颜色不受 override 影响,保持原样) */
:host .bl-wrap h1 {
  color: lch(76 39.21 9.23/0.5) !important;
  -webkit-text-fill-color: lch(76 39.21 9.23/0.5) !important;
}

/* 逐字露出:在 h1(含其 ::before/::after)上做 clip-path */
:host .bl-wrap h1 { clip-path: inset(0 calc((1 - var(--reveal, 1)) * 100%) 0 0); }`,
  html:`<h1 data-heading="{{LINE}}">{{LINE}}</h1>`
});
