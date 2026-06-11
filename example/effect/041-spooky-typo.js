BL.register({
  id: '041',
  name: '041 Spooky Typo',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 41,
  src: 'Spooky Typo · CodePen',
  css: `
:host {
  --color_base: #191919;
  --color_pen: #fff;
  --size: 10vmin;
}
.bl-wrap {
  background-color: var(--color_base);
  overflow: hidden;
}
.halloctober {
  width: 100%;
}
.halloctober__banner {
  padding: 3%;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
}
.typo {
  color: var(--color_pen);
  cursor: default;
  font-family: "Fredoka One", sans-serif;
  font-size: var(--size);
  font-weight: normal;
  letter-spacing: 0.1rem;
  margin: auto;
  outline: none;
  position: relative;
  transform: skew(10deg, 2deg);
  animation: bl-float 2s ease-in-out infinite;
}
.typo::before,
.typo::after {
  color: transparent;
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  z-index: -10;
}
.typo::before {
  animation: bl-move-upper-shadow 2s ease-in-out infinite;
  opacity: 0;
  text-shadow: 6px 0 2px rgba(179, 8, 8, 0.4), 12px 0 2px rgba(26, 35, 126, 0.3);
}
.typo::after {
  animation: bl-move-bottom-shadow 2s ease-in-out infinite;
  text-shadow: 2px 4px 2px rgba(179, 8, 8, 0.4), 4px 8px 2px rgba(26, 35, 126, 0.3);
}
@keyframes bl-move-upper-shadow {
  0%, 90%, 100% { opacity: 0; transform: translateX(-2%); }
  30%            { opacity: 1; transform: translateX(0); }
}
@keyframes bl-move-bottom-shadow {
  0%, 90%, 100% { opacity: 1; transform: translate(0, 0); }
  30%           { opacity: 0; transform: translateY(-3.5%); }
}
@keyframes bl-float {
  50% { transform: scaleY(1.01) skew(-10deg, -2deg); }
}
`,
  html: `<div class="halloctober"><div class="halloctober__banner"><h1 class="typo" data-text="{{LINE}}">{{LINE}}</h1></div></div>`
});
