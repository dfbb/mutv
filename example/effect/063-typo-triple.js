BL.register({
  id:'063',
  name:'063 Typo triple',
  kind:'visual',
  group:'Visual 数据集特效',
  order:63,
  src:'Typo triple · CodePen',
  css:`@import url('https://fonts.googleapis.com/css2?family=Raleway:wght@900&display=swap');

.bl-wrap {
  background: yellow;
  font-family: 'Raleway', sans-serif;
}

.typo-triple {
  font-size: 120px;
  letter-spacing: 0.1em;
  -webkit-text-fill-color: transparent;
  -webkit-text-stroke-width: 3px;
  -webkit-text-stroke-color: white;
  text-shadow:
    8px 8px #ff1f8f,
    20px 20px #000000;
}

/* 取消引擎遮罩,改用逐字露出 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }

/* 恢复颜色:透明填充 + 白色描边 + 粉/黑双重阴影 */
:host .bl-wrap .typo-triple,
:host .bl-wrap .typo-triple .bl-char {
  color: transparent !important;
  -webkit-text-fill-color: transparent !important;
  -webkit-text-stroke-width: 3px !important;
  -webkit-text-stroke-color: white !important;
}

/* 逐字露出 */
.bl-char { display: inline-block; opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1); }`,
  letterTpl:`<span class="bl-char" style="--i:{i};--n:{n}">{ch}</span>`,
  html:`<span class="typo-triple">{{LETTERS}}</span>`
});
