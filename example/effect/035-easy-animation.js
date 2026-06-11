BL.register({
  id: '035',
  name: '035 Easy Animation',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 35,
  src: 'Easy Animation · CodePen',
  css: `@import url("https://fonts.googleapis.com/css2?family=Righteous&display=swap");
.bl-wrap {
  position: relative;
}

.hello {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 25vw;
  -webkit-animation-name: wave;
          animation-name: wave;
  -webkit-animation-iteration-count: infinite;
          animation-iteration-count: infinite;
  -webkit-animation-timing-function: ease-in-out;
          animation-timing-function: ease-in-out;
  font-family: "Righteous", cursive;
  -webkit-text-stroke-width: 3px;
  -webkit-text-stroke-color: black;
}

.hello:nth-of-type(1) {
  color: #7c4dff;
  -webkit-animation-duration: 2s;
          animation-duration: 2s;
  -webkit-animation-delay: 0.55s;
          animation-delay: 0.55s;
}

.hello:nth-of-type(2) {
  color: #0091ea;
  -webkit-animation-duration: 2s;
          animation-duration: 2s;
  -webkit-animation-delay: 0.3s;
          animation-delay: 0.3s;
}

.hello:nth-of-type(3) {
  color: #ff9100;
  -webkit-animation-duration: 2s;
          animation-duration: 2s;
  -webkit-animation-delay: 0.05s;
          animation-delay: 0.05s;
}

.hello:nth-of-type(4) {
  color: #ff1744;
  -webkit-animation-duration: 2s;
          animation-duration: 2s;
  -webkit-animation-delay: -0.2s;
          animation-delay: -0.2s;
}

@-webkit-keyframes wave {
  40%, 50% {
    transform: translate(-50%, -65%) scale(1.05);
  }
  0%, 90%, 100% {
    transform: translate(-50%, -45%) scale(0.95);
  }
}

@keyframes wave {
  40%, 50% {
    transform: translate(-50%, -65%) scale(1.05);
  }
  0%, 90%, 100% {
    transform: translate(-50%, -45%) scale(0.95);
  }
}
/* 修复黑屏:4 层 .hello 全为 position:absolute,引擎 .bl-wrap{width:max-content}
   坍缩为 0,按宽度的 reveal 遮罩宽 0 全遮 → 黑屏。给容器明确宽高并去遮罩。 */
:host .bl-wrap {
  width: 90vw !important;
  max-width: 90vw !important;
  height: 100% !important;
  -webkit-mask-image: none !important;
          mask-image: none !important;
}
/* 还原四色叠字:颜色直接设到字符 .hl 上(否则 .hl 被主题 fill/color:green 直接命中,
   从父级继承的颜色无效),并让填充跟随该 color */
:host .hello:nth-of-type(1) .hl { color: #7c4dff !important; }
:host .hello:nth-of-type(2) .hl { color: #0091ea !important; }
:host .hello:nth-of-type(3) .hl { color: #ff9100 !important; }
:host .hello:nth-of-type(4) .hl { color: #ff1744 !important; }
:host .hello .hl { -webkit-text-fill-color: currentColor !important; }
/* 还原大字号(主题压成小字致 3px 黑描边糊成黑块);按需缩小一半 */
:host .hello { font-size: clamp(24px, 7vw, 90px) !important; }
:host .hello .hl { font-size: inherit !important; }
/* 按歌词时间逐字符出现;4 层同一 --i/--n 同步揭示 */
.hl {
  display: inline-block;
  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);
}`,
  html: `<div class="hello">{{LETTERS}}</div>
<div class="hello">{{LETTERS}}</div>
<div class="hello">{{LETTERS}}</div>
<div class="hello">{{LETTERS}}</div>`,
  letterTpl: `<span class="hl" style="--i:{i}; --n:{n}">{ch}</span>`
});
