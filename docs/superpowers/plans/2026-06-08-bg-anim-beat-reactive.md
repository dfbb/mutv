# bg-anim 节拍反应 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 72 个 `--bg-anim` 动画背景跟随音乐节拍反应,复刻 butterchurn 的频段归一化机制(bass/mid/treb 相对长时均值),无需逐个编辑模板 HTML。

**Architecture:** 一个共享 React 组件 `BeatReactiveAnim` 替换 `BackgroundLayer` 的 anim 分支。逐帧用 `@remotion/media-utils` 的 `visualizeAudio` 取频谱,经纯 JS 模块 `beatLevels.mjs` 做 butterchurn 式归一化(切三段 + EMA 长时均值),输出 ~1.0 基线的 {bass,mid,treb} 与积分虚拟时间。两条驱动通道:① React 外层对 iframe 施加 `transform: scale` 脉冲 + `brightness/saturate` 滤镜(对所有模板生效);② 注入脚本覆盖 iframe 内 `performance.now`/`Date.now` 为节拍加速的虚拟时间(仅对基于时间积分的模板生效)。

**Tech Stack:** Remotion 4.x、`@remotion/media-utils`、React 18、纯 JS(`.mjs`)+ Node 内置 `node:test` 测试(零新依赖)、TypeScript(`.tsx` 组件)。

---

## 文件结构

| 文件 | 职责 | 新建/修改 |
| --- | --- | --- |
| `src/lib/beatLevels.mjs` | 纯函数:`bandSums`(频谱→三段求和)、`createBeatState`(butterchurn longAvg 归一化)、`beatStyle`(levels→CSS/时间参数)。零 Remotion 依赖,可单测 | 新建 |
| `src/lib/beatLevels.test.mjs` | `node:test` 单测 | 新建 |
| `src/animbgInject.mjs` | 增加 `injectBeatClock(html)` / `BEAT_MARK`:注入脚本覆盖 iframe 内 `performance.now`/`Date.now` 为节拍虚拟时间,暴露 `window.__beatTick` | 修改 |
| `src/animbgInject.test.mjs` | `node:test` 单测(注入幂等、marker) | 新建 |
| `src/preset/BeatReactiveAnim.tsx` | React 组件:逐帧取频谱→归一化→CSS 通道 + 时钟通道(delayRender) | 新建 |
| `src/preset/BackgroundLayer.tsx` | 新增 `audioFileName?`/`beatReactive?` props,anim 分支按 `beatReactive` 选 `BeatReactiveAnim` 或原 `<IFrame>` | 修改 |
| `src/types.ts` | `MVInputProps` 增加 `backgroundAnimBeat: boolean` + `defaultProps` | 修改 |
| `src/preset/{orig/AudioVisualization,apple/Composition,ktv/Composition,cinema/Composition,no2/Composition,typewriter/Composition}.tsx` | 给 `<BackgroundLayer>` 传 `audioFileName` + `beatReactive` | 修改(6 处) |
| `src/render.mjs` | 解析 `--bg-anim-beat`(默认开),按需 `injectBeatClock`,写入 `backgroundAnimBeat` prop | 修改 |
| `src/cli.mjs` | 透传 `--bg-anim-beat` / `--no-bg-anim-beat` 给 render.mjs | 修改 |
| `src/package.json` | 增加 `"test": "node --test"` 脚本 | 修改 |
| `USAGE.md` | 文档化 `--bg-anim-beat` 与脆弱边界 | 修改 |

---

## Task 1: beatLevels.mjs 纯函数 + 单测

复刻 butterchurn 的频段归一化(`3rd/butterchurn/src/audio/audioLevels.js`):切 bass/mid/treb 三段求和,各除以一个 EMA 长时均值得到 ~1.0 基线的相对值。纯 JS,不依赖 Remotion,可用 `node:test` 单测。

**Files:**
- Create: `src/lib/beatLevels.mjs`
- Create: `src/lib/beatLevels.test.mjs`
- Modify: `src/package.json`

- [ ] **Step 1: 加 test 脚本**

修改 `src/package.json` 的 `scripts`,在 `"render"` 行后加一行:

```json
    "render": "node cli.mjs",
    "test": "node --test"
```

- [ ] **Step 2: 写失败测试**

Create `src/lib/beatLevels.test.mjs`:

```js
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bandSums, createBeatState, beatStyle} from './beatLevels.mjs';

test('bandSums: 仅低频有能量时 bass>0、mid/treb=0', () => {
  // sampleRate 44100, nyquist 22050; 512 bins → binHz ≈ 43.07
  // 只在 ~100Hz(bin 2)放能量,落在 bass(20-320Hz)
  const spectrum = new Array(512).fill(0);
  spectrum[2] = 1;
  const [bass, mid, treb] = bandSums(spectrum, 44100);
  assert.ok(bass > 0, 'bass 应>0');
  assert.equal(mid, 0);
  assert.equal(treb, 0);
});

test('bandSums: 高频能量落入 treb', () => {
  const spectrum = new Array(512).fill(0);
  // ~8000Hz → bin ≈ 8000/43.07 ≈ 185,落在 treb(2800-11025Hz)
  spectrum[185] = 1;
  const [bass, mid, treb] = bandSums(spectrum, 44100);
  assert.equal(bass, 0);
  assert.equal(mid, 0);
  assert.ok(treb > 0);
});

test('createBeatState: 恒定输入收敛到 ~1.0', () => {
  const s = createBeatState(24);
  let last;
  for (let f = 0; f < 300; f++) last = s.step([5, 5, 5], f);
  assert.ok(Math.abs(last.bass - 1) < 0.05, `bass≈1, got ${last.bass}`);
});

test('createBeatState: 突增能量使 val 冲高>1', () => {
  const s = createBeatState(24);
  for (let f = 0; f < 200; f++) s.step([2, 2, 2], f); // 建立基线
  const spike = s.step([20, 2, 2], 200);
  assert.ok(spike.bass > 2, `bass 应冲高, got ${spike.bass}`);
});

test('createBeatState: 确定性(同序列→同结果)', () => {
  const seq = [[3, 1, 1], [9, 2, 1], [4, 5, 2], [1, 1, 8]];
  const a = createBeatState(24);
  const b = createBeatState(24);
  for (let f = 0; f < seq.length; f++) {
    assert.deepEqual(a.step(seq[f], f), b.step(seq[f], f));
  }
});

test('beatStyle: 静音基线为中性', () => {
  const st = beatStyle({bass: 1, mid: 1, treb: 1});
  assert.equal(st.scale, 1);
  assert.equal(st.brightness, 1);
  assert.equal(st.saturate, 1);
  assert.equal(st.timeGain, 1);
});

test('beatStyle: clamp 上限', () => {
  const st = beatStyle({bass: 10, mid: 10, treb: 10}); // c clamps at 2
  assert.ok(Math.abs(st.scale - 1.08) < 1e-9);
  assert.ok(Math.abs(st.brightness - 1.12) < 1e-9);
  assert.ok(Math.abs(st.saturate - 1.2) < 1e-9);
  assert.ok(Math.abs(st.timeGain - 2.2) < 1e-9);
});
```

- [ ] **Step 3: 运行测试,确认失败**

Run: `cd src && node --test lib/beatLevels.test.mjs`
Expected: FAIL — `Cannot find module './beatLevels.mjs'`

- [ ] **Step 4: 写实现**

Create `src/lib/beatLevels.mjs`:

```js
/**
 * beatLevels.mjs — butterchurn 式音频频段归一化(复刻 3rd/butterchurn 的 audioLevels.js)。
 *
 * 把频谱切成 bass/mid/treb 三段求和,各除以一个 EMA 长时均值(longAvg),得到
 * 不随整体音量漂移的"此刻比平时响多少"相对值(基线 ~1.0,鼓点时冲高)。
 * 纯函数,无 Remotion / DOM 依赖,可单测。
 */

// 频段(Hz),取自 butterchurn:bass 20-320, mid 320-2800, treb 2800-11025
export const BANDS = [
  [20, 320],
  [320, 2800],
  [2800, 11025],
];

/**
 * 对线性频谱(spectrum[i] 为第 i 个 bin 的幅度,频率 0..nyquist 线性分布)
 * 按 Hz 频段求和。返回 [bassSum, midSum, trebSum]。
 */
export function bandSums(spectrum, sampleRate) {
  const nyquist = sampleRate / 2;
  const binHz = nyquist / spectrum.length;
  return BANDS.map(([lo, hi]) => {
    const start = Math.max(0, Math.floor(lo / binHz));
    const stop = Math.min(spectrum.length, Math.ceil(hi / binHz));
    let sum = 0;
    for (let i = start; i < stop; i++) sum += spectrum[i];
    return sum;
  });
}

// butterchurn: rate ** (baseFPS / FPS),把 30fps 调成的 EMA 速率适配到当前 fps。
function adjustRate(rate, fps) {
  return rate ** (30.0 / fps);
}

/**
 * 创建一个有状态的归一化器,复刻 butterchurn 的 avg/longAvg 递推。
 * 必须从 frame 0 起、按帧顺序喂入(组件侧用缓存保证),以确保确定性。
 *
 * @param {number} fps
 * @returns {{step(imm: number[], frame: number): {bass:number,mid:number,treb:number}}}
 */
export function createBeatState(fps) {
  const avg = [1, 1, 1];
  const longAvg = [1, 1, 1];
  return {
    step(imm, frame) {
      const out = [0, 0, 0];
      for (let i = 0; i < 3; i++) {
        let rateAvg = imm[i] > avg[i] ? 0.2 : 0.5;
        rateAvg = adjustRate(rateAvg, fps);
        avg[i] = avg[i] * rateAvg + imm[i] * (1 - rateAvg);

        let rateLong = frame < 50 ? 0.9 : 0.992;
        rateLong = adjustRate(rateLong, fps);
        longAvg[i] = longAvg[i] * rateLong + imm[i] * (1 - rateLong);

        out[i] = longAvg[i] < 0.001 ? 1.0 : imm[i] / longAvg[i];
      }
      return {bass: out[0], mid: out[1], treb: out[2]};
    },
  };
}

/**
 * 把相对 levels(基线 1.0)映射成 CSS / 时间驱动参数。
 * clamp 到 [0,2] 防极端帧炸裂。系数保守(见设计文档)。
 */
export function beatStyle({bass, mid, treb}) {
  const c = (x) => Math.max(0, Math.min(2, x - 1));
  return {
    scale: 1 + 0.04 * c(bass), // 低频缩放脉冲
    brightness: 1 + 0.06 * c(mid), // 亮度闪动
    saturate: 1 + 0.1 * c(treb), // 饱和闪动
    timeGain: 1 + 0.6 * c(bass), // 时钟加速增益
  };
}
```

- [ ] **Step 5: 运行测试,确认通过**

Run: `cd src && node --test lib/beatLevels.test.mjs`
Expected: PASS — 7 tests pass

- [ ] **Step 6: 提交**

```bash
cd src && git add package.json lib/beatLevels.mjs lib/beatLevels.test.mjs
git commit -m "feat(beat): butterchurn 式频段归一化纯函数 + 单测"
```

---

## Task 2: 时钟注入脚本 injectBeatClock + 单测

扩展 `src/animbgInject.mjs`,加一个把"节拍虚拟时间"注入 iframe 的脚本:覆盖 `performance.now()`/`Date.now()`,当 `window.__beatVirtualTimeMs` 被设置时返回它,否则透传原值;并暴露 `window.__beatTick(virtualTimeMs)` 供 React 父窗每帧调用。基于时间积分的模板(canvas rAF、VANTA、p5)会随之节拍加速。

**Files:**
- Modify: `src/animbgInject.mjs`
- Create: `src/animbgInject.test.mjs`

- [ ] **Step 1: 写失败测试**

Create `src/animbgInject.test.mjs`:

```js
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {injectBeatClock, BEAT_MARK} from './animbgInject.mjs';

const HTML = '<html><head></head><body><canvas></canvas></body></html>';

test('injectBeatClock: 注入到 </body> 前', () => {
  const out = injectBeatClock(HTML);
  assert.ok(out.includes(BEAT_MARK), '应含 marker');
  assert.ok(out.includes('__beatTick'), '应定义 __beatTick');
  assert.ok(out.indexOf(BEAT_MARK) < out.indexOf('</body>'), '应在 </body> 之前');
});

test('injectBeatClock: 幂等(不重复注入)', () => {
  const once = injectBeatClock(HTML);
  const twice = injectBeatClock(once);
  assert.equal(once, twice);
});

test('injectBeatClock: 无 </body> 时追加到末尾', () => {
  const out = injectBeatClock('<div>x</div>');
  assert.ok(out.includes(BEAT_MARK));
});
```

- [ ] **Step 2: 运行测试,确认失败**

Run: `cd src && node --test animbgInject.test.mjs`
Expected: FAIL — `injectBeatClock is not exported` / undefined

- [ ] **Step 3: 写实现**

在 `src/animbgInject.mjs` 末尾(`injectVirtualMouse` 之后)追加:

```js

const BEAT_MARK = 'beat-clock (auto-injected)';
export {BEAT_MARK};

// 注入脚本:覆盖 iframe 内的 performance.now/Date.now 返回节拍虚拟时间。
// React 父窗每帧调用 window.__beatTick(vtMs) 设置当前虚拟时间;未设置时
// (__beatVirtualTimeMs===null)透传原始时钟,保证模板初始化阶段正常。
// 全程 try/catch:任何环境覆盖失败都不影响模板原本运行。
const BEAT_SNIPPET = `
<script>
/* ${BEAT_MARK}: 把 performance.now/Date.now 替换为父窗喂入的节拍虚拟时间,
   使基于时间积分的动画(rAF/VANTA/p5)在鼓点时加速。基于帧计数的动画不受影响。 */
(function(){
  try {
    window.__beatVirtualTimeMs = null;
    window.__beatTick = function(vtMs){ window.__beatVirtualTimeMs = vtMs; };
    var realPerfNow = (window.performance && performance.now)
      ? performance.now.bind(performance) : null;
    if (realPerfNow) {
      performance.now = function(){
        var v = window.__beatVirtualTimeMs;
        return (v === null || v === undefined) ? realPerfNow() : v;
      };
    }
    var realDateNow = Date.now.bind(Date);
    var epoch0 = realDateNow();
    Date.now = function(){
      var v = window.__beatVirtualTimeMs;
      return (v === null || v === undefined) ? realDateNow() : (epoch0 + v);
    };
  } catch (e) { /* 覆盖失败则放弃时钟通道,不影响模板 */ }
})();
</script>
`;

/** 把节拍时钟脚本注入 html(幂等)。 */
export function injectBeatClock(html) {
  if (html.indexOf(BEAT_MARK) !== -1) return html;
  const idx = html.toLowerCase().lastIndexOf('</body>');
  if (idx !== -1) return html.slice(0, idx) + BEAT_SNIPPET + html.slice(idx);
  return html + BEAT_SNIPPET;
}
```

- [ ] **Step 4: 运行测试,确认通过**

Run: `cd src && node --test animbgInject.test.mjs`
Expected: PASS — 3 tests pass

- [ ] **Step 5: 提交**

```bash
cd src && git add animbgInject.mjs animbgInject.test.mjs
git commit -m "feat(beat): 注入节拍虚拟时钟到 anim iframe + 单测"
```

---

## Task 3: BeatReactiveAnim 组件

React 组件,逐帧:用 `visualizeAudio` 取频谱 → `bandSums` + `createBeatState` 归一化 → `beatStyle` 算 CSS;同时积分虚拟时间通过 `delayRender` + `__beatTick` 喂进 iframe。用模块级缓存(按 `audioData.resultId`)保证从 frame 0 起的递推确定性且 O(n)。

**Files:**
- Create: `src/preset/BeatReactiveAnim.tsx`

- [ ] **Step 1: 验证 visualizeAudio 的 bin→频率映射**

Run: `cd src && node -e "import('fs').then(fs=>process.stdout.write(fs.readFileSync('node_modules/@remotion/media-utils/dist/fft/get-visualization.js','utf8').slice(0,2000)))"`
Expected: 看 `getVisualization` 如何把 FFT 结果映射成输出数组。

判定:
- 若输出 bin 与频率近似**线性**(bin i ≈ i/N·nyquist)→ `bandSums` 的线性假设成立,无需改。
- 若为对数/其它分布 → 在 Task 1 的 `bandSums` 里改 `binHz` 映射为对应公式,并补一条单测;然后回到本任务。

(此步只读不改,记录结论到提交信息。)

- [ ] **Step 2: 写组件**

Create `src/preset/BeatReactiveAnim.tsx`:

```tsx
import React from 'react';
import {
  AbsoluteFill,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  delayRender,
  continueRender,
} from 'remotion';
import {useAudioData, visualizeAudio} from '@remotion/media-utils';
import {bandSums, createBeatState, beatStyle} from '../lib/beatLevels.mjs';

const NUM_SAMPLES = 512; // 频谱 bin 数(频率分辨率)

type Levels = {bass: number; mid: number; treb: number};
type FrameData = {levels: Levels; virtualTimeMs: number};

// 模块级缓存:按 audioData.resultId 保存从 frame 0 起的递推结果。
// 确定性来源:每个渲染上下文都从 frame 0 重建同一递推,与渲染顺序无关。
type Cache = {
  state: ReturnType<typeof createBeatState>;
  frames: FrameData[]; // index === frame
  vtMs: number; // 累积虚拟时间
};
const caches = new Map<string, Cache>();

function getFrameData(
  audioData: NonNullable<ReturnType<typeof useAudioData>>,
  frame: number,
  fps: number
): FrameData {
  let cache = caches.get(audioData.resultId);
  if (!cache) {
    cache = {state: createBeatState(fps), frames: [], vtMs: 0};
    caches.set(audioData.resultId, cache);
  }
  for (let f = cache.frames.length; f <= frame; f++) {
    const spectrum = visualizeAudio({
      fps,
      frame: f,
      audioData,
      numberOfSamples: NUM_SAMPLES,
      optimizeFor: 'speed',
    });
    const imm = bandSums(spectrum, audioData.sampleRate);
    const levels = cache.state.step(imm, f);
    const {timeGain} = beatStyle(levels);
    cache.vtMs += (1000 / fps) * timeGain;
    cache.frames[f] = {levels, virtualTimeMs: cache.vtMs};
  }
  return cache.frames[frame];
}

/**
 * 节拍反应动画背景。两条通道:
 *  ① CSS:对 iframe 容器施加 scale 脉冲 + brightness/saturate 滤镜(所有模板生效)。
 *  ② 时钟:每帧把节拍虚拟时间喂进 iframe(仅基于时间积分的模板生效)。
 * 音频未就绪 / iframe 未注入时静默降级,绝不黑屏或挂死。
 */
export const BeatReactiveAnim: React.FC<{src: string}> = ({src}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  const audioSrc = src; // 仅占位,真实 audio 见下方 prop
  void audioSrc;

  return null as never; // 占位,Step 3 替换
};
```

(此步先放占位骨架,Step 3 写完整版——保持步骤 bite-sized。)

- [ ] **Step 3: 写完整组件(替换 Step 2 的占位)**

把 `src/preset/BeatReactiveAnim.tsx` 整个文件替换为:

```tsx
import React from 'react';
import {
  AbsoluteFill,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  delayRender,
  continueRender,
} from 'remotion';
import {useAudioData, visualizeAudio} from '@remotion/media-utils';
import {bandSums, createBeatState, beatStyle} from '../lib/beatLevels.mjs';

const NUM_SAMPLES = 512;

type Levels = {bass: number; mid: number; treb: number};
type FrameData = {levels: Levels; virtualTimeMs: number};
type Cache = {
  state: ReturnType<typeof createBeatState>;
  frames: FrameData[];
  vtMs: number;
};
const caches = new Map<string, Cache>();

function getFrameData(
  audioData: NonNullable<ReturnType<typeof useAudioData>>,
  frame: number,
  fps: number
): FrameData {
  let cache = caches.get(audioData.resultId);
  if (!cache) {
    cache = {state: createBeatState(fps), frames: [], vtMs: 0};
    caches.set(audioData.resultId, cache);
  }
  for (let f = cache.frames.length; f <= frame; f++) {
    const spectrum = visualizeAudio({
      fps,
      frame: f,
      audioData,
      numberOfSamples: NUM_SAMPLES,
      optimizeFor: 'speed',
    });
    const imm = bandSums(spectrum, audioData.sampleRate);
    const levels = cache.state.step(imm, f);
    const {timeGain} = beatStyle(levels);
    cache.vtMs += (1000 / fps) * timeGain;
    cache.frames[f] = {levels, virtualTimeMs: cache.vtMs};
  }
  return cache.frames[frame];
}

/**
 * 节拍反应动画背景。
 * @param src     anim HTML 文件名(public/)或 http URL
 * @param audioSrc 音频文件名(public/)或 http URL,用于取频谱
 */
export const BeatReactiveAnim: React.FC<{src: string; audioSrc: string}> = ({
  src,
  audioSrc,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const audioData = useAudioData(audioSrc);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  // 音频未就绪:中性基线(scale=1 等),iframe 照常显示,不阻塞。
  const data: FrameData = audioData
    ? getFrameData(audioData, frame, fps)
    : {levels: {bass: 1, mid: 1, treb: 1}, virtualTimeMs: (frame / fps) * 1000};

  const st = beatStyle(data.levels);

  // 时钟通道:每帧把虚拟时间喂进 iframe,等一帧绘制后再放行截图。
  React.useEffect(() => {
    const handle = delayRender(`beat frame ${frame}`);
    let cancelled = false;
    let raf = 0;
    const tick = () => {
      if (cancelled) return;
      const win = iframeRef.current?.contentWindow as
        | (Window & {__beatTick?: (ms: number) => void})
        | undefined;
      if (win && typeof win.__beatTick === 'function') {
        win.__beatTick(data.virtualTimeMs);
        raf = requestAnimationFrame(() => {
          if (!cancelled) continueRender(handle);
        });
        return;
      }
      // iframe 未注入 __beatTick(未加载完/模板异常):跳过时钟通道,直接放行。
      continueRender(handle);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      continueRender(handle);
    };
  }, [frame, data.virtualTimeMs]);

  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <iframe
        ref={iframeRef}
        src={src}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          transformOrigin: 'center center',
          transform: `scale(${st.scale})`,
          filter: `brightness(${st.brightness}) saturate(${st.saturate})`,
          willChange: 'transform, filter',
        }}
      />
    </AbsoluteFill>
  );
};
```

- [ ] **Step 4: 类型检查通过**

Run: `cd src && npx tsc --noEmit`
Expected: 无错误(`.mjs` 纯函数允许 JS 导入;若报找不到类型,确认 `tsconfig.json` 的 `allowJs`/`checkJs` 设置,见下一步)。

- [ ] **Step 5: 若 tsc 报无法解析 .mjs 导入**

Read `src/tsconfig.json`;若 `compilerOptions` 缺 `"allowJs": true`,加上它(仅当 Step 4 失败时)。重跑 `npx tsc --noEmit` 直到通过。

- [ ] **Step 6: 提交**

```bash
cd src && git add preset/BeatReactiveAnim.tsx tsconfig.json
git commit -m "feat(beat): BeatReactiveAnim 组件(CSS 脉冲 + 时钟通道)"
```

---

## Task 4: BackgroundLayer 接线 + types

给 `BackgroundLayer` 增加 `audioFileName?` / `beatReactive?` props,anim 分支据此在 `BeatReactiveAnim` 与原 `<IFrame>` 间二选一。`MVInputProps` 增加 `backgroundAnimBeat`。

**Files:**
- Modify: `src/types.ts`
- Modify: `src/preset/BackgroundLayer.tsx`

- [ ] **Step 1: types.ts 加字段**

在 `src/types.ts` 的 `MVInputProps` 里,`backgroundCarousel` 之后加:

```ts
  /** Carousel HTML filename in public/ (multi-image dir slideshow). Loaded via IFrame src. */
  backgroundCarousel: string;
  /** Whether the animated background reacts to the music beat (butterchurn-style). */
  backgroundAnimBeat: boolean;
```

并在 `defaultProps` 的 `backgroundCarousel: '',` 之后加:

```ts
  backgroundCarousel: '',
  backgroundAnimBeat: true,
```

- [ ] **Step 2: BackgroundLayer 加 props + 分支**

在 `src/preset/BackgroundLayer.tsx`:

(a) 顶部加导入(在现有 import 之后):

```tsx
import {BeatReactiveAnim} from './BeatReactiveAnim';
```

(b) props 类型里,`backgroundAnim?: string;` 之后加两个可选 prop:

```tsx
  backgroundAnim?: string;
  /** Audio filename in public/ (or http URL), needed for beat-reactive anim. */
  audioFileName?: string;
  /** When true and backgroundAnim is set, drive it with the music beat. */
  beatReactive?: boolean;
```

(c) 解构参数同步加 `audioFileName, beatReactive,`:

```tsx
}> = ({backgroundVideo, backgroundCarousel, backgroundImage, backgroundAnim, audioFileName, beatReactive, fallbackGradient, overlay}) => {
```

(d) 替换现有 anim 分支:

```tsx
  if (backgroundAnim) {
    if (beatReactive && audioFileName) {
      const audioSrc = audioFileName.startsWith('http')
        ? audioFileName
        : staticFile(audioFileName);
      return <BeatReactiveAnim src={toSrc(backgroundAnim)} audioSrc={audioSrc} />;
    }
    return (
      <AbsoluteFill>
        <IFrame src={toSrc(backgroundAnim)} style={{width: '100%', height: '100%', border: 'none'}} />
      </AbsoluteFill>
    );
  }
```

- [ ] **Step 3: 类型检查**

Run: `cd src && npx tsc --noEmit`
Expected: 无错误。

- [ ] **Step 4: 提交**

```bash
cd src && git add types.ts preset/BackgroundLayer.tsx
git commit -m "feat(beat): BackgroundLayer 接入 beatReactive 分支 + backgroundAnimBeat prop"
```

---

## Task 5: 6 个 preset 透传 props

每个 preset 的 Composition 给 `<BackgroundLayer>` 传 `audioFileName` 与 `beatReactive`。这 6 个组件都已从 props 解构出 `audioFileName`(用于 `<Audio>`),只需新增传参 + 从 props 取 `backgroundAnimBeat`。

**Files:**
- Modify: `src/preset/orig/AudioVisualization.tsx`
- Modify: `src/preset/apple/Composition.tsx`
- Modify: `src/preset/ktv/Composition.tsx`
- Modify: `src/preset/cinema/Composition.tsx`
- Modify: `src/preset/no2/Composition.tsx`
- Modify: `src/preset/typewriter/Composition.tsx`

- [ ] **Step 1: orig/AudioVisualization.tsx**

(a) 在解构 props 处(现有 `backgroundCarousel,` 附近)加 `backgroundAnimBeat,`。
(b) 给 `<BackgroundLayer ...>` 加两行 prop:

```tsx
        backgroundAnim={backgroundAnim}
        backgroundCarousel={backgroundCarousel}
        audioFileName={audioFileName}
        beatReactive={backgroundAnimBeat}
```

- [ ] **Step 2: apple/Composition.tsx**

同 Step 1:解构加 `backgroundAnimBeat,`;`<BackgroundLayer>` 的 `backgroundCarousel={backgroundCarousel}` 后加:

```tsx
        backgroundCarousel={backgroundCarousel}
        audioFileName={audioFileName}
        beatReactive={backgroundAnimBeat}
```

- [ ] **Step 3: ktv/Composition.tsx**

同上(注意该文件用空格缩进对齐):解构加 `backgroundAnimBeat,`;`backgroundCarousel={backgroundCarousel}` 后加:

```tsx
        backgroundCarousel={backgroundCarousel}
        audioFileName={audioFileName}
        beatReactive={backgroundAnimBeat}
```

- [ ] **Step 4: cinema/Composition.tsx**

解构加 `backgroundAnimBeat,`;`backgroundCarousel={backgroundCarousel}` 后加:

```tsx
        backgroundCarousel={backgroundCarousel}
        audioFileName={audioFileName}
        beatReactive={backgroundAnimBeat}
```

- [ ] **Step 5: no2/Composition.tsx**

该文件用 Tab 缩进。解构加 `backgroundAnimBeat,`;`backgroundCarousel={backgroundCarousel}` 后加(用 Tab 对齐):

```tsx
				backgroundCarousel={backgroundCarousel}
				audioFileName={audioFileName}
				beatReactive={backgroundAnimBeat}
```

- [ ] **Step 6: typewriter/Composition.tsx**

解构加 `backgroundAnimBeat,`;`backgroundCarousel={backgroundCarousel}` 后加:

```tsx
        backgroundCarousel={backgroundCarousel}
        audioFileName={audioFileName}
        beatReactive={backgroundAnimBeat}
```

- [ ] **Step 7: 类型检查**

Run: `cd src && npx tsc --noEmit`
Expected: 无错误(每个 Composition 的 props 类型为 `MVInputProps`,已含 `backgroundAnimBeat` 与 `audioFileName`)。

- [ ] **Step 8: 提交**

```bash
cd src && git add preset/orig/AudioVisualization.tsx preset/apple/Composition.tsx preset/ktv/Composition.tsx preset/cinema/Composition.tsx preset/no2/Composition.tsx preset/typewriter/Composition.tsx
git commit -m "feat(beat): 6 个 preset 透传 audioFileName/beatReactive 给 BackgroundLayer"
```

---

## Task 6: CLI flag --bg-anim-beat + 注入接线

`render.mjs` 解析 `--bg-anim-beat`(默认开,`--no-bg-anim-beat` 关),开启时对 anim HTML 调 `injectBeatClock`,并写入 `backgroundAnimBeat` prop;`cli.mjs` 透传该 flag。

**Files:**
- Modify: `src/render.mjs`
- Modify: `src/cli.mjs`

- [ ] **Step 1: render.mjs 解析 flag**

在 `src/render.mjs` 的 `parseArgs` 里把 `--no-bg-anim-beat` 视为布尔(它无值)。修改 `booleanFlags`:

```js
  const booleanFlags = new Set(['html', 'no-bg-anim-beat']);
```

在 `args` 解析之后(`const args = parseArgs(process.argv);` 之后)计算开关:

```js
const args = parseArgs(process.argv);

// 节拍反应默认开;--no-bg-anim-beat 关闭;--bg-anim-beat=false 也关闭。
const beatReactive =
  !args['no-bg-anim-beat'] &&
  String(args['bg-anim-beat'] ?? 'true').toLowerCase() !== 'false';
```

- [ ] **Step 2: render.mjs 导入 injectBeatClock**

把现有 import 改为(`src/render.mjs` 第 35 行附近):

```js
import {injectVirtualMouse, needsVirtualMouse, injectBeatClock} from './animbgInject.mjs';
```

- [ ] **Step 3: render.mjs 注入时钟**

在 bg-anim 分支里,`writeFileSync(resolve(pubDir, animPublicName), animHtml);` 之前,虚拟鼠标注入之后,加:

```js
  if (needsVirtualMouse(animHtml)) {
    animHtml = injectVirtualMouse(animHtml);
    console.log('Injected virtual mouse (effect reacts to cursor movement)');
  }
  if (beatReactive) {
    animHtml = injectBeatClock(animHtml);
    console.log('Injected beat clock (animation reacts to music beat)');
  }
  writeFileSync(resolve(pubDir, animPublicName), animHtml);
```

- [ ] **Step 4: render.mjs 写入 prop**

在 `inputProps` 对象里,`backgroundCarousel,` 之后加:

```js
  backgroundCarousel,
  backgroundAnimBeat: beatReactive,
```

- [ ] **Step 5: cli.mjs 透传 flag**

在 `src/cli.mjs`:

(a) `booleanFlags` 加两个名字:

```js
const booleanFlags = new Set(['html', 'no-bg-anim-beat']);
```

(b) 在构建 `nodeArgs` 处,`if (opts['bg-anim']) ...` 之后加:

```js
if (opts['bg-anim']) nodeArgs.push('--bg-anim', opts['bg-anim']);
if (opts['no-bg-anim-beat']) nodeArgs.push('--no-bg-anim-beat');
```

(c) 头部文档块的 `--bg-anim` 行下方加一行说明:

```
 *   --bg-anim     Animated background effect label (see src/animbg/), or 'random' (mutually exclusive)
 *   --no-bg-anim-beat  Disable beat-reactive animation for --bg-anim (default: enabled)
```

- [ ] **Step 6: 烟测 flag 解析(不渲染)**

Run: `cd src && node -e "process.argv=['n','n','--no-bg-anim-beat']; const f=new Set(['html','no-bg-anim-beat']); const a={}; for(let i=2;i<process.argv.length;i++){const k=process.argv[i]; if(k.startsWith('--')){const n=k.slice(2); if(f.has(n))a[n]=true; else {a[n]=process.argv[i+1];i++;}}} console.log(JSON.stringify(a)); const beat=!a['no-bg-anim-beat'] && String(a['bg-anim-beat']??'true').toLowerCase()!=='false'; console.log('beat=',beat)"`
Expected: `{"no-bg-anim-beat":true}` 且 `beat= false`

- [ ] **Step 7: 提交**

```bash
cd src && git add render.mjs cli.mjs
git commit -m "feat(beat): --bg-anim-beat flag(默认开)+ 注入接线"
```

---

## Task 7: 端到端验证 + 文档

用真实素材渲一小段确认无黑屏、有节拍反应,关开关回归,更新 USAGE.md。

**Files:**
- Modify: `USAGE.md`

- [ ] **Step 1: 跑全部单测**

Run: `cd src && npm test`
Expected: PASS — beatLevels(7) + animbgInject(3) 全过。

- [ ] **Step 2: 渲染冒烟 — 时间型模板(aurora)**

Run:
```bash
cd src && node cli.mjs --audio ../example/cn-2.mp3 --title 测试 --bg-anim aurora --res 640x360 --fps 24 --output out/beat-aurora.mp4
```
Expected: 成功输出 `out/beat-aurora.mp4`,日志含 `Injected beat clock`。人工抽帧确认:无黑屏、画面随鼓点有 scale 脉冲。
(`cli.mjs` 不解析 `--duration`,故用整段较短音频 `cn-2.mp3`;核心是渲染成功且有 beat 日志。)

- [ ] **Step 3: 渲染冒烟 — VANTA 模板(waves)**

Run:
```bash
cd src && node cli.mjs --audio ../example/cn-1.mp3 --title 测试 --bg-anim waves --res 640x360 --fps 24 --output out/beat-waves.mp4
```
Expected: 成功输出,日志含 `Injected beat clock`。确认 WebGL 模板未黑屏。

- [ ] **Step 4: 关开关回归**

Run:
```bash
cd src && node cli.mjs --audio ../example/cn-1.mp3 --title 测试 --bg-anim aurora --no-bg-anim-beat --res 640x360 --fps 24 --output out/nobeat-aurora.mp4
```
Expected: 成功输出,日志**不含** `Injected beat clock`,行为同旧版静态 anim。

- [ ] **Step 5: 更新 USAGE.md**

在 `--bg-anim` 表格行下方新增一行:

```
| `--no-bg-anim-beat` | 关闭 | 关闭 `--bg-anim` 的节拍反应。默认开启:动画背景会随音乐低频"呼吸/放大"、随中高频闪动(复刻 butterchurn 频段归一化)。基于时间积分的模板(canvas/VANTA/p5)还会在鼓点时动画加速;纯帧计数的模板只有缩放/滤镜脉冲。 |
```

并在「动画背景特效(bg-anim)列表」章节开头加一句说明:

```
> 默认所有 bg-anim 均带节拍反应(随音乐起伏)。如需静态背景,加 `--no-bg-anim-beat`。
```

- [ ] **Step 6: 提交**

```bash
cd src && git add ../USAGE.md && git commit -m "docs(beat): 文档化 --bg-anim-beat 与脆弱边界"
```

- [ ] **Step 7: 清理冒烟产物(可选)**

```bash
cd src && rm -f out/beat-aurora.mp4 out/beat-waves.mp4 out/nobeat-aurora.mp4
```

---

## 验收标准

- `npm test` 全绿(beatLevels 归一化 + 注入幂等)。
- `npx tsc --noEmit` 无类型错误。
- `--bg-anim <x>`(默认)渲染:无黑屏,画面随节拍有可见反应(时间型模板加速 + 全模板 CSS 脉冲)。
- `--no-bg-anim-beat`:回退到旧静态行为,日志无 beat 注入。
- 不改动任何 `src/animbg/<label>/index.html` 源文件。
