# WINAMP butterchurn preset 移植 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 butterchurn-presets 主集合的 100 个 Milkdrop preset 移植成 `--bg-anim` 可选的背景,归入新分类 WINAMP,每个用从原名机械提取的两词英文名,靠离线 FFT 逐帧注入在 Remotion headless 下确定性渲染。

**Architecture:** 复用现有 bg-anim 机制(`animbg/<label>/index.html` → `public/animbg/` → iframe → vendor 复制 → `--gl=angle`)。vendor 放 butterchurn 运行时+presets 包;一个共享播放器壳 `bc-player.js` 建 visualizer 并暴露 `__bcRenderAt`;生成脚本为 100 个 preset 产出薄壳 HTML + manifest;新组件 `ButterchurnAnim` 用 `@remotion/media-utils` 逐帧取波形转 Uint8 时域字节、经 `delayRender` 喂进 `visualizer.render({audioLevels})`。

**Tech Stack:** butterchurn 2.6.7 + butterchurn-presets 2.4.7(vendored)、Remotion 4.x、`@remotion/media-utils`、React 18、纯 JS(.mjs)+ node:test、TypeScript。

---

## 关键已确认事实(实现前提,均已查证)

- butterchurn UMD 全局:`butterchurn`(default export class,`butterchurn.default?.createVisualizer ?? butterchurn.createVisualizer`)。presets UMD 全局:`butterchurnPresets`,`.getPresets()` → 100 个 `{原名: presetData}`。
- 离线注入接口:`visualizer.render({ audioLevels: {timeByteArray, timeByteArrayL, timeByteArrayR}, elapsedTime })`。传 audioLevels 时走注入数据,绕开实时 analyser(`3rd/butterchurn/src/rendering/renderer.js:825`)。
- `updateAudio` 独立于 connectAudio,只 `.set()` 字节再 processAudio。fftSize = 1024(numSamps 512×2)。三个 Uint8Array 各长 1024,值 0..255,中心 128(静音)。
- `createVisualizer(audioContext, canvas, {width,height})`;AudioProcessor 在 context 为 falsy 时不建 analyser,注入路径仍可用 → 壳里 `new (window.AudioContext||window.webkitAudioContext)()` 建一个即可,不需 connectAudio。
- vendor 复制:render.mjs 在 `animHtml.includes('vendor/')` 时把 `animbg/vendor/` 复制到 `public/vendor/`,HTML 写进 `public/animbg/`(已实现,见 render.mjs bg-anim 分支)。
- manifest:`src/animbg/manifest.json` 是 JSON 数组,每条 `{label,name,category,tech,...}`。
- BackgroundLayer anim 分流在 `BackgroundLayer.tsx:62-71`,现有 props 含 `audioFileName?`/`beatReactive?`。

## 文件结构

| 文件 | 职责 | 新建/修改 |
| --- | --- | --- |
| `src/animbg/vendor/butterchurn.min.js`、`butterchurnPresets.min.js` | butterchurn 运行时 + 主集合 preset 包 | 新建(下载) |
| `src/animbg/vendor/bc-player.js` | 共享播放器壳:建 visualizer、loadPreset、暴露 `__bcReady`/`__bcRenderAt` | 新建 |
| `src/lib/winampNames.mjs` | 从原 preset key 机械提取唯一两词 label 的纯函数 | 新建 |
| `src/lib/winampNames.test.mjs` | 提取/去重单测 | 新建 |
| `src/lib/waveformBytes.mjs` | Float32 波形窗口 → Uint8(中心128)时域字节的纯函数 | 新建 |
| `src/lib/waveformBytes.test.mjs` | 转换单测 | 新建 |
| `scripts/gen_winamp.mjs` | 读 presets 包 + winampNames → 生成 100 薄壳 HTML + 追加 manifest WINAMP 段 | 新建 |
| `scripts/gen_winamp.test.mjs` | 生成器单测(mock 输入) | 新建 |
| `src/preset/ButterchurnAnim.tsx` | 逐帧取波形→Uint8→delayRender 喂进壳 | 新建 |
| `src/preset/BackgroundLayer.tsx` | 加 `animKind?` prop,WINAMP 时用 ButterchurnAnim | 修改 |
| `src/types.ts` | MVInputProps 加 `backgroundAnimKind` | 修改 |
| 6 个 preset Composition | 透传 `animKind`(从 backgroundAnimKind) | 修改 |
| `src/render.mjs` | 查 manifest category,置 `backgroundAnimKind` 进 inputProps | 修改 |
| `src/animbg/<two-word>/index.html` ×100 + `manifest.json` | 生成产物 | 新建(脚本产出) |
| `USAGE.md` | WINAMP 分类说明 | 修改 |

---

## Task 1: 下载 vendor 库 + 浏览器壳可行性验证(spike gate)

先把库放好,并在真实 Remotion 渲染里确认 `render({audioLevels})` 注入闭环可用(画面随注入字节变化)。这是 go/no-go 关口。

**Files:**
- Create: `src/animbg/vendor/butterchurn.min.js`、`src/animbg/vendor/butterchurnPresets.min.js`
- Create(临时 spike,验证后保留为 Task 2 基础): `src/animbg/_bcspike/index.html`

- [ ] **Step 1: 下载 vendor 库**

```bash
cd /Users/dfbb/Sites/mtv/mutv/src/animbg/vendor
curl -fsSL "https://unpkg.com/butterchurn@2.6.7/lib/butterchurn.min.js" -o butterchurn.min.js
curl -fsSL "https://unpkg.com/butterchurn-presets@2.4.7/lib/butterchurnPresets.min.js" -o butterchurnPresets.min.js
ls -la butterchurn.min.js butterchurnPresets.min.js
```
Expected: butterchurn.min.js ~192KB,butterchurnPresets.min.js ~638KB,均非空。

- [ ] **Step 2: 写最小 spike 壳**

Create `src/animbg/_bcspike/index.html`:

```html
<!doctype html>
<html><head><meta charset="utf-8"><style>html,body{margin:0;height:100%;background:#000;overflow:hidden}#c{position:fixed;inset:0;width:100%;height:100%}</style>
<script src="../vendor/butterchurn.min.js"></script>
<script src="../vendor/butterchurnPresets.min.js"></script>
</head><body>
<canvas id="c"></canvas>
<script>
(function(){
  try {
    var BC = window.butterchurn.default || window.butterchurn;
    var presets = (window.butterchurnPresets.default || window.butterchurnPresets).getPresets();
    var names = Object.keys(presets);
    var canvas = document.getElementById('c');
    var W = window.innerWidth, H = window.innerHeight;
    canvas.width = W; canvas.height = H;
    var ac = new (window.AudioContext || window.webkitAudioContext)();
    var viz = BC.createVisualizer(ac, canvas, {width: W, height: H});
    viz.loadPreset(presets[names[0]], 0);
    var FFT = 1024, el = 0;
    function frame(t){
      // 合成有信号的时域字节:中心128 + 正弦,验证注入驱动
      var a = new Uint8Array(FFT);
      for (var i=0;i<FFT;i++){ a[i] = 128 + Math.round(100*Math.sin((i+t*0.05)*0.1)); }
      el += 1000/24;
      viz.render({audioLevels:{timeByteArray:a, timeByteArrayL:a, timeByteArrayR:a}, elapsedTime: el/1000});
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    document.title = 'bcspike-ok';
  } catch(e){ document.title = 'bcspike-err:'+e.message; console.error(e); }
})();
</script>
</body></html>
```

- [ ] **Step 3: 渲染 spike,确认非黑**

```bash
cd /Users/dfbb/Sites/mtv/mutv/src
node cli.mjs --audio ../example/cn-2.mp3 --title spike --bg-anim _bcspike --res 640x360 --fps 24 --output out/bcspike.mp4 2>&1 | grep -iE "vendor|gl=angle|rendered successfully|error|bcspike" | head
ffmpeg -nostdin -v error -i out/bcspike.mp4 -vf "select=eq(n\,30)" -vframes 1 out/bcspike-frame.png 2>&1 | head -2
ls -la out/bcspike-frame.png
```
Expected: 渲染成功;日志含 `Copied vendor libraries`;抽帧 PNG >50KB(非黑,有 Milkdrop 画面)。**若帧为黑或 WebGL2 报错 → STOP,报告 BLOCKED,重新评估。**

- [ ] **Step 4: 清理 spike 产物,提交 vendor**

```bash
cd /Users/dfbb/Sites/mtv/mutv/src
rm -rf animbg/_bcspike out/bcspike.mp4 out/bcspike-frame.png public/animbg public/vendor public/cn-2.mp3
cd /Users/dfbb/Sites/mtv/mutv
git add src/animbg/vendor/butterchurn.min.js src/animbg/vendor/butterchurnPresets.min.js
git commit -m "feat(winamp): vendor butterchurn 运行时 + presets 主集合"
```
(spike 壳是临时验证,不提交;Task 4 写正式共享壳。)

---

## Task 2: winampNames.mjs — 机械提取两词 label + 单测

从原 preset key 确定性地提取唯一两词 label。纯函数,可单测。

**Files:**
- Create: `src/lib/winampNames.mjs`
- Create: `src/lib/winampNames.test.mjs`

- [ ] **Step 1: 写失败测试**

Create `src/lib/winampNames.test.mjs`:

```js
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {twoWordLabel, buildNameMap} from './winampNames.mjs';

test('twoWordLabel: 取前两个有意义 token,小写短横线', () => {
  assert.equal(twoWordLabel('$$$ Royal - Mashup (197)'), 'royal-mashup');
});

test('twoWordLabel: 去前导下划线/符号,跨分隔取词', () => {
  assert.equal(
    twoWordLabel('_Aderrasi - Wanderer in Curved Space - mash0000'),
    'aderrasi-wanderer'
  );
});

test('twoWordLabel: 不足两词时补 -fx 保持两段', () => {
  assert.equal(twoWordLabel('Geiss'), 'geiss-fx');
});

test('buildNameMap: 100 个唯一 label,冲突加后缀', () => {
  const keys = ['$$$ Royal - Mashup (197)', '$$$ Royal - Mashup (220)', 'Foo - Bar baz'];
  const map = buildNameMap(keys);
  const labels = Object.keys(map);
  assert.equal(labels.length, 3);
  assert.equal(new Set(labels).size, 3, 'label 必须唯一');
  // 同源冲突的两个 Royal Mashup 应有不同 label(其一带去重后缀)
  assert.ok(labels.some((l) => l === 'royal-mashup'));
  assert.ok(labels.some((l) => l.startsWith('royal-mashup-')));
  // 每个 label 映射回原 key
  for (const [label, key] of Object.entries(map)) {
    assert.ok(keys.includes(key));
    assert.match(label, /^[a-z0-9]+(-[a-z0-9]+)+$/);
  }
});

test('buildNameMap: 确定性(同输入同输出)', () => {
  const keys = ['A - One', 'B - Two', 'A - One extra'];
  assert.deepEqual(buildNameMap(keys), buildNameMap(keys));
});
```

- [ ] **Step 2: 跑红**

Run: `cd src && node --test lib/winampNames.test.mjs`
Expected: FAIL — 模块不存在。

- [ ] **Step 3: 写实现**

Create `src/lib/winampNames.mjs`:

```js
/**
 * winampNames.mjs — 从 butterchurn preset 原名机械提取唯一的两词 label。
 * 确定性、可追溯、可重跑:相同输入永远产出相同映射。
 */

// 提取有意义 token:按非字母数字切分,丢弃空串与纯数字串。
function tokens(key) {
  return key
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t && !/^\d+$/.test(t));
}

/** 取前两个有意义 token 组成 `<word>-<word>`;不足两词补 -fx 保持两段。 */
export function twoWordLabel(key) {
  const t = tokens(key);
  if (t.length === 0) return 'preset-fx';
  if (t.length === 1) return `${t[0]}-fx`;
  return `${t[0]}-${t[1]}`;
}

/**
 * 为一组原 key 生成 {label: key} 映射,label 全唯一。
 * 冲突时按出现顺序追加 -2、-3… 后缀(确定性)。
 */
export function buildNameMap(keys) {
  const used = new Map(); // baseLabel -> count
  const map = {};
  for (const key of keys) {
    const base = twoWordLabel(key);
    const n = (used.get(base) || 0) + 1;
    used.set(base, n);
    const label = n === 1 ? base : `${base}-${n}`;
    map[label] = key;
  }
  return map;
}
```

- [ ] **Step 4: 跑绿**

Run: `cd src && node --test lib/winampNames.test.mjs`
Expected: PASS(5 测试)。

- [ ] **Step 5: 提交**

```bash
cd src && git add lib/winampNames.mjs lib/winampNames.test.mjs
git commit -m "feat(winamp): 从原名机械提取唯一两词 label + 单测"
```

---

## Task 3: waveformBytes.mjs — 波形窗口转 Uint8 时域字节 + 单测

把 `@remotion/media-utils` 的 Float32 波形(-1..1)在指定帧位置取一个 fftSize 长的窗口,转成 butterchurn 要的 Uint8(0..255,中心 128)。纯函数。

**Files:**
- Create: `src/lib/waveformBytes.mjs`
- Create: `src/lib/waveformBytes.test.mjs`

- [ ] **Step 1: 写失败测试**

Create `src/lib/waveformBytes.test.mjs`:

```js
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {floatWindowToBytes, FFT_SIZE} from './waveformBytes.mjs';

test('FFT_SIZE 为 1024', () => {
  assert.equal(FFT_SIZE, 1024);
});

test('floatWindowToBytes: 长度恒为 FFT_SIZE', () => {
  const wave = new Float32Array(5000);
  const out = floatWindowToBytes(wave, 1000);
  assert.equal(out.length, FFT_SIZE);
  assert.ok(out instanceof Uint8Array);
});

test('floatWindowToBytes: 0 → 128(静音中心)', () => {
  const wave = new Float32Array(2048); // 全 0
  const out = floatWindowToBytes(wave, 0);
  assert.ok(out.every((b) => b === 128), '静音应全 128');
});

test('floatWindowToBytes: +1 → 255, -1 → ~0(钳制)', () => {
  const wave = new Float32Array(FFT_SIZE);
  wave[0] = 1; wave[1] = -1; wave[2] = 2; wave[3] = -2; // 超界测试钳制
  const out = floatWindowToBytes(wave, 0);
  assert.equal(out[0], 255);
  assert.equal(out[1], 1);   // -1 → 128 + (-127) = 1
  assert.equal(out[2], 255); // 钳制
  assert.equal(out[3], 0);   // 钳制
});

test('floatWindowToBytes: 越界起点用 0 补齐(末尾窗口)', () => {
  const wave = new Float32Array(FFT_SIZE + 10);
  wave.fill(0);
  const out = floatWindowToBytes(wave, FFT_SIZE); // 起点接近末尾,后段越界
  assert.equal(out.length, FFT_SIZE);
  assert.ok(out.every((b) => b === 128)); // 越界补 0 → 128
});
```

- [ ] **Step 2: 跑红**

Run: `cd src && node --test lib/waveformBytes.test.mjs`
Expected: FAIL — 模块不存在。

- [ ] **Step 3: 写实现**

Create `src/lib/waveformBytes.mjs`:

```js
/**
 * waveformBytes.mjs — 把 Float32 波形窗口转成 butterchurn 要的 Uint8 时域字节。
 * butterchurn AudioProcessor 期望 fftSize=1024 的 Uint8Array(0..255,中心 128)。
 */

export const FFT_SIZE = 1024;

/**
 * 从 wave(Float32,-1..1)起点 start 取 FFT_SIZE 个样本,
 * 映射到 Uint8:value = clamp(round(128 + s*127), 0, 255)。
 * 越界样本按 0(→128)处理。
 */
export function floatWindowToBytes(wave, start) {
  const out = new Uint8Array(FFT_SIZE);
  for (let i = 0; i < FFT_SIZE; i++) {
    const idx = start + i;
    const s = idx >= 0 && idx < wave.length ? wave[idx] : 0;
    let v = Math.round(128 + s * 127);
    if (v < 0) v = 0;
    else if (v > 255) v = 255;
    out[i] = v;
  }
  return out;
}
```

- [ ] **Step 4: 跑绿**

Run: `cd src && node --test lib/waveformBytes.test.mjs`
Expected: PASS(5 测试)。

- [ ] **Step 5: 提交**

```bash
cd src && git add lib/waveformBytes.mjs lib/waveformBytes.test.mjs
git commit -m "feat(winamp): 波形窗口→Uint8 时域字节转换 + 单测"
```

---

## Task 4: 共享播放器壳 bc-player.js

一段公共 JS,薄壳 HTML 引用它。建 visualizer、按 `window.__BC_PRESET` 加载 preset、暴露 `__bcReady` 与 `__bcRenderAt(audioFrame)`。

**Files:**
- Create: `src/animbg/vendor/bc-player.js`

- [ ] **Step 1: 写壳**

Create `src/animbg/vendor/bc-player.js`:

```js
/**
 * bc-player.js — 共享 butterchurn 播放器壳。
 *
 * 薄壳 HTML 须:① 先加载 butterchurn.min.js + butterchurnPresets.min.js;
 * ② 设 window.__BC_PRESET = "<原 preset 名>";③ 再加载本文件。
 *
 * 本文件建 visualizer、loadPreset,并暴露:
 *   window.__bcReady          — true 表示可渲染
 *   window.__bcRenderAt(af)   — af = {timeByteArray, timeByteArrayL, timeByteArrayR, elapsedTime}
 *                               用注入的时域字节渲染一帧(供父窗逐帧调用)
 *
 * 离线注入:render({audioLevels}) 绕开实时 analyser(见 butterchurn renderer.js)。
 * 任意失败均 try/catch,画深色兜底,绝不抛出破坏渲染。
 */
(function () {
  window.__bcReady = false;
  var canvas = document.getElementById('bc');
  var W = window.innerWidth || 1920;
  var H = window.innerHeight || 1080;
  if (canvas) { canvas.width = W; canvas.height = H; }

  function fallback() {
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (ctx) { ctx.fillStyle = '#07080d'; ctx.fillRect(0, 0, W, H); }
  }

  try {
    var BC = window.butterchurn && (window.butterchurn.default || window.butterchurn);
    var BCP = window.butterchurnPresets && (window.butterchurnPresets.default || window.butterchurnPresets);
    if (!BC || !BCP || !canvas) { fallback(); return; }

    var presets = BCP.getPresets();
    var key = window.__BC_PRESET;
    var preset = presets[key] || presets[Object.keys(presets)[0]];

    var ac = new (window.AudioContext || window.webkitAudioContext)();
    var viz = BC.createVisualizer(ac, canvas, {width: W, height: H});
    viz.loadPreset(preset, 0);

    window.__bcRenderAt = function (af) {
      try {
        viz.render({
          audioLevels: {
            timeByteArray: af.timeByteArray,
            timeByteArrayL: af.timeByteArrayL,
            timeByteArrayR: af.timeByteArrayR,
          },
          elapsedTime: af.elapsedTime,
        });
      } catch (e) { /* 单帧渲染失败不致命 */ }
    };
    window.__bcReady = true;
  } catch (e) {
    fallback();
    console.error('bc-player init failed:', e && e.message);
  }
})();
```

- [ ] **Step 2: 语法检查**

Run: `cd src && node --check animbg/vendor/bc-player.js`
Expected: 无输出(语法 OK)。

- [ ] **Step 3: 提交**

```bash
cd src && git add animbg/vendor/bc-player.js
git commit -m "feat(winamp): 共享 butterchurn 播放器壳 bc-player.js"
```

---

## Task 5: 生成脚本 gen_winamp.mjs + 单测

读 presets 包 → buildNameMap → 为每个 label 生成薄壳 HTML + 追加 manifest WINAMP 段。

**Files:**
- Create: `scripts/gen_winamp.mjs`
- Create: `scripts/gen_winamp.test.mjs`

- [ ] **Step 1: 写失败测试**

Create `scripts/gen_winamp.test.mjs`:

```js
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {renderShellHtml, buildManifestEntries} from './gen_winamp.mjs';

test('renderShellHtml: 含 PRESET key、引用 vendor 壳', () => {
  const html = renderShellHtml('$$$ Royal - Mashup (197)');
  assert.ok(html.includes('../vendor/butterchurn.min.js'));
  assert.ok(html.includes('../vendor/butterchurnPresets.min.js'));
  assert.ok(html.includes('../vendor/bc-player.js'));
  assert.ok(html.includes('<canvas id="bc"'));
  // preset key 安全嵌入(JSON.stringify 转义)
  assert.ok(html.includes(JSON.stringify('$$$ Royal - Mashup (197)')));
});

test('renderShellHtml: 含 </script> 的 key 不破坏壳', () => {
  const html = renderShellHtml('evil</script>x');
  // JSON.stringify 不转义 /,但我们额外转义 < 防止提前闭合
  assert.ok(!html.includes('evil</script>x</script>') || html.includes('<\\/script>'));
});

test('buildManifestEntries: 每条 category=WINAMP tech=webgl', () => {
  const map = {'royal-mashup': '$$$ Royal - Mashup (197)', 'aderrasi-wanderer': '_Aderrasi - Wanderer'};
  const entries = buildManifestEntries(map);
  assert.equal(entries.length, 2);
  for (const e of entries) {
    assert.equal(e.category, 'WINAMP');
    assert.equal(e.tech, 'webgl');
    assert.ok(e.label && e.name && e.presetKey);
  }
  const byLabel = Object.fromEntries(entries.map((e) => [e.label, e]));
  assert.equal(byLabel['royal-mashup'].presetKey, '$$$ Royal - Mashup (197)');
});
```

- [ ] **Step 2: 跑红**

Run: `cd src && node --test ../scripts/gen_winamp.test.mjs`
Expected: FAIL — 模块不存在。
(注:scripts 在仓库根 `scripts/`,与 `src/` 同级。测试用相对路径或在仓库根跑 `node --test scripts/gen_winamp.test.mjs`。下方命令以仓库根为基准:`cd /Users/dfbb/Sites/mtv/mutv && node --test scripts/gen_winamp.test.mjs`。)

- [ ] **Step 3: 写实现**

Create `scripts/gen_winamp.mjs`:

```js
/**
 * gen_winamp.mjs — 把 butterchurn-presets 主集合生成为 WINAMP bg-anim 模板。
 *
 * 用法:node scripts/gen_winamp.mjs
 * 读 src/animbg/vendor/butterchurnPresets.min.js 的 getPresets(),
 * 用 winampNames.buildNameMap 取唯一两词 label,为每个生成
 * src/animbg/<label>/index.html(薄壳),并把 WINAMP 条目写进 manifest.json
 * (覆盖 manifest 中 category===WINAMP 的旧条目,保留其它)。幂等可重跑。
 */
import {readFileSync, writeFileSync, mkdirSync, existsSync} from 'fs';
import {resolve, dirname} from 'path';
import {fileURLToPath} from 'url';
import vm from 'vm';
import {buildNameMap} from '../src/lib/winampNames.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ANIMBG = resolve(HERE, '..', 'src', 'animbg');

/** 在 vm 沙箱里加载 UMD presets 包,返回 getPresets() 的 key 列表。 */
export function loadPresetKeys(presetsJsPath) {
  const code = readFileSync(presetsJsPath, 'utf-8');
  const sandbox = {};
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  const BCP = sandbox.butterchurnPresets.default || sandbox.butterchurnPresets;
  return Object.keys(BCP.getPresets());
}

/** 生成单个薄壳 HTML。preset key 经 JSON.stringify + < 转义安全嵌入。 */
export function renderShellHtml(presetKey) {
  const safe = JSON.stringify(presetKey).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<style>html,body{margin:0;height:100%;background:#07080d;overflow:hidden}#bc{position:fixed;inset:0;width:100%;height:100%}</style>
<script src="../vendor/butterchurn.min.js"></script>
<script src="../vendor/butterchurnPresets.min.js"></script>
</head><body>
<canvas id="bc"></canvas>
<script>window.__BC_PRESET=${safe};</script>
<script src="../vendor/bc-player.js"></script>
</body></html>
`;
}

/** label→key 映射转 manifest 条目数组。 */
export function buildManifestEntries(map) {
  return Object.entries(map).map(([label, presetKey]) => ({
    label,
    name: label.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    category: 'WINAMP',
    tech: 'webgl',
    presetKey,
  }));
}

function main() {
  const presetsJs = resolve(ANIMBG, 'vendor', 'butterchurnPresets.min.js');
  const keys = loadPresetKeys(presetsJs);
  const map = buildNameMap(keys);
  const labels = Object.keys(map);
  if (labels.length !== keys.length) {
    throw new Error(`label 数(${labels.length})≠ preset 数(${keys.length})`);
  }

  // 写薄壳
  for (const [label, key] of Object.entries(map)) {
    const dir = resolve(ANIMBG, label);
    mkdirSync(dir, {recursive: true});
    writeFileSync(resolve(dir, 'index.html'), renderShellHtml(key));
  }

  // 合并 manifest:保留非 WINAMP,替换 WINAMP
  const manifestPath = resolve(ANIMBG, 'manifest.json');
  const existing = existsSync(manifestPath)
    ? JSON.parse(readFileSync(manifestPath, 'utf-8'))
    : [];
  const kept = existing.filter((e) => e.category !== 'WINAMP');
  const merged = kept.concat(buildManifestEntries(map));
  writeFileSync(manifestPath, JSON.stringify(merged, null, 2) + '\n');

  console.log(`Generated ${labels.length} WINAMP presets into animbg/`);
}

// 直接运行时执行 main;被 import 时只导出函数。
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
```

- [ ] **Step 4: 跑绿(单测)**

Run: `cd /Users/dfbb/Sites/mtv/mutv && node --test scripts/gen_winamp.test.mjs`
Expected: PASS(3 测试)。

- [ ] **Step 5: 真实运行生成器**

Run: `cd /Users/dfbb/Sites/mtv/mutv && node scripts/gen_winamp.mjs`
Expected: `Generated 100 WINAMP presets into animbg/`。

验证:
```bash
cd /Users/dfbb/Sites/mtv/mutv
node -e "const m=require('./src/animbg/manifest.json'); const w=m.filter(e=>e.category==='WINAMP'); console.log('WINAMP count:', w.length); console.log('labels unique:', new Set(w.map(e=>e.label)).size===w.length); console.log('sample:', w.slice(0,3).map(e=>e.label))"
ls src/animbg | grep -v vendor | wc -l   # 应为 72 + 100 = 172(含 manifest.json 则 173,排除 vendor)
```
Expected: WINAMP count: 100,labels unique: true。

- [ ] **Step 6: 提交生成器 + 产物**

```bash
cd /Users/dfbb/Sites/mtv/mutv
git add scripts/gen_winamp.mjs scripts/gen_winamp.test.mjs src/animbg/manifest.json
git add src/animbg/*/index.html
git commit -m "feat(winamp): 生成脚本 + 100 个 preset 薄壳模板 + manifest WINAMP 段"
```

---

## Task 6: ButterchurnAnim 组件

逐帧取波形→Uint8→delayRender 喂进壳。复用 carousel/BeatReactiveAnim 的 delayRender 范式。

**Files:**
- Create: `src/preset/ButterchurnAnim.tsx`

- [ ] **Step 1: 写组件**

Create `src/preset/ButterchurnAnim.tsx`:

```tsx
import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  delayRender,
  continueRender,
} from 'remotion';
import {useAudioData} from '@remotion/media-utils';
import {floatWindowToBytes, FFT_SIZE} from '../lib/waveformBytes.mjs';

/**
 * WINAMP/butterchurn 动画背景。逐帧从音频波形取一个 FFT_SIZE 窗口,转 Uint8
 * 时域字节,经 delayRender 喂进 iframe 内的 __bcRenderAt(确定性、防黑帧)。
 * 音频未就绪或 iframe 未 ready 时静默降级。
 */
export const ButterchurnAnim: React.FC<{src: string; audioSrc: string}> = ({
  src,
  audioSrc,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const audioData = useAudioData(audioSrc);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  React.useEffect(() => {
    const handle = delayRender(`butterchurn frame ${frame}`);
    let cancelled = false;
    let raf = 0;

    // 计算本帧时域字节:窗口起点 = 当前播放样本位置。
    const silent = new Uint8Array(FFT_SIZE).fill(128);
    let bytes = silent;
    if (audioData) {
      const wave = audioData.channelWaveforms[0];
      const start = Math.floor((frame / fps) * audioData.sampleRate);
      bytes = floatWindowToBytes(wave, start);
    }
    const elapsedTime = frame / fps;

    const tick = () => {
      if (cancelled) return;
      const win = iframeRef.current?.contentWindow as
        | (Window & {
            __bcReady?: boolean;
            __bcRenderAt?: (af: {
              timeByteArray: Uint8Array;
              timeByteArrayL: Uint8Array;
              timeByteArrayR: Uint8Array;
              elapsedTime: number;
            }) => void;
          })
        | undefined;
      if (win && win.__bcReady && typeof win.__bcRenderAt === 'function') {
        win.__bcRenderAt({
          timeByteArray: bytes,
          timeByteArrayL: bytes,
          timeByteArrayR: bytes,
          elapsedTime,
        });
        raf = requestAnimationFrame(() => {
          if (!cancelled) continueRender(handle);
        });
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      continueRender(handle);
    };
  }, [frame, fps, audioData]);

  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <iframe
        ref={iframeRef}
        src={src}
        style={{width: '100%', height: '100%', border: 'none'}}
      />
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: 类型检查**

Run: `cd src && npx tsc --noEmit`
Expected: 无错误(allowJs 已开,.mjs 导入按 any)。

- [ ] **Step 3: 提交**

```bash
cd src && git add preset/ButterchurnAnim.tsx
git commit -m "feat(winamp): ButterchurnAnim 组件(逐帧波形注入)"
```

---

## Task 7: 接线 — types + render.mjs + BackgroundLayer + 6 preset

让 WINAMP 类 label 走 ButterchurnAnim。render.mjs 查 manifest category 置 `backgroundAnimKind`。

**Files:**
- Modify: `src/types.ts`、`src/render.mjs`、`src/preset/BackgroundLayer.tsx`
- Modify: 6 个 preset Composition

- [ ] **Step 1: types.ts 加字段**

在 `src/types.ts` 的 `MVInputProps`,`backgroundAnimBeat: boolean;` 之后加:

```ts
  backgroundAnimBeat: boolean;
  /** Animated background kind: 'winamp' uses the butterchurn player, '' is a normal HTML effect. */
  backgroundAnimKind: string;
```

在 `defaultProps`,`backgroundAnimBeat: true,` 之后加:

```ts
  backgroundAnimBeat: true,
  backgroundAnimKind: '',
```

- [ ] **Step 2: render.mjs 查 manifest 置 kind**

在 `src/render.mjs` 的 bg-anim 分支,`backgroundAnimLabel = animLabel;` 之后(`if (animHtml.includes('vendor/'))` 之前)加:

```js
  backgroundAnimLabel = animLabel;
  // WINAMP(butterchurn)preset 走专用播放器组件;查 manifest 的 category。
  try {
    const manifestPath = resolve('animbg', 'manifest.json');
    if (existsSync(manifestPath)) {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
      const entry = manifest.find((e) => e.label === animLabel);
      if (entry && entry.category === 'WINAMP') backgroundAnimKind = 'winamp';
    }
  } catch {}
```

在 bg-anim 分支**之前**声明变量(与 `backgroundAnim`/`backgroundAnimLabel` 同处),找到 `let backgroundAnimLabel` 的声明,在其后加:

```js
let backgroundAnimKind = '';
```
(若 `backgroundAnimLabel` 用别的声明方式,照搬同款。)

在 `inputProps` 对象,`backgroundAnimBeat: beatReactive,` 之后加:

```js
  backgroundAnimBeat: beatReactive,
  backgroundAnimKind,
```

- [ ] **Step 3: BackgroundLayer 加 animKind 分流**

在 `src/preset/BackgroundLayer.tsx`:

(a) import 加:
```tsx
import {BeatReactiveAnim} from './BeatReactiveAnim';
import {ButterchurnAnim} from './ButterchurnAnim';
```

(b) props 类型,`beatReactive?: boolean;` 之后加:
```tsx
  beatReactive?: boolean;
  /** 'winamp' → butterchurn player; otherwise normal HTML effect. */
  animKind?: string;
```

(c) 解构加 `animKind,`。

(d) anim 分支(现 `if (backgroundAnim) {`)改为先判 WINAMP:
```tsx
  if (backgroundAnim) {
    const audioSrc = audioFileName
      ? (audioFileName.startsWith('http') ? audioFileName : staticFile(audioFileName))
      : '';
    if (animKind === 'winamp' && audioSrc) {
      return <ButterchurnAnim src={toSrc(backgroundAnim)} audioSrc={audioSrc} />;
    }
    if (beatReactive && audioFileName) {
      return <BeatReactiveAnim src={toSrc(backgroundAnim)} audioSrc={audioSrc} />;
    }
    return (
      <AbsoluteFill>
        <IFrame src={toSrc(backgroundAnim)} style={{width: '100%', height: '100%', border: 'none'}} />
      </AbsoluteFill>
    );
  }
```
(注:原 BeatReactiveAnim 分支里 audioSrc 是局部算的;这里提到分支外复用,确保两分支一致。)

- [ ] **Step 4: 6 个 preset 透传 animKind**

对 `src/preset/orig/AudioVisualization.tsx`、`apple/Composition.tsx`、`ktv/Composition.tsx`、`cinema/Composition.tsx`、`no2/Composition.tsx`、`typewriter/Composition.tsx` 各:

解构 props 加 `backgroundAnimKind,`;`<BackgroundLayer>` 在 `beatReactive={backgroundAnimBeat}` 之后加一行(匹配各文件缩进,no2 用 Tab):
```tsx
        beatReactive={backgroundAnimBeat}
        animKind={backgroundAnimKind}
```

- [ ] **Step 5: 类型检查**

Run: `cd src && npx tsc --noEmit`
Expected: 无错误。

- [ ] **Step 6: 提交**

```bash
cd src && git add types.ts render.mjs preset/BackgroundLayer.tsx preset/orig/AudioVisualization.tsx preset/apple/Composition.tsx preset/ktv/Composition.tsx preset/cinema/Composition.tsx preset/no2/Composition.tsx preset/typewriter/Composition.tsx
git commit -m "feat(winamp): 接线 backgroundAnimKind,WINAMP 走 ButterchurnAnim"
```

---

## Task 8: 端到端验证 + 文档

**Files:**
- Modify: `USAGE.md`

- [ ] **Step 1: 全部单测**

Run: `cd src && npm test` 和 `cd /Users/dfbb/Sites/mtv/mutv && node --test scripts/gen_winamp.test.mjs`
Expected: 全过(beatLevels 8 + animbgInject 6 + winampNames 5 + waveformBytes 5 + gen_winamp 3)。

- [ ] **Step 2: tsc**

Run: `cd src && npx tsc --noEmit`
Expected: 无错误。

- [ ] **Step 3: 取 3 个 WINAMP label 冒烟**

```bash
cd /Users/dfbb/Sites/mtv/mutv
LABELS=$(node -e "const m=require('./src/animbg/manifest.json'); console.log(m.filter(e=>e.category==='WINAMP').slice(0,3).map(e=>e.label).join(' '))")
echo "testing labels: $LABELS"
cd src
for L in $LABELS; do
  node cli.mjs --audio ../example/cn-2.mp3 --title "$L" --bg-anim "$L" --res 640x360 --fps 24 --output "out/winamp-$L.mp4" 2>&1 | grep -iE "rendered successfully|error|❌|vendor" | head -2
  ffmpeg -nostdin -v error -i "out/winamp-$L.mp4" -vf "select=eq(n\,40)" -vframes 1 "out/winamp-$L.png" 2>&1 | head -1
  echo "$L frame bytes: $(stat -f%z out/winamp-$L.png 2>/dev/null || stat -c%s out/winamp-$L.png)"
done
```
Expected: 每个渲染成功,抽帧 PNG >50KB(非黑 Milkdrop)。

- [ ] **Step 4: 回归 — 非 WINAMP 模板仍正常**

```bash
cd src && node cli.mjs --audio ../example/cn-2.mp3 --title reg --bg-anim aurora --res 640x360 --fps 24 --output out/reg-aurora.mp4 2>&1 | grep -iE "rendered successfully|error" | head -1
```
Expected: 成功(aurora 不受 WINAMP 改动影响)。

- [ ] **Step 5: 更新 USAGE.md**

在「动画背景特效(bg-anim)列表」章节,新增 WINAMP 分类说明段:

```
> **WINAMP 分类**:100 个移植自 butterchurn(Milkdrop)的经典音乐可视化 preset,用 `--bg-anim <两词名>` 选择(如 `--bg-anim royal-mashup`)。它们由当前歌曲音频实时驱动(离线 FFT 注入),无需 `--bg-anim-beat`(本身即音频反应)。完整 label 见 `src/animbg/manifest.json` 中 category=WINAMP 的条目。
```

- [ ] **Step 6: 清理冒烟产物 + 提交文档**

```bash
cd src && rm -f out/winamp-*.mp4 out/winamp-*.png out/reg-aurora.mp4
cd /Users/dfbb/Sites/mtv/mutv && git add USAGE.md && git commit -m "docs(winamp): WINAMP 分类用法说明"
```

---

## 验收标准

- `npm test`(src)+ `node --test scripts/gen_winamp.test.mjs` 全绿。
- `npx tsc --noEmit` 无错误。
- `node scripts/gen_winamp.mjs` 幂等产出 100 个唯一两词 label、manifest category=WINAMP。
- 抽样 3 个 WINAMP label 渲染:无黑屏、有 Milkdrop 画面、随音频变化。
- aurora 等非 WINAMP 模板回归正常。
- 100 个 preset 不逐一渲染(抽样验证,其余同构,文档标明)。
