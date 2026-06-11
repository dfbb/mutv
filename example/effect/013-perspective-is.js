BL.register({
  id: '013',
  name: '013 Perspective is a matter of perception',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 13,
  src: 'Perspective is a matter of perception · CodePen',
  css: `
.bl-wrap {
  font-size: 3vw;
}
.wrap {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 0 1rem;
  width: 100%;
  margin: 0 auto;
  perspective: 12vmin;
}
.left,
.right {
  font-size: max(2rem, 6cqi);
  font-weight: 900;
  line-height: 4;
  color: #fcf75e;
  text-transform: uppercase;
  transform-style: preserve-3d;
  animation: rotate 5s ease-in-out backwards 1s;
  font-family: system-ui, sans-serif;
}
@keyframes rotate {
  from {
    perspective: 0vmin;
    transform: rotateY(0deg);
  }
}
.left {
  transform-origin: right;
  transform: rotateY(-10deg) scale(2);
}
.right {
  transform-origin: left;
  transform: rotateY(10deg) scale(2);
}
.centre {
  font-size: max(1rem, 6cqi);
  color: #98ff98;
  line-height: 1;
  writing-mode: vertical-lr;
  transform: rotate(-180deg);
  transform-style: preserve-3d;
  animation: scaleAnim 5s ease-in-out forwards 1s;
  font-family: system-ui, sans-serif;
}
@keyframes scaleAnim {
  to {
    transform: rotate(-180deg) rotateX(-20deg) translateY(30%);
  }
}

/* 与歌词同步的逐字露出：关掉引擎按整体宽度的遮罩（双份宽度会让露出变慢/错位），
   改为给左右两份各自按 --reveal 在自身宽度内并行露出，与 lrc 时间轴同步 */
.bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }
.left, .right {
  -webkit-mask-image: linear-gradient(90deg, #000 calc(var(--reveal, 1) * 100% - 0.4ch), transparent calc(var(--reveal, 1) * 100% + 0.1ch));
          mask-image: linear-gradient(90deg, #000 calc(var(--reveal, 1) * 100% - 0.4ch), transparent calc(var(--reveal, 1) * 100% + 0.1ch));
}
`,
  html: `<div class="wrap">
  <span class="left">{{LINE}}</span>
  <span class="centre">*</span>
  <span class="right">{{LINE}}</span>
</div>`
});
