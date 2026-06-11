BL.register({
  id:'064',
  name:'064 80s Fonts Text Effect 4: Cyberspace Text',
  kind:'visual',
  group:'Visual 数据集特效',
  order:64,
  src:'80s Fonts Text Effect 4: Cyberspace Text · CodePen',
  css:`.bl-wrap {
  background: radial-gradient(#050526 0%, #000000 90%) center center no-repeat black;
  perspective: 340px;
}

.centered {
  transform: rotateX(15deg);
  text-align: center;
}

.cyberspace {
  position: relative;
  font-family: sans-serif;
  font-size: 4rem;
  color: black;
  -webkit-background-clip: text;
  -webkit-text-fill-color: #87d1e4;
  -webkit-text-stroke-width: 0.1rem;
  -webkit-text-stroke-color: #87d1e4;
  filter: url(#extrude);
}

/* 取消引擎遮罩,改用逐字露出 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }

/* 恢复颜色:实色填充 + 描边 (#87d1e4) */
:host .bl-wrap .cyberspace {
  color: black !important;
  -webkit-text-fill-color: #87d1e4 !important;
  -webkit-text-stroke-color: #87d1e4 !important;
}

/* 逐字露出 (clip-path 按 --reveal) */
:host .bl-wrap .cyberspace {
  clip-path: inset(0 calc((1 - var(--reveal, 1)) * 100%) 0 0);
}`,
  html:`<div class="centered">
  <span class="cyberspace" data-text="{{LINE}}">{{LINE}}</span>
</div>
<svg width="0" height="0" aria-hidden="true">
  <defs>
    <filter id="extrude">
      <feMorphology operator="erode" radius="0" in="SourceGraphic" result="erode" />
      <feMorphology operator="erode" radius="2" in="SourceGraphic" result="erode1" />
      <feMorphology operator="erode" radius="3" in="SourceGraphic" result="erode2" />
      <feMorphology operator="erode" radius="4" in="SourceGraphic" result="erode3" />
      <feMorphology operator="erode" radius="6" in="SourceGraphic" result="erode4" />
      <feComposite in="erode" in2="erode1" operator="out" result="main"/>
      <feComposite in="erode1" in2="erode2" operator="out" result="stroke1"/>
      <feComposite in="erode2" in2="erode3" operator="out" result="stroke2"/>
      <feComposite in="erode3" in2="erode4" operator="out" result="stroke3"/>
      <feGaussianBlur in="stroke1" stdDeviation="0 10" result="stroke1-blur" />
      <feBlend in="stroke1-blur" mode="screen" result="stroke1-blur-blend"></feBlend>
      <feGaussianBlur in="stroke2" stdDeviation="0 10" />
      <feOffset dx="0" dy="10" result="stroke2-blur"/>
      <feBlend in="stroke2-blur" mode="screen" result="stroke2-blur-blend"></feBlend>
      <feGaussianBlur in="stroke3" stdDeviation="0 25" />
      <feOffset dx="0" dy="20" result="stroke3-blur"/>
      <feBlend in="stroke3-blur" mode="screen" result="stroke3-blur-blend"></feBlend>
      <feFlood result="floodFill" flood-color="rgba(0,0,0,0.7)" flood-opacity="1"/>
      <feComposite in="floodFill" in2="erode2" operator="in" result="black"/>
      <feBlend in="black" mode="screen" result="letterInside"></feBlend>
      <feMerge>
        <feMergeNode in="stroke1-blur-blend"></feMergeNode>
        <feMergeNode in="stroke2-blur-blend"></feMergeNode>
        <feMergeNode in="stroke3-blur-blend"></feMergeNode>
        <feMergeNode in="main"></feMergeNode>
        <feMergeNode in="letterInside"></feMergeNode>
      </feMerge>
    </filter>
  </defs>
</svg>`
});
