# 动画背景特效系统设计

日期：2025-06-07
状态：已确认，待实现

## 目标

抓取 htmlhub.org `/library` 下全部全屏特效（约 71 个），作为可选的动画背景插入 MTV 渲染。同时引入三种互斥的背景源参数，统一各 preset 的背景处理逻辑。

## 参数变更

- `--background <file>` **改名** 为 `--bg-img <filename>`（移除旧名）
- 新增 `--bg-video <filename>`：视频背景，复制进 `public/`
- 新增 `--bganim <label>`：动画特效背景，对应 `src/animbg/<label>/`
- 三者**互斥**：同时指定多个时报错，提示只能用一种背景
- 优先级（仅用于兜底语义，正常互斥）：`bg-video > bg-img > bganim > 渐变兜底`

## 架构（四部分）

### 1. 抓取脚本（Python）

`src/scripts/fetch_animbg.py`，依赖 `requests` + `beautifulsoup4`（写入 `src/scripts/requirements.txt`）。

流程：
1. 抓 `/library`，解析出 7 个类别页 URL（3d-webgl / particles-systems / backgrounds / text-typography / interactive / retro-cyberpunk / celebration）。
2. 遍历类别页，收集 `/library/<cat>/<slug>` 详情页链接（去重，目标约 71 个）。
3. 抓每个详情页，从转义 HTML（`&lt;!DOCTYPE`）中定位并提取自包含特效文档，HTML 反转义得到完整文档。
4. label 用 slug（必要时加类别前缀防重名），写入 `src/animbg/<label>/index.html`。
5. 汇总 `src/animbg/manifest.json`：每条含 `label / name / category / tech(canvas|webgl|svg) / sourceUrl / fetchedAt`。
6. 幂等：重跑覆盖更新；失败条目记录日志、不中断；结尾报告“成功 N / 失败 M”。

礼貌抓取：带 `User-Agent`、请求间隔。

注意：特效为第三方代码，manifest 保留 `sourceUrl` 注明出处；版权/使用场景由用户判断。

### 2. 共享背景组件

`src/preset/BackgroundLayer.tsx`，接收背景 props，互斥按优先级渲染：
- `backgroundVideo` 非空 → `<OffthreadVideo src={staticFile(...)} loop>` 铺满
- 否则 `backgroundImage` 非空 → `<Img>` 铺满
- 否则 `backgroundAnimHtml` 非空 → `<IFrame srcDoc={html}>` 铺满底层
- 否则 → `fallbackGradient`（由各 preset 传入自己的渐变，保留各自视觉风格）

### 3. 8 个 preset 改造

各 `Composition.tsx` 把内联的 `bgSrc ? <Img> : <渐变>` 替换为单个 `<BackgroundLayer .../>`，并传入各自的 `fallbackGradient`。背景逻辑收敛到一处。

### 4. CLI / 参数层

- `types.ts` 的 `MVInputProps` 新增 `backgroundVideo: string`、`backgroundAnimHtml: string`，保留 `backgroundImage`。
- `cli.mjs` / `render.mjs`：实现三个互斥背景参数；`--bg-video` 复制视频进 `public/`；`--bganim` 读取 `animbg/<label>/index.html` 注入 `backgroundAnimHtml`，label 不存在时报错并列出可用项。
- `--help` 文档块、USAGE.md（第 58 行示例、第 122 行参数表）同步更新。

## 数据流

CLI 解析三个互斥背景参数 → render.mjs 复制资源 / 读取 animbg HTML → 写入 props（`backgroundVideo` / `backgroundImage` / `backgroundAnimHtml`）→ preset 的 BackgroundLayer 按优先级渲染。

## 关键风险与 POC（实现第一步）

iframe 是独立上下文，Remotion 的帧时钟劫持（`Date.now`/`requestAnimationFrame`）很可能进不去 iframe，导致输出视频里背景静止在首帧。

**因此实现的第一步是 POC**：抓 1 个 Canvas 类特效，用 `<IFrame srcDoc>` 渲染几秒视频，抽多帧确认背景动画在输出里**真的在动**。
- 动 → 方案成立，按设计推进抓取 + 改造。
- 不动 → 暂停并报告，讨论回退方案（主上下文注入 JS / 动画时间参数化）。

避免在不可行方案上对 71 个特效做无用功。

## 测试 / 验证

- 抓取脚本：跑通后抽查 manifest 数量 + 若干 HTML 可独立打开。
- 渲染：每类背景源（video / img / anim / 渐变）各渲一帧或一小段验证。
- 类型检查：`npx tsc --noEmit` 通过。

## 非目标（YAGNI）

- 不做背景叠加（多背景同时显示）。
- 不做特效参数的二次定制 UI。
- 不做无头浏览器抓取（详情页静态可抓，纯 requests 即可）。
