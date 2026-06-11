# effect→preset 歌词特效移植实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 example/effect 的 97 个歌词特效（text 11 + visual 86）移植为 Remotion preset，统一 `fx-` 命名规范，105 个 preset 全量 smoke render 通过。

**Architecture:** 共享引擎（`src/preset/_engine/`：ScrollLyrics 滚动锚点引擎 + VisualLyrics 单行展示引擎）+ 每效果一个薄 preset 目录。visual 类 CSS 经 postcss 转换脚本一次性转成 scoped TS 数据，动画用 paused + `calc(原delay − var(--fx-t))` 按行内时间驱帧。

**Tech Stack:** Remotion（现有）、postcss + postcss-selector-parser + postcss-value-parser（新增 devDeps）、node --test。

**Spec:** `docs/superpowers/specs/2026-06-11-effect-to-preset-migration-design.md`（硬约束：97 个必交付；字体剥离走 FontLoader；颜色/字号复用现有 props；`effect/core-*.js` 不移植）

**工作目录约定:** 所有 node/npm 命令在 `src/` 下执行；转换脚本放 `src/scripts/`（与 gen_winamp.mjs 同级的是仓库根 `scripts/`，本计划新脚本统一放仓库根 `scripts/` 旁的 `src/` 内以便复用 node_modules——见各任务 Files）。

---

## 文件结构总览

```
src/preset/
  _shared/                       # Task 1：现根目录 7 个共享组件移入
  _engine/
    types.ts                     # Task 3：TextEffect / VisualEffect / EffectAPI 类型
    timing.ts                    # Task 3：行索引、行内时间、逐字均分 charTimes（纯函数，可单测）
    ScrollLyrics.tsx             # Task 4：滚动锚点引擎
    VisualLyrics.tsx             # Task 6：单行展示引擎（reveal 遮罩 + 驱帧 + 覆盖层）
    makePreset.tsx               # Task 4：effect → Root/Composition 工厂
    effects/text/*.ts            # Task 4/5：11 个
    effects/visual/*.ts          # Task 7：86 个（脚本生成，禁止手改，修复改转换脚本）
  fx-001-word-by/ … fx-097-*/    # 薄 preset（Task 4/7 生成）
  fx-apple/ … fx-typewriter/     # Task 1 改名
  README.md                      # Task 9 索引
src/scripts/
  convert-effects.mjs            # Task 6：effect/*.js → effects/visual/*.ts + 薄 preset 生成
  convert-effects.test.mjs       # Task 6：014/020/034/048/077 + shorthand 单测
  smoke-presets.mjs              # Task 2：全量 preset 渲染 1 帧 still
```

---

### Task 1: `_shared/` 整理 + 旧 preset 改名 + 默认入口改写

**Files:**
- Move: `src/preset/{BackgroundLayer,BeatReactiveAnim,ButterchurnAnim,FontLoader,StudioControlBar,TextColorOverride}.tsx`、`src/preset/lyricsToData.ts` → `src/preset/_shared/`
- Rename: `src/preset/{apple,bounce,cinema,ktv,neon,no2,orig,typewriter}` → `fx-` 前缀
- Modify: `src/render.mjs:262`、`src/cli.mjs:111`、`src/package.json:7-8`、`scripts/render_all.py`（如有写死 preset 名处）、各 preset 内 import 路径

- [ ] **Step 1: git mv 共享组件与 preset 目录**

```bash
cd src/preset && mkdir _shared
git mv BackgroundLayer.tsx BeatReactiveAnim.tsx ButterchurnAnim.tsx FontLoader.tsx StudioControlBar.tsx TextColorOverride.tsx lyricsToData.ts _shared/
for p in apple bounce cinema ktv neon no2 orig typewriter; do git mv "$p" "fx-$p"; done
```

- [ ] **Step 2: 批量改 import 路径**

preset 内 `from '../BackgroundLayer'` 等 → `from '../_shared/BackgroundLayer'`；`_shared` 内部互引不变；`_shared/lyricsToData.ts` 的 `from '../types'` → `from '../../types'`（types.ts 在 src/ 根）。

```bash
cd src/preset
grep -rl "from '\.\./\(BackgroundLayer\|BeatReactiveAnim\|ButterchurnAnim\|FontLoader\|StudioControlBar\|TextColorOverride\|lyricsToData\)'" fx-*/ | xargs sed -i '' "s|from '\.\./\(BackgroundLayer\|BeatReactiveAnim\|ButterchurnAnim\|FontLoader\|StudioControlBar\|TextColorOverride\|lyricsToData\)'|from '../_shared/\1'|g"
sed -i '' "s|from '\.\./types'|from '../../types'|" _shared/lyricsToData.ts
grep -rn "from '\.\./\.\./types'" _shared/*.tsx  # 检查 _shared 内其它对 src/types 的引用是否同样需要升级
```

- [ ] **Step 3: 默认入口与脚本引用改为 fx-orig**

- `src/render.mjs:262`：`args.preset || 'orig'` → `args.preset || 'fx-orig'`
- `src/cli.mjs:111`：`opts.preset || 'orig'` → `opts.preset || 'fx-orig'`
- `src/package.json`：`"start"`/`"build"` 中 `preset/orig/index.ts` → `preset/fx-orig/index.ts`
- `grep -rn "preset/orig\|'orig'" src/ scripts/ --include='*.mjs' --include='*.py' --include='*.json'` 清零残留

- [ ] **Step 4: TypeScript 编译验证**

Run: `cd src && npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 5: 渲染验证**

Run: `cd src && node render.mjs --audio public/celebration.mp3 --preset fx-neon --html`（按现有 CLI 习惯起 studio 后 Ctrl+C），以及不带 `--preset` 确认默认 fx-orig 被解析
Expected: 两者均正常解析 preset、无 import 报错

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "refactor(preset): 共享组件入 _shared/，8 个 preset 加 fx- 前缀，默认入口改 fx-orig"
```

### Task 2: 全量 smoke 脚本

**Files:**
- Create: `src/scripts/smoke-presets.mjs`

- [ ] **Step 1: 写脚本**

```js
#!/usr/bin/env node
// 对 preset/ 下每个含 index.ts 的目录渲染 1 帧 still，全部成功才退出 0。
import {readdirSync, existsSync, mkdirSync, writeFileSync, rmSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';

const presetRoot = resolve(import.meta.dirname, '../preset');
const outDir = resolve(import.meta.dirname, '../out/smoke');
mkdirSync(outDir, {recursive: true});
const presets = readdirSync(presetRoot).filter(d => existsSync(join(presetRoot, d, 'index.ts')));
const only = process.argv[2]; // 可选：只跑匹配前缀的 preset
const targets = only ? presets.filter(p => p.startsWith(only)) : presets;

const props = {
  audioFileName: 'celebration.mp3',
  lyrics: [
    {start: 0, end: 3, text: '沧海一声笑'},
    {start: 3, end: 6, text: '滔滔两岸潮'},
  ],
  title: 'smoke', subtitle: '', creditText: '',
  durationInSeconds: 6, lyricOffset: 0,
  backgroundImage: '', backgroundVideo: '', backgroundAnim: '', backgroundCarousel: '',
  backgroundAnimBeat: false, backgroundAnimKind: '',
  width: 640, height: 360, fps: 24,
  fontFamily: '', fontFile: '', fontScale: 1, fontFgColor: '', fontBgColor: '',
};
const propsFile = join(outDir, 'props.json');
writeFileSync(propsFile, JSON.stringify(props));

const failed = [];
for (const p of targets) {
  // 第 96 帧 = 4s，处于第二行歌词内，确保歌词渲染路径被执行
  const r = spawnSync('npx', ['remotion', 'still', join(presetRoot, p, 'index.ts'),
    'MusicVideo', join(outDir, `${p}.png`), '--frame=96', `--props=${propsFile}`],
    {stdio: 'pipe', encoding: 'utf8', timeout: 120000});
  const ok = r.status === 0;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${p}`);
  if (!ok) { failed.push(p); console.error(r.stderr?.slice(-2000)); }
}
rmSync(propsFile);
console.log(`\n${targets.length - failed.length}/${targets.length} passed`);
if (failed.length) { console.error('Failed:', failed.join(', ')); process.exit(1); }
```

- [ ] **Step 2: 对现有 8 个旧 preset 跑通**

Run: `cd src && node scripts/smoke-presets.mjs fx-`
Expected: `8/8 passed`，out/smoke/ 下 8 张 png 非全黑（肉眼抽看 2 张）

- [ ] **Step 3: Commit**

```bash
git add src/scripts/smoke-presets.mjs && git commit -m "test(preset): 全量 preset smoke still 脚本"
```

### Task 3: `_engine` 类型与时间工具（TDD）

**Files:**
- Create: `src/preset/_engine/types.ts`、`src/preset/_engine/timing.ts`、`src/preset/_engine/timing.test.mjs`

- [ ] **Step 1: 写 types.ts**

```ts
import type {CSSProperties} from 'react';

export interface CharTime { ch: string; start: number; dur: number } // ms
export interface LineInfo { start: number; end: number; dur: number; chars: string[]; charTimes: CharTime[] }

// text 类效果 API（demo makeApi 的 Remotion 版，全部确定性输入）
export interface TextEffectApi {
  ms: number;            // 全局毫秒
  cur: number;           // 当前行索引，-1 = 未开始
  width: number; height: number;
  fontSize: number;      // height*0.055*fontScale
  GAP: number; HALF: number;
  DEFAULT_SCALE: number; LONG_SYLLABLE: number; FLOAT_PX: number; FLOAT_DUR: number;
  clamp(v: number, a: number, b: number): number;
  lerp(a: number, b: number, t: number): number;
  easeOutSine(x: number): number;
  bassEnergy: number;    // 011 用，其余为 0
}

export interface LineCtx { i: number; isCur: boolean; d: number; df: number; info: LineInfo }

// 返回的样式由引擎合并到行/字 span 上（demo 是直接改 DOM，这里改为返回值）
export interface LineRender {
  base?: {scale?: number; opacity?: number; rotate?: number; origin?: string};
  lineStyle?: CSSProperties;
  charStyles?: (CSSProperties | undefined)[];
}

export interface TextEffect {
  id: string; name: string; src: string;
  needsAudio?: boolean;  // true → 引擎计算 bassEnergy（011）
  frame?(api: TextEffectApi): {trackTransform?: string; stagePerspective?: string} | void;
  line?(api: TextEffectApi, ctx: LineCtx): LineRender | void;
}

export interface VisualEffect {
  id: string; name: string; src: string;
  css: string;           // 已 scope（.fx-<id> 前缀、keyframes 已改名、delay 已合成 var(--fx-t)）
  html: string;          // 模板：{{LINE}} / {{LETTERS}}
  letterTpl?: string;    // 逐字模板：{i} {n} {ch}
  timeBase?: 'line' | 'global'; // 默认 'line'
}
```

- [ ] **Step 2: 写 timing 失败测试**

`timing.test.mjs`（node --test，经 tsx/直接用编译后逻辑不便——timing.ts 用无依赖纯 TS，测试经 `npx tsx --test` 跑）：

```js
import {test} from 'node:test';
import assert from 'node:assert';
import {buildLineInfo, currentLineIndex} from './timing.ts';

test('行级时间均分成逐字 charTimes', () => {
  const lines = [{start: 1, end: 3, text: '沧海'}]; // 秒
  const info = buildLineInfo(lines, 0);
  assert.equal(info[0].charTimes.length, 2);
  assert.equal(info[0].charTimes[0].start, 1000);
  assert.equal(info[0].charTimes[0].dur, 1000);
  assert.equal(info[0].charTimes[1].start, 2000);
});

test('currentLineIndex：开始前 -1，行内取该行', () => {
  const info = buildLineInfo([{start: 1, end: 3, text: '沧'}, {start: 3, end: 5, text: '海'}], 0);
  assert.equal(currentLineIndex(info, 500), -1);
  assert.equal(currentLineIndex(info, 1500), 0);
  assert.equal(currentLineIndex(info, 3500), 1);
});

test('lyricOffset 生效', () => {
  const info = buildLineInfo([{start: 1, end: 3, text: '沧'}], -0.5);
  assert.equal(info[0].start, 500);
});
```

Run: `cd src && npx tsx --test preset/_engine/timing.test.mjs`
Expected: FAIL（timing.ts 不存在）

- [ ] **Step 3: 实现 timing.ts**

```ts
import type {LyricLine} from '../../types';
import type {LineInfo} from './types';

// demo lineInfo 的等价实现：行级时间戳，每行均分到字符（空格也算一个字符位）
export function buildLineInfo(lyrics: LyricLine[], offsetSec: number): LineInfo[] {
  return lyrics.map((l) => {
    const start = (l.start + offsetSec) * 1000;
    const end = (l.end + offsetSec) * 1000;
    const chars = [...l.text];
    const dur = Math.max(end - start, 1);
    const charDur = dur / Math.max(chars.length, 1);
    const charTimes = chars.map((ch, k) => ({ch, start: start + k * charDur, dur: charDur}));
    return {start, end, dur, chars, charDur, charTimes} as LineInfo & {charDur: number};
  });
}

export function currentLineIndex(info: LineInfo[], ms: number): number {
  let idx = -1;
  for (let i = 0; i < info.length; i++) { if (ms >= info[i].start) idx = i; else break; }
  return idx;
}
```

- [ ] **Step 4: 跑测试通过 → Commit**

Run: `cd src && npx tsx --test preset/_engine/timing.test.mjs` → PASS

```bash
git add src/preset/_engine/ && git commit -m "feat(engine): _engine 类型与歌词时间工具"
```

### Task 4: ScrollLyrics 引擎 + makePreset + fx-001 打通

**Files:**
- Create: `src/preset/_engine/ScrollLyrics.tsx`、`src/preset/_engine/makePreset.tsx`、`src/preset/_engine/effects/text/001-word-by.ts`、`src/preset/fx-001-word-by/index.ts`

- [ ] **Step 1: ScrollLyrics.tsx**

demo 主循环的确定性移植。滚动不用 lerp 状态，改为行切换起 450ms easeOutSine 从上一行锚点插值到当前行锚点：

```tsx
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {useAudioData, visualizeAudio} from '@remotion/media-utils';
import {MVInputProps} from '../../types';
import {BackgroundLayer} from '../_shared/BackgroundLayer';
import {StudioControlBar} from '../_shared/StudioControlBar';
import {FontLoader} from '../_shared/FontLoader';
import {TextColorOverride} from '../_shared/TextColorOverride';
import {buildLineInfo, currentLineIndex} from './timing';
import type {TextEffect, TextEffectApi} from './types';

const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOutSine = (x: number) => Math.sin(clamp(x, 0, 1) * Math.PI / 2);
const SCROLL_DUR = 450;

// 011 呼吸：attack0.2/decay0.05 单极滤波，从行起始帧迭代重算保证确定性
function bassEnergyAt(audioData: ReturnType<typeof useAudioData>, frame: number, fps: number, fromFrame: number): number {
  if (!audioData) return 0;
  let cur = 0;
  for (let f = Math.max(fromFrame, 0); f <= frame; f++) {
    const spectrum = visualizeAudio({audioData, frame: f, fps, numberOfSamples: 32});
    const target = clamp((spectrum[0] + spectrum[1] + spectrum[2]) / 3 * 4, 0, 1);
    cur += (target - cur) * (target > cur ? 0.2 : 0.05);
  }
  return cur;
}

export const ScrollLyrics: React.FC<MVInputProps & {effect: TextEffect}> = (props) => {
  const {effect, lyrics, lyricOffset, audioFileName, fontScale = 1, fontFamily, fontFile, fontFgColor = '', fontBgColor = ''} = props;
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const info = buildLineInfo(lyrics, lyricOffset);
  const cur = currentLineIndex(info, ms);
  const curForScroll = Math.max(cur, 0);
  const fontSize = Math.round(height * 0.055 * fontScale);
  const GAP = Math.round(fontSize * 2.1), HALF = 3 * GAP;
  const audioSrc = audioFileName.startsWith('http') ? audioFileName : staticFile(audioFileName);
  const audioData = useAudioData(effect.needsAudio ? audioSrc : null as never); // needsAudio=false 时不取
  const lineStartFrame = cur >= 0 ? Math.floor(info[cur].start / 1000 * fps) : 0;
  const bassEnergy = effect.needsAudio ? bassEnergyAt(audioData, frame, fps, lineStartFrame) : 0;

  // 确定性滚动：从上一行锚点 easeOutSine 到当前行锚点
  const anchor = (i: number) => height / 2 - (i * GAP + GAP / 2);
  const t = cur >= 0 ? clamp((ms - info[cur].start) / SCROLL_DUR, 0, 1) : 1;
  const scrollY = lerp(anchor(Math.max(curForScroll - 1, 0)), anchor(curForScroll), easeOutSine(t));

  const api: TextEffectApi = {
    ms, cur, width, height, fontSize, GAP, HALF,
    DEFAULT_SCALE: 0.75, LONG_SYLLABLE: 700, FLOAT_PX: fontSize * 0.3, FLOAT_DUR: 450,
    clamp, lerp, easeOutSine, bassEnergy,
  };
  const extra = effect.frame?.(api);

  return (
    <AbsoluteFill style={{backgroundColor: '#000', fontFamily: fontFamily ? `"${fontFamily}", serif` : '"Noto Serif SC", serif', perspective: extra?.stagePerspective}}>
      <BackgroundLayer backgroundVideo={props.backgroundVideo} backgroundImage={props.backgroundImage} backgroundAnim={props.backgroundAnim} backgroundCarousel={props.backgroundCarousel} fallbackGradient="#000" />
      <StudioControlBar />
      <FontLoader fontFamily={fontFamily} fontFile={fontFile} />
      <TextColorOverride fgColor={fontFgColor} bgColor={fontBgColor} />
      <Audio src={audioSrc} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, transform: `translateY(${scrollY}px)${extra?.trackTransform ? ' ' + extra.trackTransform : ''}`}}>
        {info.map((li, i) => {
          const d = i - curForScroll;
          if (Math.abs(d) > 6) return null;
          const isCur = i === cur;
          const df = clamp(Math.abs(d) * GAP / HALF, 0, 1);
          const r = effect.line?.(api, {i, isCur, d, df, info: li}) || {};
          const base = {
            scale: isCur ? 1 : 1 - df * 0.25,
            opacity: isCur ? 1 : clamp(1 - df, 0.06, 1),
            rotate: 0, origin: 'center center',
            ...r.base,
          };
          return (
            <div key={i} style={{
              position: 'absolute', left: 0, right: 0, top: i * GAP, height: GAP,
              display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap',
              fontSize, lineHeight: 1.3, padding: '0 6%',
              color: isCur ? '#fff' : `rgba(255,255,255,${(0.4 * (1 - df * 0.7)).toFixed(3)})`,
              fontWeight: isCur ? 700 : 400,
              transformOrigin: base.origin, opacity: base.opacity,
              transform: `scale(${base.scale})${base.rotate ? ` rotate(${base.rotate}deg)` : ''}`,
              ...r.lineStyle,
            }}>
              {li.chars.map((ch, k) => (
                <span key={k} style={{display: 'inline-block', whiteSpace: 'pre', ...r.charStyles?.[k]}}>{ch === ' ' ? '  ' : ch}</span>
              ))}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
```

注：`useAudioData(null)` 不合法——实现时 needsAudio=false 走不调用 hook 的分支不可行（hooks 规则），统一始终 `useAudioData(audioSrc)`，仅在 needsAudio 时做迭代计算。以实现时编译结果为准修正。

- [ ] **Step 2: makePreset.tsx**

```tsx
import React from 'react';
import {Composition, CalculateMetadataFunction, registerRoot} from 'remotion';
import {MVInputProps, defaultProps} from '../../types';
import {ScrollLyrics} from './ScrollLyrics';
import {VisualLyrics} from './VisualLyrics';
import type {TextEffect, VisualEffect} from './types';

const calculateMetadata: CalculateMetadataFunction<MVInputProps> = ({props}) => ({
  durationInFrames: Math.ceil(props.durationInSeconds * props.fps),
  fps: props.fps, width: props.width, height: props.height,
});

export function registerTextPreset(effect: TextEffect) {
  const Comp: React.FC<MVInputProps> = (p) => <ScrollLyrics {...p} effect={effect} />;
  registerRoot(() => (
    <Composition id="MusicVideo" component={Comp} fps={defaultProps.fps} width={defaultProps.width}
      height={defaultProps.height} defaultProps={defaultProps} calculateMetadata={calculateMetadata} />
  ));
}

export function registerVisualPreset(effect: VisualEffect) {
  const Comp: React.FC<MVInputProps> = (p) => <VisualLyrics {...p} effect={effect} />;
  registerRoot(() => (
    <Composition id="MusicVideo" component={Comp} fps={defaultProps.fps} width={defaultProps.width}
      height={defaultProps.height} defaultProps={defaultProps} calculateMetadata={calculateMetadata} />
  ));
}
```

（Task 4 阶段 VisualLyrics 尚不存在：先在本 task 用占位空组件文件建立 `VisualLyrics.tsx`，Task 6 实现，避免循环依赖编译失败；或本 task 仅导出 registerTextPreset，Task 6 再加 registerVisualPreset——取后者，makePreset 本 task 不 import VisualLyrics。）

- [ ] **Step 3: 001 效果定义 + 薄 preset**

`effects/text/001-word-by.ts`（来源 `example/effect/001-word-by.js`，逐字渐变扫描）：

```ts
import type {TextEffect} from '../../types';

// 001 逐字卡拉OK · Renderer/LyricsLineRenderer.cs
export const effect: TextEffect = {
  id: '001', name: '逐字卡拉OK', src: '逐字卡拉OK · Renderer/LyricsLineRenderer.cs',
  line(api, ctx) {
    if (!ctx.isCur) return;
    const charStyles = ctx.info.charTimes.map((ct) => {
      const p = api.clamp((api.ms - ct.start) / ct.dur, 0, 1);
      if (p >= 1) return {color: '#fff'};
      if (p <= 0) return {color: 'rgba(255,255,255,0.32)'};
      const pc = p * 100, soft = pc + 22;
      return {
        color: 'transparent', WebkitTextFillColor: 'transparent',
        background: `linear-gradient(90deg,#fff ${pc.toFixed(1)}%, rgba(255,255,255,0.32) ${soft.toFixed(1)}%)`,
        WebkitBackgroundClip: 'text', backgroundClip: 'text',
      } as const;
    });
    return {charStyles};
  },
};
```

`src/preset/fx-001-word-by/index.ts`：

```ts
import {registerTextPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/text/001-word-by';
registerTextPreset(effect);
```

- [ ] **Step 4: 验证**

Run: `cd src && npx tsc --noEmit && node scripts/smoke-presets.mjs fx-001`
Expected: PASS；打开 out/smoke/fx-001-word-by.png 看到第二行歌词处于扫描中（部分白部分暗）

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(engine): ScrollLyrics 滚动锚点引擎 + fx-001 逐字卡拉OK 打通"
```

### Task 5: text 类 002–011 全量移植

**Files:**
- Create: `src/preset/_engine/effects/text/{002-glow,003-scale,004-float,005-blur-fade,006-out-of,007-shadow,008-edge-fade,009-3d-perspective,010-fan,011-breathing}.ts` + 对应 `src/preset/fx-0NN-<名>/index.ts`

每个文件按 Task 4 Step 3 的同构模式逐一移植，源文件一一对应 `example/effect/0NN-*.js`，逻辑规范见 `example/effect/LOGIC.md` 对应小节。demo→引擎 的机械映射规则（所有效果共用）：

| demo 写法 | 引擎写法 |
|---|---|
| `s.style.X = v`（逐字） | `charStyles[k] = {X: v}` |
| `L.el.style.X = v`（整行） | `lineStyle: {X: v}` |
| 返回 `{scale,opacity,rotate,origin}` | `base: {...}` |
| `api.charPlayedColor(L, info, ms)` | charStyles 里 `p>0?'#fff':'rgba(255,255,255,0.4)'`（同 001 的简化分支） |
| `frame(api)` 返回 track transform 字符串 | `frame()` 返回 `{trackTransform}` |
| 009 的 stage.style.perspective | `frame()` 返回 `{stagePerspective}` |
| `FLOAT_PX/FLOAT_DUR/LONG_SYLLABLE/DEFAULT_SCALE` | 同名 api 字段 |
| 011 的 `api.bass()`（demo 实时分析） | `api.bassEnergy`（引擎确定性重算，`needsAudio: true`） |
| 008 边缘遮罩（stage maskImage） | `frame()` 返回值扩展 `{stageMask?: string}`，引擎应用到歌词容器 `maskImage`（实现时给 ScrollLyrics 加这一个字段） |

- [ ] **Step 1: 002–006 移植（逐字脉冲/浮动/距离模糊淡出/视线外）**，每个完成后 `node scripts/smoke-presets.mjs fx-0NN` PASS
- [ ] **Step 2: 007–010 移植（阴影/边缘遮罩/3D 透视/扇形）**，同上逐个 smoke
- [ ] **Step 3: 011 呼吸移植**（`needsAudio: true`，`base.scale *= 1 + bassEnergy * 0.35`，仅当前行），smoke PASS
- [ ] **Step 4: 全部 text smoke + tsc**

Run: `cd src && npx tsc --noEmit && node scripts/smoke-presets.mjs fx-0`
Expected: 11/11 PASS

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(preset): text 类 002-011 共 10 个效果移植"
```

### Task 6: visual 转换脚本（TDD）+ VisualLyrics 引擎

**Files:**
- Create: `src/scripts/convert-effects.mjs`、`src/scripts/convert-effects.test.mjs`、`src/preset/_engine/VisualLyrics.tsx`
- Modify: `src/package.json`（devDependencies + test script）

- [ ] **Step 1: 加依赖**

```bash
cd src && npm i -D postcss postcss-selector-parser postcss-value-parser
```

- [ ] **Step 2: 写转换单测（先失败）**

`convert-effects.test.mjs`（node --test）覆盖 spec 要求的样例：

```js
import {test} from 'node:test';
import assert from 'node:assert';
import {transformCss, parseEffectFile} from './convert-effects.mjs';

test(':host → .fx-<id>，:host .x → .fx-<id> .x', () => {
  const out = transformCss(':host .bl-wrap { width: 90vw !important; }', '014');
  assert.match(out, /\.fx-014 \.bl-wrap \{/);
  assert.doesNotMatch(out, /:host/);
});

test(':root → .fx-<id>（CSS 变量定义挂效果根）', () => {
  const out = transformCss(':root { --c: red; } .t { color: var(--c); }', '034');
  assert.match(out, /\.fx-034 \{ --c: red/);
  assert.match(out, /\.fx-034 \.t \{/);
});

test('普通选择器加前缀，伪元素保留', () => {
  const out = transformCss('.x::before { content: ""; }', '020');
  assert.match(out, /\.fx-020 \.x::before/);
});

test('@keyframes 改名且 shorthand/longhand 引用同步', () => {
  const css = `@keyframes marquee { from { translate: 70%; } }
    .a { animation: marquee 16s infinite linear; }
    .b { animation-name: marquee; animation-delay: 0.5s; }`;
  const out = transformCss(css, '014');
  assert.match(out, /@keyframes fx014-marquee/);
  assert.match(out, /animation:.*fx014-marquee/);
  assert.match(out, /animation-name:.*fx014-marquee/);
});

test('delay 合成行内时间：shorthand 拆出 delay，注入 calc(原delay − var(--fx-t))', () => {
  const out = transformCss('.a { animation: spin 2s 0.5s infinite; }', '023');
  assert.match(out, /animation-delay:\s*calc\(0\.5s - var\(--fx-t\)\)/);
  const out2 = transformCss('.b { animation: spin 2s infinite; }', '023');
  assert.match(out2, /animation-delay:\s*calc\(0s - var\(--fx-t\)\)/);
});

test('CSS 变量 delay 走 calc 包装', () => {
  const out = transformCss('.c { animation-delay: calc(var(--i) * 0.1s); }', '016');
  assert.match(out, /animation-delay:\s*calc\(\(var\(--i\) \* 0\.1s\) - var\(--fx-t\)\)/);
});

test('@import 与 font-family 剥离', () => {
  const out = transformCss('@import url("https://fonts.googleapis.com/css?family=Raleway"); .a { font-family: Raleway; color: red; }', '014');
  assert.doesNotMatch(out, /@import/);
  assert.doesNotMatch(out, /font-family/);
});

test('infinite + 位移 keyframes → timeBase global 候选', () => {
  const {timeBaseCandidate} = parseEffectFile('test', `BL.register({id:'030',name:'x',kind:'visual',css:'@keyframes mv{from{left:0}to{left:100%}} .a{animation: mv 20s infinite linear;}',html:'<i>{{LINE}}</i>'})`);
  assert.equal(timeBaseCandidate, true);
});

test('parseEffectFile 提取 BL.register 字段', () => {
  const {effect} = parseEffectFile('test', `BL.register({id:'099',name:'099 测试',kind:'visual',src:'x · CodePen',css:'.a{color:red}',html:'<div>{{LINE}}</div>',letterTpl:'<b>{ch}</b>'})`);
  assert.equal(effect.id, '099');
  assert.equal(effect.letterTpl, '<b>{ch}</b>');
});
```

Run: `cd src && node --test scripts/convert-effects.test.mjs`
Expected: 全部 FAIL（模块不存在）

- [ ] **Step 3: 实现 convert-effects.mjs**

要点（导出 `transformCss(css, id)` 与 `parseEffectFile(name, code)` 供测试，main 走批量）：

```js
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';
import valueParser from 'postcss-value-parser';

const ANIM_KEYWORDS = new Set(['normal','reverse','alternate','alternate-reverse','none','forwards','backwards','both','running','paused','infinite','linear','ease','ease-in','ease-out','ease-in-out','step-start','step-end']);

export function transformCss(css, id) {
  const prefix = `.fx-${id}`;
  const root = postcss.parse(css);
  const kfNames = new Set();
  root.walkAtRules(/^(-webkit-)?keyframes$/, (at) => { kfNames.add(at.params.trim()); at.params = `fx${id}-${at.params.trim()}`; });
  root.walkAtRules('import', (at) => at.remove());
  root.walkDecls('font-family', (d) => d.remove());
  root.walkRules((rule) => {
    if (rule.parent?.type === 'atrule' && /keyframes/.test(rule.parent.name)) return;
    rule.selector = selectorParser((sels) => {
      sels.each((sel) => {
        const first = sel.first;
        if (first?.type === 'pseudo' && (first.value === ':host' || first.value === ':root')) {
          first.replaceWith(selectorParser.className({value: `fx-${id}`}));
        } else {
          sel.prepend(selectorParser.combinator({value: ' '}));
          sel.prepend(selectorParser.className({value: `fx-${id}`}));
        }
      });
    }).processSync(rule.selector);
  });
  // animation 名改写 + delay 合成（shorthand 与 longhand 统一处理）
  root.walkDecls(/^(-webkit-)?animation(-name|-delay)?$/, (decl) => {
    const v = valueParser(decl.value);
    if (/animation(-name)?$/.test(decl.prop)) {
      v.walk((n) => { if (n.type === 'word' && kfNames.has(n.value)) n.value = `fx${id}-${n.value}`; });
      decl.value = v.toString();
    }
    if (/animation$/.test(decl.prop)) {
      // shorthand：每段动画提取 delay（第二个时间值，缺省 0s），整体改写为 longhand delay 追加
      const delays = splitShorthandDelays(decl.value); // ['0.5s','0s',...]，并把 delay 从 shorthand 中移除
      decl.value = delays.cleaned;
      decl.cloneAfter({prop: 'animation-delay', value: delays.list.map((d) => `calc(${d} - var(--fx-t))`).join(', ')});
    }
    if (/animation-delay$/.test(decl.prop)) {
      decl.value = decl.value.split(',').map((d) => `calc(${wrap(d.trim())} - var(--fx-t))`).join(', ');
    }
  });
  return root.toString();
}
// splitShorthandDelays：valueParser 按逗号分段，每段中时间字面量第 1 个=duration、第 2 个=delay；
// wrap：calc(...) 原样、纯字面量原样，其它表达式加括号。完整实现随测试驱动补齐。
```

`parseEffectFile(name, code)`：用 `new Function('BL', code)` 注入 stub BL 捕获 register 参数；`timeBaseCandidate` = css 中存在 `infinite`（shorthand 或 longhand，valueParser 判定）且对应 keyframes 含 `translate|left|right|top|bottom|margin|transform.*translate`。

main 流程：遍历 `example/effect/0*.js`（012–097，跳过 001–011 与 core-*）→ parse → transformCss → 生成：
- `src/preset/_engine/effects/visual/<id>-<slug>.ts`（slug 取源文件名去编号部分；文件头注释 `// <name> · <src>，源 example/effect/<file>，本文件由 convert-effects.mjs 生成`）
- `src/preset/fx-<id>-<slug>/index.ts`（同 fx-001 模式，调 `registerVisualPreset`）
- stdout 输出 timeBase 候选清单

- [ ] **Step 4: 单测全绿**

Run: `cd src && node --test scripts/convert-effects.test.mjs`
Expected: 全 PASS

- [ ] **Step 5: VisualLyrics.tsx**

demo renderVisual + VISUAL_OVERRIDE 的移植。t = 行内时间（timeBase==='global' 时为全局时间）：

```tsx
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {MVInputProps} from '../../types';
import {BackgroundLayer} from '../_shared/BackgroundLayer';
import {StudioControlBar} from '../_shared/StudioControlBar';
import {FontLoader} from '../_shared/FontLoader';
import {buildLineInfo, currentLineIndex} from './timing';
import type {VisualEffect} from './types';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function buildHtml(e: VisualEffect, line: string): string {
  const chars = [...line];
  const letters = chars.map((ch, i) => e.letterTpl
    ? e.letterTpl.replace(/\{i\}/g, String(i)).replace(/\{n\}/g, String(chars.length)).replace(/\{ch\}/g, ch === ' ' ? '&nbsp;' : esc(ch))
    : `<span class="bl-l" style="--i:${i};--n:${chars.length}">${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`
  ).join('') || '&nbsp;';
  return (e.html || '<div class="bl-line">{{LINE}}</div>').replace(/\{\{LETTERS\}\}/g, letters).replace(/\{\{LINE\}\}/g, esc(line) || '&nbsp;');
}

// demo VISUAL_OVERRIDE 等价层：注入在效果 css 之后；颜色覆盖只在传色时追加
function overrideCss(id: string, fontSize: number, fg: string, bg: string): string {
  let css = `
    .fx-${id} * { animation-play-state: paused !important; }
    .fx-${id} .bl-wrap, .fx-${id} .bl-wrap * { font-size: ${fontSize}px !important; white-space: nowrap !important; }
    .fx-${id} .bl-wrap { width: max-content; max-width: 94%; margin: 0 auto; line-height: 1.3;
      -webkit-mask-image: linear-gradient(90deg,#000 calc(var(--reveal,1)*100% - 0.4ch), transparent calc(var(--reveal,1)*100% + 0.1ch));
              mask-image: linear-gradient(90deg,#000 calc(var(--reveal,1)*100% - 0.4ch), transparent calc(var(--reveal,1)*100% + 0.1ch)); }`;
  if (fg || bg) {
    const stroke = bg || fg;
    css += `\n.fx-${id} .bl-wrap, .fx-${id} .bl-wrap *, .fx-${id} .bl-wrap *::before, .fx-${id} .bl-wrap *::after {`;
    if (fg) css += `color:${fg} !important; -webkit-text-fill-color:${fg} !important; background-image:none !important;`;
    css += `-webkit-text-stroke-color:${stroke} !important;`;
    if (bg) css += `text-shadow:-0.05em -0.05em 0 ${bg},0.05em -0.05em 0 ${bg},-0.05em 0.05em 0 ${bg},0.05em 0.05em 0 ${bg} !important;`;
    css += '}';
  }
  return css;
}

export const VisualLyrics: React.FC<MVInputProps & {effect: VisualEffect}> = (props) => {
  const {effect, lyrics, lyricOffset, audioFileName, fontScale = 1, fontFamily, fontFile, fontFgColor = '', fontBgColor = ''} = props;
  const frame = useCurrentFrame();
  const {fps, height} = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const info = buildLineInfo(lyrics, lyricOffset);
  const cur = currentLineIndex(info, ms);
  const line = cur < 0 ? '' : info[cur].chars.join('');
  const fontSize = Math.round(height * 0.055 * fontScale);
  const tMs = effect.timeBase === 'global' ? ms : cur < 0 ? 0 : ms - info[cur].start;
  let reveal = 1;
  if (cur >= 0) {
    let n = 0; for (const ct of info[cur].charTimes) { if (ms >= ct.start) n++; else break; }
    reveal = n / info[cur].charTimes.length;
  }
  const audioSrc = audioFileName.startsWith('http') ? audioFileName : staticFile(audioFileName);
  return (
    <AbsoluteFill style={{backgroundColor: '#000', fontFamily: fontFamily ? `"${fontFamily}", sans-serif` : 'sans-serif'}}>
      <BackgroundLayer backgroundVideo={props.backgroundVideo} backgroundImage={props.backgroundImage} backgroundAnim={props.backgroundAnim} backgroundCarousel={props.backgroundCarousel} fallbackGradient="#000" />
      <StudioControlBar />
      <FontLoader fontFamily={fontFamily} fontFile={fontFile} />
      <Audio src={audioSrc} />
      <style>{effect.css + overrideCss(effect.id, fontSize, fontFgColor, fontBgColor)}</style>
      <div
        key={effect.timeBase === 'global' ? 'g' : cur} // line 模式换行重挂子树 → one-shot 动画逐行重播
        className={`fx-${effect.id}`}
        style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', ['--fx-t' as string]: `${(tMs / 1000).toFixed(4)}s`, ['--reveal' as string]: reveal}}
        dangerouslySetInnerHTML={{__html: `<div class="bl-wrap">${buildHtml(effect, line)}</div>`}}
      />
    </AbsoluteFill>
  );
};
```

同时给 `makePreset.tsx` 补 `registerVisualPreset`（Task 4 Step 2 已给出代码）。

- [ ] **Step 6: tsc + commit**

Run: `cd src && npx tsc --noEmit` → 无错误

```bash
git add -A && git commit -m "feat(engine): visual 转换脚本(postcss, TDD) + VisualLyrics 引擎"
```

### Task 7: 批量生成 86 个 visual + timeBase 确认

**Files:**
- Create（生成）: `src/preset/_engine/effects/visual/*.ts` ×86、`src/preset/fx-012-* … fx-097-*/index.ts` ×86

- [ ] **Step 1: 跑转换**

Run: `cd src && node scripts/convert-effects.mjs`
Expected: 输出 86 个效果生成 + timeBase 候选清单（含 014、030）

- [ ] **Step 2: 确认 timeBase 候选**

对照候选清单逐个看源 css（持续位移型跑马灯/滚屏 → global；入场型 → 保持 line），把确认结果写进转换脚本内置的 `TIME_BASE_GLOBAL = new Set(['014','030',…])` 并重跑生成（生成物不手改）。已知必入：014 跑马灯、030 机场翻牌屏。

- [ ] **Step 3: tsc + 全量 smoke**

Run: `cd src && npx tsc --noEmit && node scripts/smoke-presets.mjs`
Expected: **105/105 passed**（97 新 + 8 旧）。失败的逐个看 stderr，修转换脚本（不是手改生成物）后重新生成再跑，直至全绿

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(preset): 86 个 visual 特效批量生成，105 preset 全量 smoke 通过"
```

### Task 8: 视觉抽检与修复

- [ ] **Step 1: 批量出图检查**

对 86 个 visual 各看 out/smoke png（smoke 已生成），按三类问题记录清单：全黑/文字不可见、动画停在 0 帧或终态不合理（另取 `--frame=48` 对比两帧是否有差异判定动画推进）、布局崩坏。

```bash
cd src && for f in 24 96; do node scripts/smoke-presets.mjs fx-0 2>/dev/null; done  # 实现时给脚本加 --frame 参数复用
```

- [ ] **Step 2: 修复**

问题归因到转换规则的改 `convert-effects.mjs` 并重新生成（加对应单测）；个例性的（如黑屏需补容器宽度）把修复 css 写进源 `example/effect/0NN-*.js` 风格的 per-effect 附加段——在转换脚本里加 `PATCHES = {'0NN': 'css 片段'}` 机制，保持生成物可重建。

- [ ] **Step 3: 传色验证（颜色覆盖语义）**

smoke 脚本临时传 `fontFgColor:'#00e676', fontBgColor:'#000'` 重跑 10 个含渐变/描边的代表效果（001、016、026、028、029、055、084 必含），出图确认所有可见文字（含描边）为指定色。

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "fix(preset): visual 视觉抽检修复（转换规则与 per-effect patch）"
```

### Task 9: README 索引 + 收尾

**Files:**
- Create: `src/preset/README.md`

- [ ] **Step 1: 由转换脚本/目录扫描生成索引表**：目录名 | 中文名 | 类别（text/visual/legacy）| 来源 | 备注（标注「强依赖配色」如 028、「字体剥离观感降级」如 016、timeBase=global 清单）
- [ ] **Step 2: 终验**

Run: `cd src && npx tsc --noEmit && node --test scripts/ && npx tsx --test preset/_engine/timing.test.mjs && node scripts/smoke-presets.mjs`
Expected: 全绿，105/105

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "docs(preset): README 索引，effect→preset 移植完成"
```

---

## Self-Review 记录

- Spec 覆盖：默认入口改写(T1)、smoke 105(T2/T7)、postcss devDeps(T6)、行内时间+timeBase schema(T6)、:root/:host/shorthand 转换+样例单测(T6)、颜色含 stroke 覆盖(T6 overrideCss + T8 验证)、011 呼吸确定性(T4 bassEnergyAt + T5)、97 必交付不剔除(T7 全绿门槛)、README 标注(T9)。无遗漏。
- 已知留给实现的决断点（已在文中标注）：useAudioData 的 hooks 恒调用、smoke 脚本 --frame 参数化、splitShorthandDelays 细节由单测驱动。
