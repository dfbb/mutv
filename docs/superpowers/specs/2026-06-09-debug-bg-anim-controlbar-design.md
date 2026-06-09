# 设计：`--debug-bg-anim` Studio bg-anim 控制条

日期：2026-06-09
状态：已与用户确认，待写实现计划

## 1. 背景与目标

在 `node src/cli.mjs ... --html` 打开的 Remotion Studio 预览里，提供一个调试用控制条，用于**逐个浏览 172 个 bg-anim 效果并标记看中的**。需求：

- 在预览画面上显示当前 **bg-anim label** 和 **preset label**，以及当前 bg-anim 在排序列表中的**序号/总数**。
- bg-anim label 右侧两个按钮：
  - **下一个**：切换到下一个 bg-anim，并真正让 Studio 加载它。
  - **标记**：在该 bg-anim 目录下创建空文件 `blank.txt`。
- 整个功能由新开关 **`--debug-bg-anim`** 控制；不带该开关时维持现状。

## 2. 关键约束

Remotion Studio 左侧 Compositions 面板是 `remotion` npm 包预编译的界面，**没有公开 API 注入自定义 UI**。因此控制条做成 **composition 画面内的叠加层**，用 `getRemotionEnvironment().isStudio` 限定只在 Studio 预览出现。`remotion render` 渲染视频时 `isStudio === false` → 叠加层返回 `null`，**绝不进入最终视频**。

Studio 在启动时从 `--props` 文件读取 inputProps；运行中改 props 文件不会自动生效。所以「下一个」通过**重启 studio 子进程**（同端口）来加载新 bg-anim，是最干净可靠的方式。

环境已确认：Remotion v4.0.417，`@remotion/studio`、`getRemotionEnvironment().isStudio` 均可用。

## 3. 架构

```
cli.mjs  --html --bg-anim X --debug-bg-anim
   │
   └─> render.mjs（--html 分支）
          │  带 --debug-bg-anim 时：
          └─> studioControl.mjs  ── 监听 :3001（控制服务 + studio 子进程管家）
                  │   spawn / kill / respawn
                  └─> npx remotion studio <presetEntry> --props=.render-props.json  ── :3000
                          │
                          └─> 各 preset composition 渲染 <StudioControlBar/>（仅 isStudio 时显示）
                                  fetch :3001/state、POST :3001/next、POST :3001/mark
```

不带 `--debug-bg-anim` 时，render.mjs 维持现状直接 spawn studio，不起控制服务；叠加层 `fetch :3001` 失败 → 渲染 null。

## 4. 组件清单

### A. `src/preset/StudioControlBar.tsx`（新增，自包含）

- `if (!getRemotionEnvironment().isStudio) return null`
- 挂载时 `fetch('http://localhost:3001/state')`：
  - 失败（未开 debug / 服务没起）→ 渲染 `null`
  - 成功 → 拿 `{presetLabel, animLabel, animIndex, animTotal}`
- 渲染顶部固定条（`position:absolute; top:0; z-index:99999; pointer-events:auto`）：
  `preset: orig　·　bg-anim: ribbons (12/172)　[下一个]　[标记]`
- **下一个**：`await fetch('http://localhost:3001/next', {method:'POST'})` 成功后 `window.location.reload()`
- **标记**：`await fetch('http://localhost:3001/mark', {method:'POST'})` 成功后按钮显示 ✓（标记态）
- 是否「调试模式」天然由控制服务是否可达驱动，**不透传额外 prop**。

挂载点：8 个 preset 的顶层组件各加 1 行 import + 1 行 `<StudioControlBar/>`（与 `<BackgroundLayer/>` 同级）：
`apple/Composition.tsx`、`bounce/Composition.tsx`、`cinema/Composition.tsx`、`ktv/Composition.tsx`、`neon/Composition.tsx`、`no2/Composition.tsx`、`typewriter/Composition.tsx`、`orig/AudioVisualization.tsx`。

### B. `src/animbgPrepare.mjs`（新增，从 render.mjs 抽出）

把 `render.mjs:458-505` 那段 anim 准备逻辑抽成可复用函数：

```
prepareAnim({ label, beatReactive }) → { backgroundAnim, backgroundAnimLabel, backgroundAnimKind }
```

内部：读 `src/animbg/<label>/index.html` → `needsVirtualMouse`/`injectVirtualMouse` → `beatReactive` 时 `injectBeatClock` → 写 `public/animbg/animbg-<label>.html` → 查 `animbg/manifest.json` 定 `winamp` kind → html 含 `vendor/` 时 `cpSync` vendor 到 `public/vendor`。

render.mjs 原 inline 块替换为对该函数的调用（复用，给「下一个」共用同一套拷贝逻辑）。

### C. `src/studioControl.mjs`（新增，控制服务 + studio 子进程管家）

仅在 `--debug-bg-anim` 时由 render.mjs 启动。导出：

```
startStudioControl({ presetEntry, propsFile, animList, currentIndex, presetLabel, beatReactive, prepareAnim })
```

职责：
- **接管 studio 子进程**：`spawnStudio()` = `spawn('npx', ['remotion','studio',presetEntry,'--props='+propsFile], {stdio:'inherit'})`。区分「我们主动重启的 kill」与「真实退出」：真实退出才 `process.exit`。
- **HTTP 服务监听 3001**（端口被占用则报错退出，不自动找空口）。所有响应带 CORS 头 `Access-Control-Allow-Origin: *`。
- 内存状态：`animList`(按目录名排序的全部含 index.html 的 label)、`currentIndex`、`presetLabel`、`beatReactive`。

端点：
- `GET /state` → `{ presetLabel, animLabel: animList[currentIndex], animIndex: currentIndex+1, animTotal: animList.length }`
- `POST /next`：
  1. `currentIndex = (currentIndex + 1) % animList.length`
  2. `prepareAnim({label: animList[currentIndex], beatReactive})`
  3. 读 `.render-props.json`，更新 `backgroundAnim`、`backgroundAnimKind`，写回
  4. 主动 kill studio 子进程并 respawn
  5. **轮询 `http://localhost:3000` 直到返回 200（间隔 200ms，超时 20s）再响应**，使叠加层收到响应即可安全 reload
  6. 返回新的 state
- `POST /mark`：`writeFileSync('src/animbg/<animList[currentIndex]>/blank.txt', '')` → 返回 `{ marked: true }`

### D. `render.mjs` `--html` 分支改动

- 新增解析布尔 flag `debug-bg-anim`（加入 `booleanFlags`）。
- `--html` 分支：
  - 带 `--debug-bg-anim` → 调 `startStudioControl(...)`（由它 spawn/管理 studio）。
  - 不带 → 维持现状 inline spawn studio。
- 计算 `animList`（排序）、`currentIndex`（当前 label 在 animList 的下标）传入。

### E. `cli.mjs`

`booleanFlags` 加 `debug-bg-anim`；透传 `--debug-bg-anim` 给 render.mjs（与现有 `--no-bg-anim-beat` 等同款透传）。文档注释补一行。

## 5. 「下一个」序号逻辑

`animList` = `src/animbg/` 下所有含 `index.html` 的目录名，按名排序。当前 label 的下标 = 序号（0-based，展示用 1-based）。`(idx+1) % len` 推进、到底回头。label 展示 `(序号/总数)`，如 `(12/172)`。

## 6. 数据流

1. 用户 `--html --bg-anim ribbons --debug-bg-anim` → render.mjs 准备初始 anim + props → `startStudioControl` 起 3001 + spawn studio(3000)。
2. 浏览器打开 3000，composition 渲染 `<StudioControlBar/>`，fetch 3001/state → 显示 `bg-anim: ribbons (N/172)`。
3. 点「下一个」→ POST 3001/next → 服务改 props + 重启 studio + 等 3000 就绪 → 叠加层 reload → 新 bg-anim 加载，序号 +1。
4. 点「标记」→ POST 3001/mark → `src/animbg/<当前label>/blank.txt` 生成。

## 7. 错误处理

- 3001 端口被占用 → 启动即报错退出，提示换/关占用进程。
- `/next` 重启后 20s 内 3000 仍不就绪 → 返回 500，叠加层提示「切换超时，请手动刷新」。
- `/mark` 写文件失败 → 返回 500，叠加层提示失败。
- 叠加层 fetch 3001 失败（非 debug 模式）→ 静默渲染 null，不报错。

## 8. 关键风险与验证

**唯一不确定点：Studio 预览画面内的 DOM 按钮能否接收点击。** 设计上用 `pointer-events:auto` + 高 z-index 兜底。**实现后必须手动验证点击生效**；若不行，回退为：叠加层监听键盘 `n`(下一个)/`m`(标记)，label 提示「按 n 下一个 / m 标记」。

## 9. 测试

- `src/animbgPrepare.mjs`：单元测试覆盖「普通 anim」「winamp kind」「含 vendor」三种，断言 public 产物与返回值（沿用现有 `animbgInject.test.mjs` 风格）。
- `studioControl.mjs` 的 `/next` 序号推进与回环：纯函数化 `nextIndex(idx,len)` 单测。
- 端到端（手动）：`--html --bg-anim X --debug-bg-anim` 跑起来，点两个按钮，确认切换 + reload + blank.txt 生成；并确认 `remotion render`（不带 debug）输出视频里**无叠加层**。

## 10. 范围外（YAGNI）

- 不做端口自动探测、不做配置化端口。
- 不做「上一个」按钮、不做跳转到指定序号。
- 不做标记列表管理 UI（标记只产生 blank.txt，后续筛选用文件系统）。
- 不重构 BackgroundLayer 的控制流（叠加层用 8 处一行挂载，低风险自包含）。
