BL.register({
  id: '096',
  name: '096 CSS Dashed Shadow',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 96,
  src: 'CSS Dashed Shadow · CodePen',
  css: `
@import url("https://fonts.googleapis.com/css?family=Open+Sans+Condensed:700");

.bl-wrap {
  font-family: 'Open Sans Condensed', sans-serif;
  font-size: 5vmin;
  background-color: #e8e3c7;
  text-align: center;
  line-height: 1.4;
}

.dashed-shadow {
  position: relative;
  top: 8px;
  left: 8px;
  display: inline-block;
  color: #ba9186;
}

@keyframes dash-animation {
  0% { background-position: 0 0; }
  100% { background-position: 100% 0; }
}

.dashed-shadow:before {
  content: " ";
  display: block;
  position: absolute;
  top: -8px;
  left: -8px;
  bottom: -2px;
  right: -2px;
  z-index: 1;
  background-image: linear-gradient(45deg, #e8e3c7 12.5%, rgba(232, 227, 199, 0) 12.5%, rgba(232, 227, 199, 0) 37.5%, #e8e3c7 37.5%, #e8e3c7 62.5%, rgba(232, 227, 199, 0) 62.5%, rgba(232, 227, 199, 0) 87.5%, #e8e3c7 87.5%);
  background-size: 6px 6px;
}

.dashed-shadow:hover:before {
  animation: dash-animation 30s infinite linear;
}

.dashed-shadow:after {
  z-index: 2;
  content: attr(data-text);
  position: absolute;
  left: -8px;
  top: -8px;
  color: #b85b3f;
  text-shadow: 3px 3px #e8e3c7;
}

/* 取消引擎遮罩,改用逐字露出 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }

/* 恢复颜色 */
:host .bl-wrap .dashed-shadow { color: #ba9186 !important; -webkit-text-fill-color: #ba9186 !important; }

/* 逐字露出 (PATTERN B clip-path) */
:host .bl-wrap .dashed-shadow { clip-path: inset(0 calc((1 - var(--reveal, 1)) * 100%) 0 0); }
`,
  html: `<div class="dashed-shadow" data-text="{{LINE}}">{{LINE}}</div>`
});
