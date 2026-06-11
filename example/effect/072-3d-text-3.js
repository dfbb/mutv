BL.register({
  id:'072',
  name:'072 3D Text Lighting & Shadows',
  kind:'visual',
  group:'Visual 数据集特效',
  order:72,
  src:'3D Text Lighting & Shadows · CodePen',
  css:`.bl-wrap {
  background: linear-gradient(135deg, rgba(206,188,155,1) 0%, rgba(85,63,50,1) 51%, rgba(42,31,25,1) 100%);
  overflow: hidden;
}

h1 {
  width: 100%;
  margin: 0 auto;
  font-family: 'Lato', sans-serif;
  line-height: 280px;
  font-size: 11.5rem;
  padding: 80px 50px;
  text-align: center;
  text-transform: uppercase;
  text-rendering: optimizeLegibility;
}

h1::before {
  content: "";
  width: 100%;
  height: 750px;
  position: absolute;
  top: -200px;
  left: 10px;
  transform: rotate(55deg);
  background: linear-gradient(to right, rgba(206,188,155,.7) 0%, rgba(42,31,25,0) 65%);
}

#text3d {
  color: #70869d;
  letter-spacing: .15em;
  text-shadow:
    -1px -1px 1px #efede3,
    0px 1px 0 #2e2e2e,
    0px 2px 0 #2c2c2c,
    0px 3px 0 #2a2a2a,
    0px 4px 0 #282828,
    0px 5px 0 #262626,
    0px 6px 0 #242424,
    0px 7px 0 #222,
    0px 8px 0 #202020,
    0px 9px 0 #1e1e1e,
    0px 10px 0 #1c1c1c,
    0px 11px 0 #1a1a1a,
    0px 12px 0 #181818,
    0px 13px 0 #161616,
    0px 14px 0 #141414,
    0px 15px 0 #121212,
    2px 20px 5px rgba(0, 0, 0, 0.9),
    5px 23px 5px rgba(0, 0, 0, 0.3),
    8px 27px 8px rgba(0, 0, 0, 0.5),
    8px 28px 35px rgba(0, 0, 0, 0.9);
}

/* 取消引擎遮罩,改用逐字露出 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }

/* 去掉背景:h1::before 的斜向浅色光带(伪元素未被主题覆盖才残留);.bl-wrap 渐变已被主题压掉 */
:host .bl-wrap h1::before { display: none !important; }

/* 恢复颜色 #70869d (高优先级压过引擎绿色覆盖) */
:host .bl-wrap #text3d,
:host .bl-wrap #text3d .bl-char {
  color: #70869d !important;
  -webkit-text-fill-color: #70869d !important;
}

/* 逐字露出 */
.bl-char { display: inline-block; opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1); }`,
  html:`<h1 id="text3d">{{LETTERS}}</h1>`,
  letterTpl:`<span class="bl-char" style="--i:{i};--n:{n}">{ch}</span>`
});
