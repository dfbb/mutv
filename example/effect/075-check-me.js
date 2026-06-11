BL.register({
  id: '075',
  name: '075 Check Me Out Glow Text',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 75,
  src: 'Check Me Out Glow Text · CodePen',
  css: `
@import url(https://fonts.googleapis.com/css?family=Abril+Fatface&display=swap);

@keyframes bounce243 {
  0%, 20%, 50%, 80%, to {
    transform: translateZ(-2px) translateY(5px);
  }
  40% {
    transform: rotateY(180deg) translateZ(-2px) translateY(-35px);
  }
  60% {
    transform: translateZ(-2px) translateY(-25px);
  }
}

.bl-wrap {
  background: radial-gradient(circle at center, #1a1546, #040411 40%);
  perspective: 1000px;
}

.glow-text {
  font-size: 3.5rem;
  line-height: 1.2;
  transform: rotateX(0) rotateY(-25deg);
  text-transform: uppercase;
  text-align: center;
  color: #fff;
  font-family: "Abril Fatface";
  margin: 3rem auto;
  position: relative;
  padding: 2rem 0;
  text-shadow: 0 0 5px #fff, 0 0 10px #fff, 0 0 15px #fff, 0 0 20px #228dff, 0 0 35px #228dff, 0 0 40px #228dff;
}

/* 取消引擎遮罩,改用逐字露出 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }

/* 恢复白色字 + 蓝色辉光 */
:host .bl-wrap .glow-text,
:host .bl-wrap .glow-text .bl-char {
  color: #fff !important;
  -webkit-text-fill-color: #fff !important;
}

/* 逐字露出 */
.bl-char { display: inline-block; opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1); }
`,
  letterTpl: `<span class="bl-char" style="--i:{i};--n:{n}">{ch}</span>`,
  html: `<div class="glow-text">{{LETTERS}}</div>`
});
