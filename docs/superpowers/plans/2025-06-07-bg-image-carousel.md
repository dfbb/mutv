# 背景图目录轮播（gl-transitions 转场）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 `--bg-image` 支持传目录，目录内多图时用 gl-transitions 的 GLSL 转场做随机背景轮播，循环到歌曲结束，每张图按比例自动 Ken Burns 缩放/平移，永不拉伸。

**Architecture:** render.mjs 检测 `--bg-image` 是目录时扫描图片，复制图片 + vendored 库（regl + gl-transition 的 frag 包装逻辑）到 `public/`，用 `buildCarousel.mjs` 生成一个自包含 HTML（`<canvas>` + regl + 内联 GLSL），经 `<IFrame src>` 加载（与 `--bg-anim` 相同隔离方式）。转场用 regl 编译 gl-transition 风格的 fragment shader 逐帧混合两张图；Ken Burns 通过调整取样 UV 实现。

**Tech Stack:** Node（render.mjs / cli.mjs，ESM）、Remotion 4.x（`IFrame`/`staticFile`）、regl 2.1.1（vendored UMD，WebGL）、gl-transitions GLSL（121 个，已在仓库）、React + TypeScript。

**重要技术约束（实现前必读）：**
- 项目**无 JS 测试框架**（package.json 仅 typescript + @types/react）。前端/Node 验证手段：`npx tsc --noEmit`、`node --check`、以及**渲染抽帧人工核验**。本计划的"测试"步骤即为这些手段，不引入 jest/vitest。
- 所有命令在 `/Users/dfbb/Sites/mtv/mutv/src` 下执行（node_modules、tsconfig、render.mjs 都在 src/）。
- `gl-transition` npm 包依赖 gl-shader 且仅 CommonJS，**不可直接用**。我们只复用其 engine-agnostic 的 fragment 包装逻辑（`makeFrag` + cover/contain 比例数学），由 regl 编译绘制。无构建步骤。
- 自包含 HTML 经 `<IFrame src>` 在 headless chrome 加载，**不能依赖网络 CDN**——regl 和 GLSL 全部本地复制到 public/ 或内联。
- chrome headless 的 WebGL 走 SwiftShader 软件渲染，能跑但需抽帧确认。

---

## 文件结构

- **已就位** `src/lib/regl/regl.min.js`（regl 2.1.1 UMD，86KB，已复制进仓库）
- **已有** `src/lib/gl-transitions/gl-transition-transform.js`（Node 离线脚本：解析 `transitions/*.glsl` → JSON 数组 `[{name, paramsTypes, defaultParams, glsl}]`）
- **已有** `src/lib/gl-transitions/transitions/*.glsl`（121 个）
- **Create** `src/lib/transitionGroups.mjs` — 121 个转场名预分三组 `{soft, cool, hard}`，含按组随机抽取的 helper
- **Create** `src/lib/glTransitionFrag.mjs` — gl-transition 风格的 fragment shader 包装（`makeFrag`/`resizeModes`，engine-agnostic，从 gl-transition 源移植）
- **Create** `src/lib/buildCarousel.mjs` — 生成自包含轮播 HTML 字符串
- **Create** `src/lib/carouselRuntime.js` — 浏览器端运行时（regl 初始化、纹理加载、转场调度、Ken Burns）；buildCarousel 把它内联进 HTML
- **Create** `src/lib/kenBurns.mjs` — 由图片 AR 与屏幕 AR 算 Ken Burns 配置（6 条规则 / 统一 R 阈值）；Node 与浏览器共用纯函数
- **Modify** `src/types.ts` — 新增 `backgroundCarousel: string`
- **Modify** `src/preset/BackgroundLayer.tsx` — 新增 carousel 分支（IFrame src）
- **Modify** `src/render.mjs` — bg-image 块支持目录：扫描/复制/生成 carousel
- **Modify** `src/cli.mjs` — 转发 `--bg-image-intvl` / `--bg-image-trans`，更新 help
- **Modify** `USAGE.md` — 文档

---

<!-- TASKS -->

## Task 1: kenBurns 规则模块（R 分档 → 缩放/平移配置）

纯函数模块，Node 和浏览器都能 import（写成 ESM，浏览器端由 buildCarousel 内联其源码字符串，所以本模块**不得有 import/依赖**，只导出纯函数）。

**Files:**
- Create: `src/lib/kenBurns.mjs`

- [ ] **Step 1: 写模块**

Create `src/lib/kenBurns.mjs`:
```js
/**
 * Ken Burns 配置：根据 图片宽高比(imgAR) 与 屏幕宽高比(screenAR) 决定
 * 缩放/平移方式。R = imgAR / screenAR，把"图片相对屏幕的宽窄"与屏幕比例解耦，
 * 横竖屏共用同一套阈值。所有缩放等比，平移只移动取样窗口，绝不拉伸。
 *
 * 返回 {bucket, mode, zoomFrom, zoomTo, panAxis, panAmount}
 *  - bucket: 1..5 对应设计 6 条规则的 5 档
 *  - mode: 'cover' | 'blur-contain'（仅 ⑤）
 *  - zoomFrom/zoomTo: 等比缩放系数（>=1，1 表示恰好 cover）
 *  - panAxis: 'none' | 'x' | 'y'（cover 后有富余的轴）
 *  - panAmount: 取样窗口在 panAxis 上可平移的归一化幅度 [0,1)
 */
export function kenBurnsConfig(imgAR, screenAR) {
  const R = imgAR / screenAR;
  if (R < 0.55) {
    // ⑤ 极窄：背景模糊 cover + 前景 contain
    return {bucket: 5, mode: 'blur-contain', zoomFrom: 1.0, zoomTo: 1.04, panAxis: 'none', panAmount: 0};
  }
  if (R < 0.8) {
    // ③ 明显窄：cover + 轻微放大 + 上下平移
    return {bucket: 3, mode: 'cover', zoomFrom: 1.05, zoomTo: 1.05, panAxis: 'y', panAmount: 0.18};
  }
  if (R <= 1.25) {
    // ① 接近：cover 居中 + 轻微放大
    return {bucket: 1, mode: 'cover', zoomFrom: 1.0, zoomTo: 1.08, panAxis: 'none', panAmount: 0};
  }
  if (R <= 1.8) {
    // ② 明显宽：cover + 轻微放大 + 左右平移
    return {bucket: 2, mode: 'cover', zoomFrom: 1.05, zoomTo: 1.05, panAxis: 'x', panAmount: 0.18};
  }
  // ④ 极宽：cover + 小幅缩放 + 横向慢移（幅度大）
  return {bucket: 4, mode: 'cover', zoomFrom: 1.0, zoomTo: 1.03, panAxis: 'x', panAmount: 0.4};
}
```

- [ ] **Step 2: 写验证脚本并运行（确认 6 档边界 + 横竖屏直觉）**

Run（内联断言，无需测试框架）:
```bash
cd /Users/dfbb/Sites/mtv/mutv/src && node --input-type=module -e "
import {kenBurnsConfig} from './lib/kenBurns.mjs';
const L=1080/720, P=720/1080; // 横屏 / 竖屏 AR
function ar(w,h){return w/h;}
const cases=[
  ['横屏 16:9 接近', ar(16,9), L, 1],
  ['横屏 9:16 极窄', ar(9,16), L, 5],
  ['横屏 1:1 明显窄', ar(1,1), L, 3],
  ['横屏 2:1 明显宽', ar(2,1), L, 2],
  ['横屏 3:1 极宽', ar(3,1), L, 4],
  ['竖屏 9:16 接近', ar(9,16), P, 1],
  ['竖屏 16:9 极宽', ar(16,9), P, 4],
  ['竖屏 1:1 明显宽', ar(1,1), P, 2],
];
let ok=true;
for(const [name,iar,sar,want] of cases){
  const got=kenBurnsConfig(iar,sar).bucket;
  const pass=got===want; ok=ok&&pass;
  console.log((pass?'PASS':'FAIL'), name, '-> bucket', got, '(want',want+')');
}
// 不变量：cover 模式 zoom>=1，⑤ 为 blur-contain
const ex=kenBurnsConfig(ar(9,16),L);
console.log(ex.mode==='blur-contain'?'PASS':'FAIL','极窄 mode=blur-contain');
process.exit(ok?0:1);
"
```
Expected: 所有行 `PASS`，退出码 0。

- [ ] **Step 3: Commit**

```bash
cd /Users/dfbb/Sites/mtv/mutv
git add src/lib/kenBurns.mjs
git commit -m "feat(carousel): add Ken Burns config (R-threshold bucketing)"
```

---

## Task 2: transitionGroups 模块（121 个转场分三组）

**Files:**
- Create: `src/lib/transitionGroups.mjs`

- [ ] **Step 1: 列出全部转场名以便分组**

Run（拿到 121 个 name）:
```bash
cd /Users/dfbb/Sites/mtv/mutv/src && node lib/gl-transitions/gl-transition-transform.js -d lib/gl-transitions/transitions 2>/dev/null | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const a=JSON.parse(s);console.log(a.map(x=>x.name).join('\n'))})"
```
Expected: 打印 121 个转场名（每行一个）。记下用于分组。

- [ ] **Step 2: 写分组模块**

Create `src/lib/transitionGroups.mjs`。把转场名按风格分三组（下面是基于 gl-transitions 标准库的合理分类；soft=柔和淡入淡出/滑动/缩放/圆开合，cool=翻页/立方/扭曲波纹/炫彩，hard=故障/像素化/燃烧/马赛克/粗野）。**任何不在三组里的名字默认归入 soft**（由 `groupFor` 的兜底保证，避免遗漏）：
```js
/**
 * 把 gl-transitions 的转场按风格分三组。用于 --bg-image-trans <soft|cool|hard>。
 * 名字须与 transitions/<Name>.glsl 的 name 字段一致（transform.js 输出的 name）。
 */
export const GROUPS = {
  soft: [
    'fade', 'fadecolor', 'fadegrayscale', 'dissolve', 'crossfade',
    'wind', 'wipeLeft', 'wipeRight', 'wipeUp', 'wipeDown',
    'directionalwipe', 'directional', 'SimpleZoom', 'ZoomInCircles',
    'circleopen', 'CircleCrop', 'circle', 'Radial', 'angular',
    'CrossZoom', 'Swirl', 'PolkaDotsCurtain', 'cube',
    'morph', 'colorphase', 'LinearBlur', 'GridFlip', 'Bounce',
    'doorway', 'Mosaic', 'parametrics',
  ],
  cool: [
    'cube', 'BookFlip', 'Doorway', 'swap', 'perspective',
    'PageCurl', 'flyeye', 'ButterflyWaveScrawler', 'polar_function',
    'rotate_scale_fade', 'rotateTransition', 'StereoViewer', 'kaleidoscope',
    'ripple', 'Ripple', 'waterDrop', 'WaterDrop', 'undulatingBurnOut',
    'crosshatch', 'crosswarp', 'cannabisleaf', 'CrazyParametricFun',
    'GlitchMemories', 'multiply_blend', 'windowslice', 'squareswire',
  ],
  hard: [
    'GlitchDisplace', 'glitchFlow', 'static_wipe', 'TVStatic',
    'pixelize', 'PixelizeMosaic', 'AdvancedMosaic', 'BlockDissolve',
    'burn', 'burn0', 'DoomScreenTransition', 'randomsquares',
    'RandomNoisex', 'hexagonalize', 'Hexagonalize', 'chessboard',
    'BowTieHorizontal', 'BowTieVertical', 'InvertedPageCurl',
    'displacement', 'heart', 'luma', 'luminance_melt',
  ],
};

/** 返回某组里在实际可用集合(availableNames)内的转场名数组。 */
export function groupTransitions(group, availableNames) {
  const avail = new Set(availableNames);
  const names = (GROUPS[group] || GROUPS.soft).filter((n) => avail.has(n));
  // 该组若过滤后为空，退回到 availableNames 全集，保证总能转场
  return names.length ? names : availableNames.slice();
}

/** 校验组名合法。 */
export const VALID_GROUPS = ['soft', 'cool', 'hard'];
export function isValidGroup(g) {
  return VALID_GROUPS.includes(g);
}
```

- [ ] **Step 3: 验证分组里的名字真实存在（过滤掉拼错的）**

Run:
```bash
cd /Users/dfbb/Sites/mtv/mutv/src && node --input-type=module -e "
import {GROUPS, groupTransitions, isValidGroup} from './lib/transitionGroups.mjs';
import {execSync} from 'child_process';
const json=execSync('node lib/gl-transitions/gl-transition-transform.js -d lib/gl-transitions/transitions',{encoding:'utf-8'});
const names=JSON.parse(json).map(x=>x.name);
for(const g of ['soft','cool','hard']){
  const real=groupTransitions(g,names);
  console.log(g+':', real.length, '个有效转场');
  if(real.length===0){console.log('FAIL: '+g+' 组为空');process.exit(1);}
}
console.log('isValidGroup soft/cool/hard/xxx:', isValidGroup('soft'),isValidGroup('cool'),isValidGroup('hard'),isValidGroup('xxx'));
console.log('PASS');
"
```
Expected: 三组各打印有效转场数（均 >0），最后 `PASS`。若某组有效数偏少（拼写不匹配），按上一步打印的真实 name 修正 GROUPS 后重跑。

- [ ] **Step 4: Commit**

```bash
cd /Users/dfbb/Sites/mtv/mutv
git add src/lib/transitionGroups.mjs
git commit -m "feat(carousel): classify gl-transitions into soft/cool/hard groups"
```

---

<!-- TASKS2 -->

## Task 3: glTransitionFrag 模块（fragment shader 包装）

把 gl-transition 的 engine-agnostic 包装逻辑（cover/contain 比例数学 + getFromColor/getToColor）移植过来，并扩展支持 Ken Burns（zoom/pan uniform）和 ⑤ 的单 pass 模糊-contain。纯字符串模块，无依赖（便于被 buildCarousel 内联）。

**Files:**
- Create: `src/lib/glTransitionFrag.mjs`

- [ ] **Step 1: 写模块**

Create `src/lib/glTransitionFrag.mjs`:
```js
/**
 * 生成 fragment/vertex shader 源码。移植自 gl-transition 的 makeFrag 思路，
 * 但 getFromColor/getToColor 走自定义 sampleSlide：支持 cover + Ken Burns
 * (zoom/pan)，以及 ⑤ 的单 pass「模糊 cover 背景 + contain 前景」。
 *
 * 不依赖 gl-transition npm 包（其依赖 gl-shader 且仅 CommonJS）。
 */

export const VERT = `attribute vec2 _p;
varying vec2 _uv;
void main(){ gl_Position = vec4(_p,0.0,1.0); _uv = 0.5*(_p+1.0); }`;

// 共享采样逻辑：ratio=画布宽高比；r=图片宽高比；mode: 0=cover(含 Ken Burns), 5=blur-contain
const SAMPLE_CHUNK = `
uniform float ratio;
vec2 coverUV(vec2 uv, float r, float zoom, vec2 pan){
  vec2 c = vec2(min(ratio/r, 1.0), min(r/ratio, 1.0));
  return 0.5 + (uv-0.5)*c/zoom + pan;
}
vec2 containUV(vec2 uv, float r){
  vec2 c = vec2(max(ratio/r, 1.0), max(r/ratio, 1.0));
  return 0.5 + (uv-0.5)*c;
}
bool inBounds(vec2 p){ return p.x>=0.0 && p.x<=1.0 && p.y>=0.0 && p.y<=1.0; }
vec4 blurCover(sampler2D tex, vec2 uv, float r){
  vec4 sum = vec4(0.0);
  float o = 0.012;
  for(int i=-2;i<=2;i++){
    for(int j=-2;j<=2;j++){
      vec2 d = vec2(float(i),float(j))*o;
      sum += texture2D(tex, clamp(coverUV(uv+d, r, 1.0, vec2(0.0)),0.0,1.0));
    }
  }
  return sum/25.0;
}
vec4 sampleSlide(sampler2D tex, vec2 uv, float r, float mode, float zoom, vec2 pan){
  if(mode > 4.5){ // ⑤ blur-contain
    vec2 cuv = containUV(uv, r);
    if(inBounds(cuv)) return texture2D(tex, cuv);
    return blurCover(tex, uv, r) * 0.7; // 背景压暗
  }
  return texture2D(tex, clamp(coverUV(uv, r, zoom, pan),0.0,1.0));
}
uniform sampler2D from, to;
uniform float fromR, toR, fromMode, toMode, fromZoom, toZoom;
uniform vec2 fromPan, toPan;
vec4 getFromColor(vec2 uv){ return sampleSlide(from, uv, fromR, fromMode, fromZoom, fromPan); }
vec4 getToColor(vec2 uv){ return sampleSlide(to, uv, toR, toMode, toZoom, toPan); }
`;

/** 转场 fragment：注入某个 gl-transition 的 glsl（含 transition(uv) 函数）。 */
export function buildFragSource(transitionGlsl) {
  return `precision highp float;
varying vec2 _uv;
uniform float progress;
${SAMPLE_CHUNK}
${transitionGlsl}
void main(){ gl_FragColor = transition(_uv); }`;
}

/** 稳态 fragment：无转场，直接画 from（带 Ken Burns）。 */
export function buildPassthroughFragSource() {
  return `precision highp float;
varying vec2 _uv;
uniform float progress;
${SAMPLE_CHUNK}
void main(){ gl_FragColor = getFromColor(_uv); }`;
}
```

- [ ] **Step 2: 验证生成的 shader 源码结构正确**

Run:
```bash
cd /Users/dfbb/Sites/mtv/mutv/src && node --input-type=module -e "
import {buildFragSource, buildPassthroughFragSource, VERT} from './lib/glTransitionFrag.mjs';
import {execSync} from 'child_process';
const data=JSON.parse(execSync('node lib/gl-transitions/gl-transition-transform.js -d lib/gl-transitions/transitions',{encoding:'utf-8'}));
const fade=data.find(x=>x.name==='fade')||data[0];
const f=buildFragSource(fade.glsl);
const checks=[
  ['含 precision', f.includes('precision highp float')],
  ['含 getFromColor', f.includes('vec4 getFromColor')],
  ['含 transition glsl', f.includes('transition')],
  ['含 main', f.includes('void main()')],
  ['passthrough 含 getFromColor', buildPassthroughFragSource().includes('getFromColor')],
  ['VERT 含 gl_Position', VERT.includes('gl_Position')],
];
let ok=true; for(const [n,p] of checks){ok=ok&&p;console.log(p?'PASS':'FAIL',n);}
process.exit(ok?0:1);
"
```
Expected: 全 `PASS`，退出码 0。

- [ ] **Step 3: Commit**

```bash
cd /Users/dfbb/Sites/mtv/mutv
git add src/lib/glTransitionFrag.mjs
git commit -m "feat(carousel): add fragment shader builder (cover + Ken Burns + blur-contain)"
```

---

<!-- TASKS3 -->

## Task 4: carouselRuntime.js（浏览器端运行时）

浏览器端逻辑：用 regl 创建画布、加载图片为纹理、按时间轴（rAF + performance.now）调度"停留 → 转场"循环到结束、每张图按 Ken Burns 配置算 zoom/pan、转场时编译对应 GLSL shader 混合两张图。这是一个**浏览器脚本**（非 ESM module，运行时由全局 `regl` UMD + 注入的配置驱动），buildCarousel 会把它和配置、kenBurns 源、frag 源一起内联进 HTML。

约定：HTML 会在此脚本前定义全局 `CAROUSEL_CONFIG`（图片 URL 列表、intvl、transDur、各转场的 frag 源、屏幕宽高、kenBurnsConfig 函数、passthrough 源）。

**Files:**
- Create: `src/lib/carouselRuntime.js`

- [ ] **Step 1: 写运行时（分块写入，先建文件含占位）**

Create `src/lib/carouselRuntime.js`:
```js
/* Carousel browser runtime. Expects global CAROUSEL_CONFIG:
 * {
 *   images: [url, ...],
 *   intvl: seconds per slide (hold),
 *   transDur: seconds per transition,
 *   width, height,
 *   transitions: [fragSource, ...]   // pool, randomly picked per transition
 *   passthrough: fragSource,
 *   kenBurns: (imgAR, screenAR) => config,
 *   seed: number                      // deterministic randomness
 * }
 * Drives via requestAnimationFrame + performance.now (Remotion hijacks both
 * during render, so motion is deterministic per frame).
 */
/* global CAROUSEL_CONFIG, createREGL */
(function () {
  var C = CAROUSEL_CONFIG;
  var canvas = document.getElementById('cv');
  canvas.width = C.width; canvas.height = C.height;
  var regl = createREGL({canvas: canvas, attributes: {preserveDrawingBuffer: true}});
  var screenAR = C.width / C.height;

  // --- deterministic PRNG (mulberry32) ---
  var seed = C.seed >>> 0;
  function rand() {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // PLACEHOLDER_RUNTIME_BODY
})();
```

- [ ] **Step 2: 替换 PLACEHOLDER_RUNTIME_BODY 为纹理加载 + 配置计算**

用 Edit 把 `  // PLACEHOLDER_RUNTIME_BODY` 替换为：
```js
  // --- load all images as regl textures ---
  var slides = [];     // {tex, ar}
  var loaded = 0;
  C.images.forEach(function (url, i) {
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      slides[i] = {tex: regl.texture({data: img, flipY: true}), ar: img.width / img.height};
      loaded++;
    };
    img.src = url;
  });

  // per-slide Ken Burns config (computed lazily once ar known)
  function kb(i) { return C.kenBurns(slides[i].ar, screenAR); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  // pan offset on the cover sampling window, eased by t in [0,1]
  function panVec(cfg, t) {
    var amt = cfg.panAmount * (t - 0.5); // center-crossing pan
    if (cfg.panAxis === 'x') return [amt, 0];
    if (cfg.panAxis === 'y') return [0, amt];
    return [0, 0];
  }
  function zoomAt(cfg, t) { return lerp(cfg.zoomFrom, cfg.zoomTo, t); }
  function modeNum(cfg) { return cfg.mode === 'blur-contain' ? 5 : 0; }

  // PLACEHOLDER_RUNTIME_DRAW
```

- [ ] **Step 3: 替换 PLACEHOLDER_RUNTIME_DRAW 为 regl draw 命令 + 调度循环**

用 Edit 把 `  // PLACEHOLDER_RUNTIME_DRAW` 替换为：
```js
  // compiled regl draw commands cached by frag source
  var cmdCache = {};
  function getCmd(frag) {
    if (cmdCache[frag]) return cmdCache[frag];
    var cmd = regl({
      frag: frag,
      vert: C.vert,
      attributes: {_p: [[-1, -1], [3, -1], [-1, 3]]},
      uniforms: {
        progress: regl.prop('progress'), ratio: screenAR,
        from: regl.prop('from'), to: regl.prop('to'),
        fromR: regl.prop('fromR'), toR: regl.prop('toR'),
        fromMode: regl.prop('fromMode'), toMode: regl.prop('toMode'),
        fromZoom: regl.prop('fromZoom'), toZoom: regl.prop('toZoom'),
        fromPan: regl.prop('fromPan'), toPan: regl.prop('toPan'),
      },
      count: 3,
    });
    cmdCache[frag] = cmd;
    return cmd;
  }

  // assign a random transition frag to each slide boundary, deterministically
  var perBoundaryFrag = [];
  function fragForBoundary(b) {
    if (perBoundaryFrag[b] === undefined) {
      perBoundaryFrag[b] = C.transitions[Math.floor(rand() * C.transitions.length)];
    }
    return perBoundaryFrag[b];
  }

  var n = C.images.length;
  var cycle = C.intvl + C.transDur; // seconds per slide step
  var start = (window.performance && performance.now) ? performance.now() : Date.now();

  function frame() {
    if (loaded < n) { requestAnimationFrame(frame); return; }
    var nowMs = (window.performance && performance.now) ? performance.now() : Date.now();
    var elapsed = (nowMs - start) / 1000;
    var step = Math.floor(elapsed / cycle);     // which slide step
    var inStep = elapsed - step * cycle;         // time within step
    var cur = ((step % n) + n) % n;
    var nxt = (cur + 1) % n;
    regl.clear({color: [0, 0, 0, 1], depth: 1});

    if (inStep < C.intvl) {
      // hold: draw current with Ken Burns progressing over full cycle
      var tHold = (step * cycle + inStep) / cycle; // continuous-ish
      var c = kb(cur), th = (inStep) / C.intvl;
      getCmd(C.passthrough)({
        progress: 0, from: slides[cur].tex, to: slides[cur].tex,
        fromR: slides[cur].ar, toR: slides[cur].ar,
        fromMode: modeNum(c), toMode: modeNum(c),
        fromZoom: zoomAt(c, th), toZoom: zoomAt(c, th),
        fromPan: panVec(c, th), toPan: panVec(c, th),
      });
    } else {
      // transition: progress 0..1 across transDur
      var p = (inStep - C.intvl) / C.transDur;
      var cc = kb(cur), cn = kb(nxt);
      getCmd(fragForBoundary(step))({
        progress: p,
        from: slides[cur].tex, to: slides[nxt].tex,
        fromR: slides[cur].ar, toR: slides[nxt].ar,
        fromMode: modeNum(cc), toMode: modeNum(cn),
        fromZoom: zoomAt(cc, 1), toZoom: zoomAt(cn, 0),
        fromPan: panVec(cc, 1), toPan: panVec(cn, 0),
      });
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
```

- [ ] **Step 4: 语法校验**

Run: `cd /Users/dfbb/Sites/mtv/mutv/src && node --check lib/carouselRuntime.js`
Expected: 无输出（语法合法）。

注：此脚本用浏览器全局（regl/document/Image），`node --check` 只验证语法，不执行。真实执行在 Task 7 的渲染抽帧。

- [ ] **Step 5: Commit**

```bash
cd /Users/dfbb/Sites/mtv/mutv
git add src/lib/carouselRuntime.js
git commit -m "feat(carousel): add browser runtime (regl draw + scheduling + Ken Burns)"
```

---

<!-- TASKS4 -->

## Task 5: buildCarousel.mjs（组装自包含轮播 HTML）

Node 端：接收图片 URL 列表、间隔、转场组、屏幕宽高，读取 regl/kenBurns/frag/runtime 源，挑选转场组的 GLSL 并编译成 frag 源，组装出一个自包含 HTML 字符串。

**Files:**
- Create: `src/lib/buildCarousel.mjs`

- [ ] **Step 1: 写模块（先建文件含占位）**

Create `src/lib/buildCarousel.mjs`:
```js
import {readFileSync} from 'fs';
import {resolve, dirname} from 'path';
import {fileURLToPath} from 'url';
import {execSync} from 'child_process';
import {buildFragSource, buildPassthroughFragSource, VERT} from './glTransitionFrag.mjs';
import {groupTransitions} from './transitionGroups.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

/** 读取全部 gl-transitions 解析结果（name -> glsl）。 */
function loadTransitions() {
  const script = resolve(HERE, 'gl-transitions/gl-transition-transform.js');
  const dir = resolve(HERE, 'gl-transitions/transitions');
  const json = execSync(`node "${script}" -d "${dir}"`, {encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024});
  return JSON.parse(json);
}

// PLACEHOLDER_BUILD
```

- [ ] **Step 2: 替换 PLACEHOLDER_BUILD 为主函数**

用 Edit 把 `// PLACEHOLDER_BUILD` 替换为：
```js
/**
 * @param {object} opts
 *   images: string[]   public/ 下的图片文件名（相对 IFrame 的 URL）
 *   intvl: number      每张停留秒数
 *   transDur: number   转场秒数（默认 1）
 *   group: 'soft'|'cool'|'hard'
 *   width, height: number
 *   seed: number
 * @returns {string} 自包含 HTML
 */
export function buildCarousel(opts) {
  const {images, intvl, transDur = 1, group, width, height, seed = 1} = opts;
  const all = loadTransitions();
  const names = all.map((t) => t.name);
  const chosen = new Set(groupTransitions(group, names));
  const transFrags = all.filter((t) => chosen.has(t.name)).map((t) => buildFragSource(t.glsl));
  const passthrough = buildPassthroughFragSource();

  const reglSrc = readFileSync(resolve(HERE, 'regl/regl.min.js'), 'utf-8');
  const kbSrc = readFileSync(resolve(HERE, 'kenBurns.mjs'), 'utf-8');
  const runtimeSrc = readFileSync(resolve(HERE, 'carouselRuntime.js'), 'utf-8');

  // kenBurns.mjs 是 ESM（export function）。浏览器内联需去掉 export 关键字，
  // 暴露为全局函数 kenBurnsConfig。
  const kbInline = kbSrc.replace(/export\s+function/g, 'function');

  const config = {
    images,
    intvl,
    transDur,
    width,
    height,
    seed,
    vert: VERT,
    transitions: transFrags,
    passthrough,
  };

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#000}
  #cv{display:block;width:100vw;height:100vh}
</style></head><body>
<canvas id="cv"></canvas>
<script>${reglSrc}</script>
<script>${kbInline}</script>
<script>
  var CAROUSEL_CONFIG = ${JSON.stringify(config)};
  CAROUSEL_CONFIG.kenBurns = kenBurnsConfig;
</script>
<script>${runtimeSrc}</script>
</body></html>`;
}
```

- [ ] **Step 3: 验证生成的 HTML 结构（用 example/mbg 名义图片名）**

Run:
```bash
cd /Users/dfbb/Sites/mtv/mutv/src && node --input-type=module -e "
import {buildCarousel} from './lib/buildCarousel.mjs';
const html=buildCarousel({images:['a.jpg','b.jpg','c.jpg'],intvl:5,group:'soft',width:1080,height:720,seed:7});
const checks=[
  ['含 DOCTYPE', html.startsWith('<!DOCTYPE html>')],
  ['含 canvas#cv', html.includes('<canvas id=\"cv\">')],
  ['内联 regl (createREGL)', html.includes('createREGL')],
  ['含 CAROUSEL_CONFIG', html.includes('var CAROUSEL_CONFIG')],
  ['挂载 kenBurns 函数', html.includes('CAROUSEL_CONFIG.kenBurns = kenBurnsConfig')],
  ['kenBurns 去掉了 export', !html.includes('export function kenBurnsConfig')],
  ['含运行时 frame()', html.includes('requestAnimationFrame(frame)')],
  ['图片名出现在配置中', html.includes('a.jpg') && html.includes('c.jpg')],
  ['无裸 </script> 截断（配置/shader 不含该字面量）', !html.slice(html.indexOf('var CAROUSEL_CONFIG')).split('<\/script>')[0].includes('a.jpg') ? false : true],
];
let ok=true;for(const[n,p]of checks){ok=ok&&p;console.log(p?'PASS':'FAIL',n);}
process.exit(ok?0:1);
"
```
Expected: 全 `PASS`，退出码 0。

> 说明：CAROUSEL_CONFIG 里只有图片**文件名**、数字、shader 源码字符串，不含外部 HTML，故无 `</script>` 截断风险（与 bg-anim 修复同理）。GLSL/JS 源里不含 `</script>` 字面量——若未来某转场 GLSL 含该字面量，需转义；当前 121 个均不含。

- [ ] **Step 4: Commit**

```bash
cd /Users/dfbb/Sites/mtv/mutv
git add src/lib/buildCarousel.mjs
git commit -m "feat(carousel): assemble self-contained carousel HTML"
```

---

<!-- TASKS5 -->

## Task 6: types.ts + BackgroundLayer carousel 分支

**Files:**
- Modify: `src/types.ts`
- Modify: `src/preset/BackgroundLayer.tsx`

- [ ] **Step 1: types.ts 加 prop**

在 `src/types.ts` 的 `MVInputProps` 里，`backgroundAnim: string;` 那行之后加：
```ts
  /** Carousel HTML filename in public/ (multi-image dir slideshow). Loaded via IFrame src. */
  backgroundCarousel: string;
```
并在 `defaultProps` 里 `backgroundAnim: '',` 之后加：
```ts
  backgroundCarousel: '',
```

- [ ] **Step 2: BackgroundLayer 加 carousel 分支（优先级 video > carousel > image > anim > gradient）**

在 `src/preset/BackgroundLayer.tsx`：
1. props 类型里 `backgroundImage?: string;` 之后加 `backgroundCarousel?: string;`
2. 解构参数里加 `backgroundCarousel`
3. 在 `if (backgroundVideo) {...}` 块之后、`if (backgroundImage) {...}` 之前插入：
```tsx
  if (backgroundCarousel) {
    return (
      <AbsoluteFill>
        <IFrame src={toSrc(backgroundCarousel)} style={{width: '100%', height: '100%', border: 'none'}} />
      </AbsoluteFill>
    );
  }
```
4. 更新顶部 JSDoc 注释，把优先级说明改为 `video > carousel > image > anim > gradient`，并加一行 `- backgroundCarousel: multi-image slideshow HTML in an <IFrame src>`。

- [ ] **Step 3: 8 个 preset 传入 backgroundCarousel**

每个 preset 的 Composition 都从 props 解构背景字段并传给 `<BackgroundLayer>`。对全部 8 个文件做同样改动：在解构里加 `backgroundCarousel`，在 `<BackgroundLayer>` 调用里加 `backgroundCarousel={backgroundCarousel}`。

Run（批量改 8 个文件的解构与传参）:
```bash
cd /Users/dfbb/Sites/mtv/mutv/src
grep -rl "backgroundAnim" preset/ | while read f; do
  perl -0777 -i -pe 's/(\bbackgroundAnim\b)(,?)(\s*\n)/$1$2$3      backgroundCarousel,$3/ if !/backgroundCarousel/' "$f"
done
echo "手动核对：以下文件需确保解构含 backgroundCarousel 且 <BackgroundLayer> 传了该 prop"
grep -rln "BackgroundLayer" preset/
```
注：perl 自动改解构不可靠（各 preset 写法不同）。**正确做法**是逐个文件用 Read 看清 props 解构和 `<BackgroundLayer .../>` 调用，再用 Edit：解构里加 `backgroundCarousel`，调用里在 `backgroundAnim={backgroundAnim}` 后加一行 `backgroundCarousel={backgroundCarousel}`。8 个文件：apple/bounce/cinema/ktv/neon/no2/typewriter 的 `Composition.tsx`，orig 的 `AudioVisualization.tsx`。

- [ ] **Step 4: tsc 校验**

Run: `cd /Users/dfbb/Sites/mtv/mutv/src && npx tsc --noEmit`
Expected: 退出码 0。

- [ ] **Step 5: Commit**

```bash
cd /Users/dfbb/Sites/mtv/mutv
git add src/types.ts src/preset
git commit -m "feat(carousel): add backgroundCarousel prop and BackgroundLayer branch"
```

---

## Task 7: render.mjs — bg-image 目录检测、复制、生成 carousel

**Files:**
- Modify: `src/render.mjs`

- [ ] **Step 1: 加 import（顶部）**

`src/render.mjs:31` 现有 `import {readFileSync, writeFileSync, readdirSync, existsSync, copyFileSync, mkdirSync} from 'fs';`。把它改为加入 `statSync`：
```js
import {readFileSync, writeFileSync, readdirSync, existsSync, copyFileSync, mkdirSync, statSync} from 'fs';
```
并在 `import {injectVirtualMouse, needsVirtualMouse} from './animbgInject.mjs';` 之后加两行：
```js
import {buildCarousel} from './lib/buildCarousel.mjs';
import {isValidGroup, VALID_GROUPS} from './lib/transitionGroups.mjs';
```

- [ ] **Step 2: 加 backgroundCarousel 变量**

在 `let backgroundAnim = '';` 之后加：
```js
let backgroundCarousel = '';
```

- [ ] **Step 3: 改写 `if (args['bg-image'])` 分支为「文件 vs 目录」**

把现有的：
```js
if (args['bg-image']) {
  backgroundImage = copyToPublic(args['bg-image'], 'background image');
} else if (args['bg-video']) {
```
替换为：
```js
if (args['bg-image']) {
  const resolvedBg = resolveFilePath(args['bg-image']);
  if (!existsSync(resolvedBg)) {
    console.error(`Error: background path not found: ${resolvedBg}`);
    process.exit(1);
  }
  const isDir = statSync(resolvedBg).isDirectory();
  if (!isDir) {
    backgroundImage = copyToPublic(args['bg-image'], 'background image');
  } else {
    // Directory: scan images, sort by name
    const IMG_RE = /\.(jpe?g|png|webp|gif)$/i;
    const imgs = readdirSync(resolvedBg).filter((f) => IMG_RE.test(f)).sort();
    if (imgs.length === 0) {
      console.error(`Error: no images (jpg/jpeg/png/webp/gif) found in directory: ${resolvedBg}`);
      process.exit(1);
    }
    if (imgs.length === 1) {
      backgroundImage = copyToPublic(join(resolvedBg, imgs[0]), 'background image');
    } else {
      // carousel
      const group = args['bg-image-trans'] || 'soft';
      if (!isValidGroup(group)) {
        console.error(`Error: --bg-image-trans must be one of ${VALID_GROUPS.join('|')}, got: ${group}`);
        process.exit(1);
      }
      const intvl = args['bg-image-intvl'] ? parseFloat(args['bg-image-intvl']) : 5;
      if (!(intvl > 0)) {
        console.error(`Error: --bg-image-intvl must be a positive number, got: ${args['bg-image-intvl']}`);
        process.exit(1);
      }
      const pubDir = resolve('public');
      mkdirSync(pubDir, {recursive: true});
      // copy images with index-prefixed unique names
      const publicNames = imgs.map((name, i) => {
        const dest = `bgimg-${String(i).padStart(3, '0')}-${name}`;
        copyFileSync(join(resolvedBg, name), resolve(pubDir, dest));
        return dest;
      });
      const html = buildCarousel({
        images: publicNames,
        intvl,
        transDur: 1,
        group,
        width: resWidth,
        height: resHeight,
        seed: Math.floor(Math.random() * 0xffffffff),
      });
      writeFileSync(resolve(pubDir, 'bgimage-carousel.html'), html);
      backgroundCarousel = 'bgimage-carousel.html';
      console.log(`Using image carousel: ${publicNames.length} images, ${intvl}s interval, ${group} transitions`);
    }
  }
} else if (args['bg-video']) {
```

注意：`resWidth`/`resHeight` 在 `render.mjs:262` 定义，早于 background 块（`:343`），故此处可直接使用，无需调整顺序。

- [ ] **Step 4: backgroundCarousel 注入 inputProps**

在 `inputProps` 对象里 `backgroundAnim,` 之后加：
```js
  backgroundCarousel,
```

- [ ] **Step 5: 日志（两个分支：render 与 --html）**

在 render 分支与 --html 分支各自的 `if (backgroundAnim) console.log(...)` 之后，加：
```js
if (backgroundCarousel) console.log(`  Background carousel: ${backgroundCarousel}`);
```
（两处都加。先 grep `Background anim:` 定位两处。）

- [ ] **Step 6: 更新头部文档 + bgFlags 不变（bg-image 已在内）**

把头部 `--bg-image` 文档行改为：
```
 *   --bg-image     Background image file OR directory (multi-image = transition slideshow)
 *   --bg-image-intvl   Seconds each carousel image holds (default 5)
 *   --bg-image-trans   Carousel transition group: soft|cool|hard (default soft)
```

- [ ] **Step 7: 语法校验**

Run: `cd /Users/dfbb/Sites/mtv/mutv/src && node --check render.mjs`
Expected: 无输出。

- [ ] **Step 8: 端到端渲染验证（横屏 + 竖屏抽帧）**

Run（横屏，example/mbg 6 张混合比例，间隔 3 秒，soft 组）:
```bash
cd /Users/dfbb/Sites/mtv/mutv/src
HSHELL="node_modules/.remotion/chrome-headless-shell/mac-arm64/chrome-headless-shell-mac-arm64/chrome-headless-shell"
node render.mjs --audio ../example/cn-1.mp3 --title "carousel L" --preset ktv \
  --bg-image ../example/mbg --bg-image-intvl 3 --res 1080x720 --output /tmp/carL.mp4 2>&1 | grep -E "Using image carousel|Background carousel|Error" | head
ls -la public/bgimage-carousel.html
# 抽帧：转场期(t≈3.5s→帧≈84)与不同停留期(帧30、帧150)各一帧
node -e "const fs=require('fs');fs.writeFileSync('/tmp/cp.json',JSON.stringify({audioFileName:'cn-1.mp3',lyrics:[],title:'',subtitle:'',creditText:'',durationInSeconds:20,lyricOffset:0,backgroundImage:'',backgroundVideo:'',backgroundAnim:'',backgroundCarousel:'bgimage-carousel.html',width:1080,height:720,fps:24}))"
for F in 30 84 150; do npx remotion still preset/ktv/index.ts MusicVideo /tmp/carL_$F.png --props=/tmp/cp.json --frame=$F --log=error --browser-executable="$HSHELL" 2>&1 | tail -1; done
ls -la /tmp/carL_*.png
```
Expected: 日志含 `Using image carousel: 6 images, 3s interval, soft transitions`；`public/bgimage-carousel.html` 生成；三个 PNG 都生成且 md5 互不相同（说明画面随时间变化）。**实现者须用 Read 工具查看这三帧**，人工确认：背景显示图片、不同帧画面不同（轮播+Ken Burns 在动）、图片无拉伸变形。frame 84 应能看到两图混合的转场中间态。

- [ ] **Step 9: 竖屏验证（同图在竖屏下走不同 Ken Burns 档）**

Run:
```bash
cd /Users/dfbb/Sites/mtv/mutv/src
node render.mjs --audio ../example/cn-1.mp3 --title "carousel P" --preset ktv \
  --bg-image ../example/mbg --bg-image-intvl 3 --res 720x1080 --output /tmp/carP.mp4 2>&1 | grep -E "Using image carousel|Error"
node -e "const fs=require('fs');fs.writeFileSync('/tmp/cpP.json',JSON.stringify({audioFileName:'cn-1.mp3',lyrics:[],title:'',subtitle:'',creditText:'',durationInSeconds:20,lyricOffset:0,backgroundImage:'',backgroundVideo:'',backgroundAnim:'',backgroundCarousel:'bgimage-carousel.html',width:720,height:1080,fps:24}))"
HSHELL="node_modules/.remotion/chrome-headless-shell/mac-arm64/chrome-headless-shell-mac-arm64/chrome-headless-shell"
npx remotion still preset/ktv/index.ts MusicVideo /tmp/carP_50.png --props=/tmp/cpP.json --frame=50 --log=error --browser-executable="$HSHELL" 2>&1 | tail -1
ls -la /tmp/carP_50.png
```
Expected: 竖屏帧生成。**Read 查看**：横图在竖屏里应 cover 充满（极宽档横向取样），无黑边拉伸；竖图应居中。

- [ ] **Step 10: 错误路径验证**

Run:
```bash
cd /Users/dfbb/Sites/mtv/mutv/src
# 空目录
mkdir -p /tmp/emptybg && node render.mjs --audio ../example/cn-1.mp3 --title x --bg-image /tmp/emptybg 2>&1 | grep -i "no images"
# 非法 trans 组
node render.mjs --audio ../example/cn-1.mp3 --title x --bg-image ../example/mbg --bg-image-trans bogus 2>&1 | grep -i "bg-image-trans must be"
# 非法间隔
node render.mjs --audio ../example/cn-1.mp3 --title x --bg-image ../example/mbg --bg-image-intvl -2 2>&1 | grep -i "must be a positive"
```
Expected: 三条错误信息分别命中。

- [ ] **Step 11: 清理 + Commit**

```bash
cd /Users/dfbb/Sites/mtv/mutv/src && rm -f /tmp/carL*.png /tmp/carP*.png /tmp/cp*.json /tmp/carL.mp4 /tmp/carP.mp4 public/bgimage-carousel.html public/bgimg-*.jpg public/cn-1.mp3; rmdir /tmp/emptybg 2>/dev/null
cd /Users/dfbb/Sites/mtv/mutv
git add src/render.mjs
git commit -m "feat(render): --bg-image directory carousel with gl-transitions"
```

---

<!-- TASKS6 -->

## Task 8: cli.mjs — 转发新参数 + help

**Files:**
- Modify: `src/cli.mjs`

- [ ] **Step 1: 转发参数**

在 `src/cli.mjs` 里，找到 `if (opts['bg-image']) nodeArgs.push('--bg-image', resolve(opts['bg-image']));` 这行（`resolve` 对目录同样有效，保持不变）。在其后加：
```js
if (opts['bg-image-intvl']) nodeArgs.push('--bg-image-intvl', String(opts['bg-image-intvl']));
if (opts['bg-image-trans']) nodeArgs.push('--bg-image-trans', opts['bg-image-trans']);
```

- [ ] **Step 2: 更新 help 文档**

把 `src/cli.mjs` 头部的 `--bg-image` 文档行替换为：
```
 *   --bg-image    Background image file OR directory (multi-image = transition slideshow)
 *   --bg-image-intvl  Seconds each carousel image holds (default 5)
 *   --bg-image-trans  Carousel transition group: soft|cool|hard (default soft)
```

- [ ] **Step 3: 语法 + 端到端转发校验**

Run:
```bash
cd /Users/dfbb/Sites/mtv/mutv/src
node --check cli.mjs && echo "cli OK"
node cli.mjs --help | grep -E "bg-image-intvl|bg-image-trans|bg-image"
# 通过 cli 跑目录轮播（截断，确认转发到 render 并识别目录）
timeout 25 node cli.mjs --audio ../example/cn-1.mp3 --title t --preset ktv --bg-image ../example/mbg --bg-image-intvl 4 --bg-image-trans cool --res 1080x720 --output /tmp/cli_car.mp4 2>&1 | grep -E "Using image carousel|Error" | head -1
```
Expected: help 显示三行；轮播日志含 `4s interval, cool transitions`。

- [ ] **Step 4: 清理 + Commit**

```bash
cd /Users/dfbb/Sites/mtv/mutv/src && rm -f /tmp/cli_car.mp4 public/bgimage-carousel.html public/bgimg-*.jpg public/cn-1.mp3
cd /Users/dfbb/Sites/mtv/mutv
git add src/cli.mjs
git commit -m "feat(cli): forward --bg-image-intvl/--bg-image-trans, update help"
```

---

## Task 9: USAGE.md 文档

**Files:**
- Modify: `USAGE.md`

- [ ] **Step 1: 更新 --bg-image 参数行 + 新增两参数**

在 `USAGE.md` 参数表里，把 `--bg-image` 那行替换为下面三行（保持表格列对齐）:
```
| `--bg-image <文件\|目录>` | 无 | 背景图片文件，或图片目录。目录内多图时自动用 gl-transitions 转场轮播，循环到歌曲结束。与 `--bg-video`/`--bg-anim` 互斥。 |
| `--bg-image-intvl <秒>` | `5` | 轮播时每张图停留秒数（转场固定额外 1 秒）。 |
| `--bg-image-trans <组>` | `soft` | 轮播转场风格组：`soft`（柔和淡入淡出/滑动/缩放）、`cool`（翻页/扭曲/炫彩）、`hard`（故障/像素化/燃烧）。 |
```

- [ ] **Step 2: 加一段轮播说明（缩放规则）**

在参数表之后合适位置加一小节：
```markdown
### 背景图轮播与缩放规则

`--bg-image` 传目录且含多张图时，按文件名排序轮播，用 `src/lib/gl-transitions` 的随机 GLSL 转场切换，rAF 驱动循环到歌曲结束。每张图按「图片宽高比 ÷ 屏幕宽高比」自动选择缩放/平移（Ken Burns），始终等比、绝不拉伸：

- 接近屏幕比例：cover 居中，轻微放大
- 明显比屏幕宽：cover，轻微放大，左右平移
- 明显比屏幕窄：cover，轻微放大，上下平移
- 极宽：cover，小幅缩放，横向慢移
- 极窄：背景模糊 cover + 前景 contain 完整显示

横屏（1080×720）与竖屏（720×1080）共用同一套相对阈值，自动适配：同一张 16:9 横图在横屏里是「接近」，在竖屏里是「极宽」（横向慢移露出全景）。
```

- [ ] **Step 3: 校验旧描述无残留**

Run:
```bash
cd /Users/dfbb/Sites/mtv/mutv
grep -n "bg-image-intvl\|bg-image-trans\|轮播\|gl-transitions" USAGE.md | head
grep -c "背景图片文件。与" USAGE.md || echo "(旧单图描述已替换)"
```
Expected: 新参数与轮播小节出现；旧的纯单图描述已被替换。

- [ ] **Step 4: Commit**

```bash
cd /Users/dfbb/Sites/mtv/mutv
git add USAGE.md
git commit -m "docs(usage): document bg-image directory carousel and scaling rules"
```

---

## 完成后

全部 9 个任务完成后，做一次整体回归：
- `cd src && npx tsc --noEmit`（退出 0）
- `node --check render.mjs cli.mjs`（各文件，无输出）
- 单图文件 `--bg-image <一张图>` 仍走原逻辑（回归未破坏）
- 确认 `public/` 下临时产物（carousel html、bgimg-*、cn-1.mp3）已清理，未误入 git（public/ 已 gitignore，确认）






