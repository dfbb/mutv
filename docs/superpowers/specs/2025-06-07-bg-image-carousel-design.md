# 背景图目录轮播（gl-transitions 转场）设计

日期：2025-06-07
状态：已确认，待实现

## 目标

让 `--bg-image` 支持传入**目录**。目录内多张图片时，用 `src/lib/gl-transitions` 的 GLSL 转场做随机转场的背景轮播，循环到歌曲结束；每张图按"图片比例 vs 屏幕比例"自动选择缩放/平移方式（Ken Burns），永不拉伸变形。

## 参数

- `--bg-image <文件|目录>`：已有参数，扩展为同时支持文件和目录
- `--bg-image-intvl <秒>`：每张图停留秒数，默认 5；非正数报错
- `--bg-image-trans <soft|cool|hard>`：随机转场分组，默认 `soft`；非法值报错并列出可选
- 转场时长固定 **1 秒**，叠加在停留之后（intvl=5 → 停 5 秒 + 转 1 秒）

## 触发逻辑（自动判别文件/目录）

`--bg-image` 的值：
- 是**文件** → 现有单图逻辑不变（`<Img objectFit:cover>`）
- 是**目录** → 扫描图片（jpg/jpeg/png/webp/gif，非图片忽略），按文件名排序：
  - 0 张 → 报错
  - 1 张 → 等同单图（`backgroundImage`）
  - 多张 → 生成轮播 HTML，走 `<IFrame src>`（与 `--bg-anim` 相同的隔离方式）

三者互斥：`--bg-image` / `--bg-video` / `--bg-anim` 同时只能用一个（沿用现有 `bgFlags` 校验）。

## 架构与数据流

### WebGL 引擎与库布局

转场用 **gl-transition runtime + regl** 在浏览器端跑 GLSL。库 vendor 进仓库（自包含 HTML 经 `<IFrame src>` 在 headless 加载，不能依赖网络 CDN）：

- `src/lib/gl-transitions/gl-transition-transform.js`（**已有**，Node 离线脚本：解析 `transitions/*.glsl` → JSON，含 name/glsl/defaultParams）
- `src/lib/gl-transitions/transitions/*.glsl`（**已有**，121 个）
- `src/lib/gl-transitions/` 下再加 **gl-transition 浏览器 runtime**（待加，UMD/打包版，负责把 GLSL 片段包成 shader 并配合 regl 绘制）
- `src/lib/regl/regl.min.js`（待加，UMD，WebGL 封装）

### 新模块

- `src/lib/transitionGroups.mjs`：把 121 个转场名预分三组，导出 `{soft:[...], cool:[...], hard:[...]}`。
  - soft：淡入淡出/滑动/缩放/圆开合等柔和类
  - cool：翻页/立方/扭曲波纹等炫彩类
  - hard：故障/像素化/燃烧/马赛克等粗野类
- `src/lib/buildCarousel.mjs`：生成自包含轮播 HTML。
  - 输入：图片文件名列表、intvl、转场组、屏幕宽高
  - 内联 regl + gl-transition runtime + 选中组的 GLSL 数据
  - 输出 HTML：`<canvas>` 铺满 + 调度脚本（rAF 驱动，"停 intvl 秒 + 转 1 秒"推进，循环图片列表；每次转场从指定组随机抽一个；每张图按 R 算 Ken Burns 配置）

### render.mjs 目录多图分支

1. 扫描+按文件名排序图片；0 张报错；1 张走单图；多张继续
2. 复制图片到 `public/`（去重命名，如 `bgimg-0-<name>`）
3. 复制 regl + gl-transition runtime 到 `public/`
4. `buildCarousel(...)` 生成 `bgimage-carousel.html` 写入 `public/`
5. 设 prop `backgroundCarousel = 'bgimage-carousel.html'`
6. 日志打印：轮播图片数、间隔、转场组

时间轴用 rAF + `performance.now()` 驱动（Remotion 渲染时劫持，保证逐帧确定）。

### 类型与 prop（types.ts）

- 新增 `backgroundCarousel: string`（轮播 HTML 文件名，默认 `''`）
- 优先级链：`video > carousel > image > anim > 渐变`（carousel 是 image 的多图增强版，排在 image 前）

### BackgroundLayer.tsx

新增分支：`backgroundCarousel` 非空 → `<IFrame src={staticFile(...)}>`（与 anim 分支同构）。

## 缩放/平移规则（6 条 → 统一 R 阈值）

用 **R = 图片宽高比 ÷ 屏幕宽高比**（AR=宽/高）分档。R 把"图片相对屏幕宽窄"与屏幕比例解耦，横竖屏共用同一套阈值。

| 档（R） | 处理 | Ken Burns |
|---|---|---|
| ① 接近 0.8–1.25 | cover 居中 | 等比缩放 1.0→1.08，无平移 |
| ② 明显宽 1.25–1.8 | cover | 缩放 ~1.05，左右平移（露左右富余） |
| ③ 明显窄 0.55–0.8 | cover | 缩放 ~1.05，上下平移（露上下富余） |
| ④ 极宽 >1.8 | cover | 缩放小（1.0→1.03），横向慢移（幅度大、速度慢） |
| ⑤ 极窄 <0.55 | 背景模糊 cover + 前景 contain | 前景 contain 完整显示原图；背景模糊层轻微缩放 |

实现要点：
- Ken Burns 的缩放/平移通过调整传给 shader 的纹理 UV 取样窗口（或绘制变换）实现，逐帧按 rAF 时间线性插值。
- 平移方向恒为 cover 后有富余的轴：宽图露左右、窄图露上下，与横竖屏无关。
- ⑤ 极窄是唯一特殊布局：两次 draw —— 模糊放大层铺底 + 前景 contain 清晰层。
- ⑥ 全程等比缩放，只移动取样窗口，**绝不拉伸变形**（不用 fill/stretch）。

横竖屏换算示例（验证直觉）：
- 横屏 1080×720（屏 AR=1.5）：16:9（1.78）→ ①接近；9:16（0.56）→ ⑤极窄
- 竖屏 720×1080（屏 AR=0.667）：9:16（0.56）→ ①接近；16:9（1.78）→ ④极宽（横向慢移露全景）

## 验证策略

- `npx tsc --noEmit` 通过
- 用 `example/mbg`（6 张不同比例图）跑：`--bg-image example/mbg --bg-image-intvl 3`，横屏 1080x720 与竖屏 720x1080 各渲多帧，人工核验：
  - 转场在动（不同帧画面不同）
  - Ken Burns 平移/缩放在动
  - 各类比例的图按对应档处理、无拉伸变形
- 错误路径各测：单图目录（走单图）、空目录（报错）、非法 `--bg-image-trans` 值（报错列出可选）
- 临时产物（public/ 下生成文件）渲染后清理

## USAGE.md 更新

- `--bg-image` 说明改为"文件或目录；目录多图时自动转场轮播"
- 新增 `--bg-image-intvl`、`--bg-image-trans` 参数行
- 列出三个转场组（soft/cool/hard）及风格简介

## 非目标（YAGNI）

- 不做转场时长参数化（固定 1 秒）
- 不做每张图单独指定转场/缩放方式
- 不做视频与轮播叠加（背景源互斥）
- 不引入打包构建步骤（库用 vendored UMD，运行时复制到 public/）
