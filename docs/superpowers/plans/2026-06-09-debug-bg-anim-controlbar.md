# `--debug-bg-anim` Studio 控制条 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 给 `node src/cli.mjs ... --html --bg-anim X --debug-bg-anim` 打开的 Remotion Studio 加一条画面内调试控制条：显示 preset/bg-anim label + 序号，提供「下一个」（重启 studio 切换 bg-anim）和「标记」（在该 bg-anim 目录建 `blank.txt`）两个按钮。

**Architecture:** 控制条是 composition 内的叠加层，用 `getRemotionEnvironment().isStudio` 限定只在 Studio 预览出现、不进渲染视频。`--debug-bg-anim` 时 render.mjs 启动一个本地控制服务（:3001）兼 studio 子进程管家；叠加层通过 fetch 该服务完成切换/标记。「下一个」靠重启 studio 子进程（同端口）让新 bg-anim 真正加载。

**Tech Stack:** Node ESM（node:http / child_process）、Remotion v4.0.417、React/TSX、`node --test`。

设计文档：`docs/superpowers/specs/2026-06-09-debug-bg-anim-controlbar-design.md`

> **运行环境约定**：`render.mjs` 由 `cli.mjs` 以 `cwd = src/`（即 `RENDER_DIR`）spawn，因此 `resolve('animbg')` = `src/animbg`、`resolve('public')` = `src/public`。本计划所有 `.mjs` 代码均假设 cwd 为 `src/`。所有命令在 **`src/` 目录**下执行（`cd src` 后）。

---

## 文件结构

| 文件 | 责任 | 动作 |
|---|---|---|
| `src/animbgPrepare.mjs` | 把单个 bg-anim 拷进 public 并返回 props 片段（从 render.mjs 抽出，复用给「下一个」） | 新建 |
| `src/animbgPrepare.test.mjs` | prepareAnim 的集成测试 | 新建 |
| `src/studioControl.mjs` | 控制服务（:3001）+ studio 子进程管家；`nextIndex`/`listAnimLabels` | 新建 |
| `src/studioControl.test.mjs` | `nextIndex` 回环纯函数测试 | 新建 |
| `src/render.mjs` | 改用 prepareAnim；`--debug-bg-anim` 时走 studioControl | 改 |
| `src/cli.mjs` | 解析并透传 `--debug-bg-anim` | 改 |
| `src/preset/StudioControlBar.tsx` | 画面内叠加控制条（仅 isStudio + 控制服务可达时显示） | 新建 |
| 8 个 preset 顶层组件 | 各挂一行 `<StudioControlBar/>` | 改 |

---

## Task 1: 抽出 `prepareAnim`（含测试）

**Files:**
- Create: `src/animbgPrepare.mjs`
- Test: `src/animbgPrepare.test.mjs`

- [ ] **Step 1: 写失败测试**

Create `src/animbgPrepare.test.mjs`:

```js
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve, join} from 'node:path';
import {prepareAnim} from './animbgPrepare.mjs';

// 在临时目录搭一个最小项目骨架，chdir 进去后调用 prepareAnim（它以 cwd 为根）。
function withFixture(fn) {
  const root = mkdtempSync(join(tmpdir(), 'animprep-'));
  const prevCwd = process.cwd();
  try {
    mkdirSync(join(root, 'animbg', 'plain'), {recursive: true});
    mkdirSync(join(root, 'animbg', 'libfx'), {recursive: true});
    mkdirSync(join(root, 'animbg', 'vendor'), {recursive: true});
    mkdirSync(join(root, 'public'), {recursive: true});
    writeFileSync(join(root, 'animbg', 'plain', 'index.html'),
      '<html><body><canvas></canvas></body></html>');
    writeFileSync(join(root, 'animbg', 'libfx', 'index.html'),
      '<html><body><script src="../vendor/p5.min.js"></script></body></html>');
    writeFileSync(join(root, 'animbg', 'vendor', 'p5.min.js'), '// lib');
    writeFileSync(join(root, 'animbg', 'manifest.json'),
      JSON.stringify([{label: 'plain', category: 'WINAMP'}]));
    process.chdir(root);
    fn(root);
  } finally {
    process.chdir(prevCwd);
    rmSync(root, {recursive: true, force: true});
  }
}

test('prepareAnim: 写出 public/animbg/animbg-<label>.html 并返回路径', () => {
  withFixture((root) => {
    const r = prepareAnim({label: 'plain', beatReactive: false});
    assert.equal(r.backgroundAnim, 'animbg/animbg-plain.html');
    assert.equal(r.backgroundAnimLabel, 'plain');
    assert.ok(existsSync(resolve('public', 'animbg', 'animbg-plain.html')));
  });
});

test('prepareAnim: manifest 里 WINAMP 类别 → backgroundAnimKind=winamp', () => {
  withFixture(() => {
    const r = prepareAnim({label: 'plain', beatReactive: false});
    assert.equal(r.backgroundAnimKind, 'winamp');
  });
});

test('prepareAnim: 非 WINAMP（无 manifest 条目）→ kind 为空', () => {
  withFixture(() => {
    const r = prepareAnim({label: 'libfx', beatReactive: false});
    assert.equal(r.backgroundAnimKind, '');
  });
});

test('prepareAnim: html 引用 vendor/ → 拷贝 vendor 树到 public/vendor', () => {
  withFixture(() => {
    prepareAnim({label: 'libfx', beatReactive: false});
    assert.ok(existsSync(resolve('public', 'vendor', 'p5.min.js')), 'vendor 应被拷贝');
  });
});

test('prepareAnim: beatReactive=true → 注入 beat 时钟标记', () => {
  withFixture(() => {
    prepareAnim({label: 'plain', beatReactive: true});
    const out = readFileSync(resolve('public', 'animbg', 'animbg-plain.html'), 'utf-8');
    assert.ok(out.includes('__beatTick'), '应含 beat 时钟');
  });
});

test('prepareAnim: 不存在的 label → 抛错', () => {
  withFixture(() => {
    assert.throws(() => prepareAnim({label: 'nope', beatReactive: false}), /not found/);
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `cd src && node --test animbgPrepare.test.mjs`
Expected: FAIL，报 `Cannot find module './animbgPrepare.mjs'`

- [ ] **Step 3: 实现 `src/animbgPrepare.mjs`**

```js
import {readFileSync, writeFileSync, existsSync, mkdirSync, cpSync} from 'fs';
import {resolve} from 'path';
import {needsVirtualMouse, injectVirtualMouse, injectBeatClock} from './animbgInject.mjs';

/**
 * 把 animbg/<label>/index.html 拷进 public/animbg/ 并返回 props 片段。
 * 与 render.mjs 原 inline 逻辑一致：注入虚拟鼠标 / beat 时钟、查 manifest 定
 * winamp 类别、按需拷贝 vendor 库。以 process.cwd()（= src/）为根。
 *
 * @param {{label: string, beatReactive: boolean}} opts
 * @returns {{backgroundAnim: string, backgroundAnimLabel: string, backgroundAnimKind: string}}
 */
export function prepareAnim({label, beatReactive}) {
  const animFile = resolve('animbg', label, 'index.html');
  if (!existsSync(animFile)) {
    throw new Error(`bg-anim "${label}" not found (expected ${animFile})`);
  }
  const pubDir = resolve('public');
  const animDir = resolve(pubDir, 'animbg');
  mkdirSync(animDir, {recursive: true});

  const animPublicName = `animbg-${label}.html`;
  let animHtml = readFileSync(animFile, 'utf-8');
  if (needsVirtualMouse(animHtml)) animHtml = injectVirtualMouse(animHtml);
  if (beatReactive) animHtml = injectBeatClock(animHtml);
  writeFileSync(resolve(animDir, animPublicName), animHtml);

  let backgroundAnimKind = '';
  try {
    const manifestPath = resolve('animbg', 'manifest.json');
    if (existsSync(manifestPath)) {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
      const entry = manifest.find((e) => e.label === label);
      if (entry && entry.category === 'WINAMP') backgroundAnimKind = 'winamp';
    }
  } catch {}

  if (animHtml.includes('vendor/')) {
    const vendorSrc = resolve('animbg', 'vendor');
    if (existsSync(vendorSrc)) {
      cpSync(vendorSrc, resolve(pubDir, 'vendor'), {recursive: true});
    }
  }

  return {backgroundAnim: `animbg/${animPublicName}`, backgroundAnimLabel: label, backgroundAnimKind};
}
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `cd src && node --test animbgPrepare.test.mjs`
Expected: PASS（6 个测试全过）

- [ ] **Step 5: 提交**

```bash
cd src && git add animbgPrepare.mjs animbgPrepare.test.mjs
git commit -m "feat(animbg): 抽出 prepareAnim（复用 bg-anim→public 拷贝逻辑）"
```

---

## Task 2: render.mjs 改用 prepareAnim（行为不变）

**Files:**
- Modify: `src/render.mjs`（顶部 import 区；`--bg-anim` 分支 458-506 行）

- [ ] **Step 1: 顶部加 import**

在 `src/render.mjs` 现有 import 区（`import {injectVirtualMouse, ...} from './animbgInject.mjs';` 那行附近）后加一行：

```js
import {prepareAnim} from './animbgPrepare.mjs';
```

- [ ] **Step 2: 替换 `--bg-anim` 分支的 inline 拷贝逻辑**

把 `src/render.mjs` 中从注释 `// Copy the effect HTML into public/ ...`（约 458 行）到 `console.log(\`Using animated background: ${animLabel}\`);`（约 506 行）**之间的全部代码**（即原 458-506 行那段：建 animDir、读 html、注入、writeFile、查 manifest、拷 vendor）替换为：

```js
  // 拷贝逻辑已抽到 animbgPrepare.mjs（与 --debug-bg-anim 的「下一个」共用）。
  const {backgroundAnim: _ba, backgroundAnimKind: _bak} = prepareAnim({label: animLabel, beatReactive});
  backgroundAnim = _ba;
  backgroundAnimLabel = animLabel;
  backgroundAnimKind = _bak;
  console.log(`Using animated background: ${animLabel}`);
```

> 保留其上方的 `avail` 列表与 `animLabel === 'random'` 选择、以及 452-456 行的存在性检查（带 available 列表的友好报错）不动。

- [ ] **Step 3: 验证既有渲染路径仍工作（冒烟）**

Run（用仓库自带 example，渲染 5 帧验证不报错）：
```bash
cd src && node render.mjs --audio ../example/en-1.mp3 --lyrics ../example/en-1.srt \
  --title 冒烟 --bg-anim ribbons --duration 1 --output out/smoke.mp4 2>&1 | tail -20
```
Expected: 打印 `Using animated background: ribbons`，且 `public/animbg/animbg-ribbons.html` 存在、`out/smoke.mp4` 生成无报错。

- [ ] **Step 4: 确认现有测试未破坏**

Run: `cd src && node --test`
Expected: PASS（animbgInject + animbgPrepare 全过）

- [ ] **Step 5: 提交**

```bash
cd src && git add render.mjs
git commit -m "refactor(render): bg-anim 拷贝改调 prepareAnim（行为不变）"
```

---

## Task 3: `nextIndex` 纯函数 + 测试

**Files:**
- Create: `src/studioControl.mjs`（先只放纯函数）
- Test: `src/studioControl.test.mjs`

- [ ] **Step 1: 写失败测试**

Create `src/studioControl.test.mjs`:

```js
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nextIndex} from './studioControl.mjs';

test('nextIndex: 普通前进', () => {
  assert.equal(nextIndex(0, 5), 1);
  assert.equal(nextIndex(3, 5), 4);
});

test('nextIndex: 到末尾回环到 0', () => {
  assert.equal(nextIndex(4, 5), 0);
});

test('nextIndex: 单元素始终回到 0', () => {
  assert.equal(nextIndex(0, 1), 0);
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `cd src && node --test studioControl.test.mjs`
Expected: FAIL，报无法解析 `./studioControl.mjs`

- [ ] **Step 3: 创建 `src/studioControl.mjs`（先放纯函数）**

```js
import {existsSync, readdirSync} from 'fs';
import {resolve, join} from 'path';

/** 在长度 len 的环形列表里取下一个下标（到末尾回环）。 */
export function nextIndex(idx, len) {
  return (idx + 1) % len;
}

/** src/animbg/ 下所有含 index.html 的目录名，按名排序。 */
export function listAnimLabels() {
  const dir = resolve('animbg');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((d) => existsSync(join(dir, d, 'index.html')))
    .sort();
}
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `cd src && node --test studioControl.test.mjs`
Expected: PASS（3 个测试全过）

- [ ] **Step 5: 提交**

```bash
cd src && git add studioControl.mjs studioControl.test.mjs
git commit -m "feat(studioControl): nextIndex 环形推进 + listAnimLabels"
```

---

## Task 4: studioControl 控制服务 + studio 子进程管家

**Files:**
- Modify: `src/studioControl.mjs`（追加 `startStudioControl` 与内部辅助）

- [ ] **Step 1: 在 `src/studioControl.mjs` 追加实现**

在文件**已有 import 之后、`nextIndex` 之前**补充 import：

```js
import http from 'node:http';
import {spawn} from 'node:child_process';
import {readFileSync, writeFileSync} from 'fs';
```

在文件**末尾追加**：

```js
const STUDIO_PORT = 3000;
const CONTROL_PORT = 3001;

const CORS = {'Access-Control-Allow-Origin': '*'};

// 轮询 studio（:3000）直到它能响应或超时，用于「下一个」重启后再放行叠加层 reload。
async function waitForStudio(timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(`http://localhost:${STUDIO_PORT}`, {method: 'GET'});
      if (r.status < 500) return true;
    } catch {}
    await new Promise((res) => setTimeout(res, 200));
  }
  return false;
}

/**
 * 启动控制服务（:3001）并接管 remotion studio 子进程（:3000）。
 * 仅在 --debug-bg-anim 时由 render.mjs 调用。
 *
 * @param {{presetEntry: string, propsFile: string, presetLabel: string,
 *          beatReactive: boolean, prepareAnim: Function}} ctx
 */
export function startStudioControl({presetEntry, propsFile, presetLabel, beatReactive, prepareAnim}) {
  const animList = listAnimLabels();

  // 当前序号：从 props 文件的 backgroundAnim（animbg/animbg-<label>.html）反推。
  let currentIndex = 0;
  try {
    const props = JSON.parse(readFileSync(propsFile, 'utf-8'));
    const m = /animbg-(.+)\.html$/.exec(props.backgroundAnim || '');
    if (m) {
      const i = animList.indexOf(m[1]);
      if (i >= 0) currentIndex = i;
    }
  } catch {}

  let studio = null;
  let restarting = false;

  function spawnStudio() {
    studio = spawn('npx', ['remotion', 'studio', presetEntry, `--props=${propsFile}`], {stdio: 'inherit'});
    studio.on('exit', (code) => {
      if (restarting) return; // 主动重启时由 restartStudio 的 once 处理
      process.exit(code ?? 0);
    });
  }

  function restartStudio() {
    return new Promise((res) => {
      restarting = true;
      studio.once('exit', () => {
        spawnStudio();
        restarting = false;
        res();
      });
      studio.kill('SIGTERM');
    });
  }

  function state() {
    return {
      presetLabel,
      animLabel: animList[currentIndex],
      animIndex: currentIndex + 1,
      animTotal: animList.length,
    };
  }

  const send = (res, code, obj) => {
    res.writeHead(code, {'Content-Type': 'application/json', ...CORS});
    res.end(JSON.stringify(obj));
  };

  const server = http.createServer(async (req, res) => {
    const url = req.url || '';
    if (req.method === 'OPTIONS') {
      res.writeHead(204, CORS);
      return res.end();
    }
    if (req.method === 'GET' && url === '/state') {
      return send(res, 200, state());
    }
    if (req.method === 'POST' && url === '/next') {
      currentIndex = nextIndex(currentIndex, animList.length);
      const label = animList[currentIndex];
      try {
        const {backgroundAnim, backgroundAnimKind} = prepareAnim({label, beatReactive});
        const props = JSON.parse(readFileSync(propsFile, 'utf-8'));
        props.backgroundAnim = backgroundAnim;
        props.backgroundAnimKind = backgroundAnimKind;
        writeFileSync(propsFile, JSON.stringify(props));
      } catch (e) {
        return send(res, 500, {error: String((e && e.message) || e)});
      }
      await restartStudio();
      if (!(await waitForStudio())) {
        return send(res, 500, {error: 'studio restart timeout'});
      }
      return send(res, 200, state());
    }
    if (req.method === 'POST' && url === '/mark') {
      try {
        writeFileSync(resolve('animbg', animList[currentIndex], 'blank.txt'), '');
        return send(res, 200, {marked: true});
      } catch (e) {
        return send(res, 500, {error: String((e && e.message) || e)});
      }
    }
    return send(res, 404, {error: 'not found'});
  });

  server.on('error', (e) => {
    if (e && e.code === 'EADDRINUSE') {
      console.error(`Error: 控制服务端口 ${CONTROL_PORT} 被占用，请释放或关闭占用进程。`);
      process.exit(1);
    }
    throw e;
  });

  server.listen(CONTROL_PORT, () => {
    console.log(`bg-anim 调试控制服务: http://localhost:${CONTROL_PORT}`);
    spawnStudio();
  });
}
```

- [ ] **Step 2: 确认模块可加载、纯函数测试仍过**

Run: `cd src && node -e "import('./studioControl.mjs').then(m=>console.log(typeof m.startStudioControl))" && node --test studioControl.test.mjs`
Expected: 打印 `function`，随后 3 个测试 PASS。

> 说明：`startStudioControl` 的端到端行为（重启/端口）在 Task 8 手动验证，这里不写自动化测试（涉及真实子进程与端口，成本高、价值低）。

- [ ] **Step 3: 提交**

```bash
cd src && git add studioControl.mjs
git commit -m "feat(studioControl): 控制服务(:3001) + studio 子进程重启管家"
```

---

## Task 5: render.mjs `--html` 分支接入 `--debug-bg-anim`

**Files:**
- Modify: `src/render.mjs`（顶部 import；booleanFlags；`--html` 分支 574-581 行）

- [ ] **Step 1: 顶部加 import**

在 Task 2 加的 `import {prepareAnim} ...` 后再加：

```js
import {startStudioControl} from './studioControl.mjs';
```

- [ ] **Step 2: booleanFlags 加 `debug-bg-anim`**

把 `src/render.mjs` 的 `parseArgs` 内（约 225 行）：

```js
  const booleanFlags = new Set(['html', 'no-bg-anim-beat']);
```

改为：

```js
  const booleanFlags = new Set(['html', 'no-bg-anim-beat', 'debug-bg-anim']);
```

- [ ] **Step 3: 替换 `--html` 分支里 spawn studio 的代码**

把 `src/render.mjs` 中（约 574-581 行）：

```js
  // Inherit stdio so Studio's "Server ready - Local: http://localhost:3000" line is shown live.
  const studio = spawn(
    'npx',
    ['remotion', 'studio', presetEntry, `--props=${propsFile}`],
    {stdio: 'inherit'}
  );
  studio.on('exit', (code) => process.exit(code ?? 0));
  // Do NOT delete the props file here — Studio needs it while running.
```

替换为：

```js
  // Do NOT delete the props file here — Studio needs it while running.
  if (args['debug-bg-anim']) {
    // 调试模式：由控制服务接管 studio 子进程，并提供 bg-anim 切换/标记。
    console.log('  bg-anim 调试控制条已启用（叠加在预览画面上）。');
    startStudioControl({presetEntry, propsFile, presetLabel, beatReactive, prepareAnim});
  } else {
    // Inherit stdio so Studio's "Server ready" line is shown live.
    const studio = spawn(
      'npx',
      ['remotion', 'studio', presetEntry, `--props=${propsFile}`],
      {stdio: 'inherit'}
    );
    studio.on('exit', (code) => process.exit(code ?? 0));
  }
```

- [ ] **Step 4: 冒烟——不带 debug 仍正常（语法/加载）**

Run（仅校验脚本能解析、参数能跑到 studio 启动前不抛错；2 秒后中断）：
```bash
cd src && node --check render.mjs && echo "render.mjs 语法 OK"
```
Expected: 打印 `render.mjs 语法 OK`。

- [ ] **Step 5: 提交**

```bash
cd src && git add render.mjs
git commit -m "feat(render): --debug-bg-anim 走 studioControl 接管 studio"
```

---

## Task 6: cli.mjs 透传 `--debug-bg-anim`

**Files:**
- Modify: `src/cli.mjs`（booleanFlags 53 行；透传区 121 行附近；头部注释）

- [ ] **Step 1: booleanFlags 加 `debug-bg-anim`**

把 `src/cli.mjs:53`：

```js
const booleanFlags = new Set(['html', 'no-bg-anim-beat']);
```

改为：

```js
const booleanFlags = new Set(['html', 'no-bg-anim-beat', 'debug-bg-anim']);
```

- [ ] **Step 2: 透传给 render.mjs**

在 `src/cli.mjs` 透传区，紧跟 `if (opts.html) nodeArgs.push('--html');`（约 121 行）后加一行：

```js
if (opts['debug-bg-anim']) nodeArgs.push('--debug-bg-anim');
```

- [ ] **Step 3: 头部注释补一行**

在 `src/cli.mjs` 头部 doc 注释中 `--html` 那行（约 37 行）后加：

```
 *   --debug-bg-anim   与 --html 配合：在预览画面叠加 bg-anim 调试控制条（下一个/标记）
```

- [ ] **Step 4: 校验语法**

Run: `cd src && node --check cli.mjs && echo "cli.mjs 语法 OK"`
Expected: 打印 `cli.mjs 语法 OK`。

- [ ] **Step 5: 提交**

```bash
cd src && git add cli.mjs
git commit -m "feat(cli): 透传 --debug-bg-anim"
```

---

## Task 7: `StudioControlBar.tsx` 叠加层组件

**Files:**
- Create: `src/preset/StudioControlBar.tsx`

- [ ] **Step 1: 创建组件**

```tsx
import React, {useEffect, useState, useCallback} from 'react';
import {getRemotionEnvironment} from 'remotion';

type State = {presetLabel: string; animLabel: string; animIndex: number; animTotal: number};

const CONTROL_URL = 'http://localhost:3001';

// 仅 Studio 预览里渲染；render 时 isStudio=false → null，绝不进视频。
export const StudioControlBar: React.FC = () => {
  if (!getRemotionEnvironment().isStudio) return null;
  return <ControlBarInner />;
};

const btn: React.CSSProperties = {
  pointerEvents: 'auto',
  cursor: 'pointer',
  border: 'none',
  borderRadius: 6,
  padding: '6px 12px',
  fontSize: 15,
  color: '#fff',
  background: '#444',
};

const ControlBarInner: React.FC = () => {
  const [state, setState] = useState<State | null>(null);
  const [marked, setMarked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`${CONTROL_URL}/state`)
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => {
        if (alive && s) setState(s as State);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const onNext = useCallback(async () => {
    setBusy(true);
    try {
      const r = await fetch(`${CONTROL_URL}/next`, {method: 'POST'});
      if (r.ok) {
        window.location.reload();
      } else {
        setBusy(false);
        // eslint-disable-next-line no-alert
        window.alert('切换超时，请手动刷新页面');
      }
    } catch {
      setBusy(false);
      // eslint-disable-next-line no-alert
      window.alert('切换失败：控制服务无响应');
    }
  }, []);

  const onMark = useCallback(async () => {
    try {
      const r = await fetch(`${CONTROL_URL}/mark`, {method: 'POST'});
      if (r.ok) setMarked(true);
      // eslint-disable-next-line no-alert
      else window.alert('标记失败');
    } catch {
      // eslint-disable-next-line no-alert
      window.alert('标记失败：控制服务无响应');
    }
  }, []);

  // 控制服务不可达（未开 --debug-bg-anim）→ 不显示任何东西。
  if (!state) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 14px',
        background: 'rgba(0,0,0,0.72)',
        color: '#fff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 16,
        lineHeight: 1,
      }}
    >
      <span style={{opacity: 0.85}}>
        preset: <b>{state.presetLabel}</b>
      </span>
      <span style={{opacity: 0.4}}>·</span>
      <span>
        bg-anim: <b>{state.animLabel}</b> ({state.animIndex}/{state.animTotal})
      </span>
      <button type="button" onClick={onNext} disabled={busy} style={btn}>
        {busy ? '切换中…' : '下一个'}
      </button>
      <button
        type="button"
        onClick={onMark}
        style={{...btn, background: marked ? '#2e7d32' : '#444'}}
      >
        {marked ? '✓ 已标记' : '标记'}
      </button>
    </div>
  );
};
```

- [ ] **Step 2: 类型检查**

Run: `cd src && npx tsc --noEmit -p tsconfig.json`
Expected: 无错误（若 tsconfig 未含该文件，确认无新增报错即可）。

- [ ] **Step 3: 提交**

```bash
cd src && git add preset/StudioControlBar.tsx
git commit -m "feat(preset): StudioControlBar 画面内调试叠加层"
```

---

## Task 8: 8 个 preset 挂载 `<StudioControlBar/>`

**Files（各 +1 import、+1 JSX 行，紧跟 `<BackgroundLayer .../>` 之后）:**
- `src/preset/orig/AudioVisualization.tsx`
- `src/preset/apple/Composition.tsx`
- `src/preset/bounce/Composition.tsx`
- `src/preset/cinema/Composition.tsx`
- `src/preset/ktv/Composition.tsx`
- `src/preset/neon/Composition.tsx`
- `src/preset/no2/Composition.tsx`
- `src/preset/typewriter/Composition.tsx`

> 这 8 个文件都 `import {BackgroundLayer} from '../BackgroundLayer';`（orig 是 `'./'`？实际为 `'../BackgroundLayer'`，见各文件），并在 return 里渲染 `<BackgroundLayer .../>`。逐个文件操作：

- [ ] **Step 1: orig —— 加 import + 挂载**

`src/preset/orig/AudioVisualization.tsx`：在 `import {BackgroundLayer} from '../BackgroundLayer';`（13 行）后加：

```tsx
import {StudioControlBar} from '../StudioControlBar';
```

在该文件 `<BackgroundLayer ... />`（含 `overlay="rgba(0, 0, 0, 0.45)"` 的那个，自闭合 `/>` 之后）紧接一行：

```tsx
      <StudioControlBar />
```

- [ ] **Step 2: 其余 7 个 preset —— 同样两处改动**

对 `apple/Composition.tsx`、`bounce/Composition.tsx`、`cinema/Composition.tsx`、`ktv/Composition.tsx`、`neon/Composition.tsx`、`no2/Composition.tsx`、`typewriter/Composition.tsx`，各自：

(a) 在其 `import {BackgroundLayer} from '../BackgroundLayer';` 行后加：

```tsx
import {StudioControlBar} from '../StudioControlBar';
```

(b) 在其 `<BackgroundLayer ... />` 自闭合标签之后紧接一行：

```tsx
      <StudioControlBar />
```

> 示例（bounce/Composition.tsx，原 127-133 行的 `<BackgroundLayer ... />` 之后）：
> ```tsx
>       <BackgroundLayer
>         backgroundVideo={backgroundVideo}
>         backgroundImage={backgroundImage}
>         backgroundAnim={backgroundAnim}
>         backgroundCarousel={backgroundCarousel}
>         fallbackGradient="linear-gradient(135deg, #2b1055 0%, #7597de 100%)"
>       />
>       <StudioControlBar />
> ```

- [ ] **Step 3: 确认 8 处都已挂载**

Run: `cd src && grep -rl "StudioControlBar" preset/*/Composition.tsx preset/orig/AudioVisualization.tsx | wc -l`
Expected: `8`

- [ ] **Step 4: 类型检查**

Run: `cd src && npx tsc --noEmit -p tsconfig.json`
Expected: 无新增错误。

- [ ] **Step 5: 提交**

```bash
cd src && git add preset/*/Composition.tsx preset/orig/AudioVisualization.tsx
git commit -m "feat(preset): 8 个 preset 挂载 StudioControlBar"
```

---

## Task 9: 端到端手动验证（含点击可用性闸门）

**Files:** 无（验证 + 可能的回退）

- [ ] **Step 1: 启动调试模式**

Run:
```bash
cd src && node cli.mjs --audio ../example/en-1.mp3 --lyrics ../example/en-1.srt \
  --title 测试 --preset orig --bg-anim ribbons --html --debug-bg-anim
```
Expected: 终端打印 `bg-anim 调试控制服务: http://localhost:3001`，浏览器打开 `localhost:3000`，预览顶部出现控制条 `preset: orig · bg-anim: ribbons (N/172)　[下一个] [标记]`。

- [ ] **Step 2: 验证「下一个」**

操作：点「下一个」。
Expected：页面 reload，控制条 label 变为下一个（按目录名排序）bg-anim，序号 +1；预览背景换成新效果。`src/.render-props.json` 的 `backgroundAnim` 已更新。

- [ ] **Step 3: 验证「标记」**

操作：点「标记」，按钮变 `✓ 已标记`。
Run（另开终端）: `ls src/animbg/<当前label>/blank.txt`
Expected: 文件存在。

- [ ] **Step 4:【闸门】点击是否生效**

若 Step 2/3 中按钮点击无反应（Studio 预览未把点击传给 composition DOM），执行回退：在 `StudioControlBar.tsx` 的 `ControlBarInner` 加键盘监听——

```tsx
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'n') onNext();
      else if (e.key === 'm') onMark();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onNext, onMark]);
```

并在控制条文本末尾追加提示 `（n=下一个 m=标记）`。重测 Step 2/3 用键盘。提交回退改动：
```bash
cd src && git add preset/StudioControlBar.tsx && git commit -m "feat(preset): 控制条加 n/m 键盘回退"
```
若点击本就生效，跳过本步。

- [ ] **Step 5:【关键】确认叠加层不进渲染视频**

Run:
```bash
cd src && node cli.mjs --audio ../example/en-1.mp3 --lyrics ../example/en-1.srt \
  --title 测试 --preset orig --bg-anim ribbons --duration 2 --output out/check.mp4
```
然后抽一帧检查：
```bash
cd src && ffmpeg -y -i out/check.mp4 -frames:v 1 out/check.png 2>/dev/null && echo "见 out/check.png"
```
Expected: `out/check.png` 顶部**没有**任何控制条（isStudio=false 时组件返回 null）。

- [ ] **Step 6: 全量测试**

Run: `cd src && node --test`
Expected: 全部 PASS。

---

## 自检记录

- **Spec 覆盖**：①画面内叠加层=Task7/8；②显示 preset+bg-anim label+序号=Task7（`/state`）；③下一个(重启切换)=Task4 `/next`+Task7 onNext；④标记 blank.txt=Task4 `/mark`+Task7 onMark；⑤`--debug-bg-anim` 开关=Task5/6；⑥序号按目录名+回环=Task3；⑦不进渲染视频=Task7 isStudio 守卫 + Task9 Step5；⑧风险回退(键盘)=Task9 Step4。全部覆盖。
- **占位符**：无 TODO/TBD，所有代码步均给出完整代码。
- **类型一致**：`prepareAnim` 返回 `{backgroundAnim, backgroundAnimLabel, backgroundAnimKind}` 在 Task1/2/4 一致；`/state` 字段 `{presetLabel, animLabel, animIndex, animTotal}` 在 Task4 服务端与 Task7 客户端 `State` 类型一致；`nextIndex(idx,len)` 定义(Task3)与调用(Task4)一致。
