# WINAMP:移植 butterchurn 内建 preset 到 --bg-anim

日期:2026-06-08
状态:已批准设计,待写实现计划

## 背景与目标

把 `butterchurn-presets` 主集合的 **100 个** Milkdrop preset 移植成 `--bg-anim` 可选的动画背景,统一归入新分类 **WINAMP**,每个赋予一个描述性两词英文名(如 `cosmic-drift`)。

[[carousel-transition-black-frame]] 与已合并的节拍功能(`BeatReactiveAnim`)、vendor 修复同属 bg-anim 体系,本功能复用其机制。

## 技术现实(已实证)

- butterchurn 本身不含 preset;preset 来自独立包 `butterchurn-presets`。主集合 `getPresets()` = **100 个**,全局名 `butterchurnPresets`,原名又长又怪(`$$$ Royal - Mashup (197)` 等)。
- butterchurn preset 不是自包含 HTML,而是 Milkdrop 方程数据,**必须由 butterchurn 运行时(WebGL2 + 音频驱动)实时渲染**。
- **可行性 spike 已通过**:butterchurn 运行时在本项目 Remotion headless chrome + `--gl=angle` 下能初始化 WebGL2、加载 100 个 preset、`render()` 画出非黑 Milkdrop 画面;喂音频后画面明显变亮变满(177KB 帧 vs 静音 84KB)。**确认 preset 输出由音频驱动。**
- **离线音频注入接口已用源码坐实**:`renderer.render({ audioLevels, elapsedTime })`——传 `audioLevels`(含 `timeByteArray`/`timeByteArrayL`/`timeByteArrayR`,时域 Uint8 字节)时调 `this.audio.updateAudio(...)` 用注入数据,完全绕开实时 analyser(`src/rendering/renderer.js:825-836`)。不传才走 `sampleAudio()`。butterchurn 内部自做 FFT → bass/mid/treb。

## 架构

完全复用现有 `--bg-anim` 机制:`animbg/<label>/index.html` → 复制进 `public/animbg/` → iframe 加载 → vendor 复制 → 渲染加 `--gl=angle`。WINAMP preset 就是另外 100 个 `animbg/<label>/`,共享一个 butterchurn 播放器壳,靠离线 FFT 驱动。

四个组成部分:

1. **vendor 库**:`butterchurn.min.js`(192KB)+ `butterchurnPresets.min.js`(638KB)放进 `src/animbg/vendor/`,复用现有 vendor 复制机制(render.mjs 见模板引用 `vendor/` 时复制到 `public/vendor/`)。
2. **共享播放器壳** `src/animbg/vendor/bc-player.js`:建 canvas、`createVisualizer`、按 `window.__BC_PRESET` 从 `getPresets()` 取指定 preset、`loadPreset`,暴露 `window.__bcReady` 与 `window.__bcRenderAt(audioFrame)`,后者内部调 `visualizer.render({audioLevels, elapsedTime})`。
3. **生成脚本** `scripts/gen_winamp.mjs`:读 presets 包(vm 沙箱)+ 固定的「两词名↔原 preset key」映射表 → 为 100 个 preset 各生成薄壳 `src/animbg/<two-word>/index.html`(只声明 `window.__BC_PRESET` + 引用共享壳与 vendor)+ 追加 100 条 manifest(`category:"WINAMP"`)。幂等可重跑。
4. **离线 FFT 注入组件** `src/preset/ButterchurnAnim.tsx`:复用 `@remotion/media-utils` 逐帧取波形,`delayRender` + `__bcRenderAt` 把每帧时域字节喂进壳,确定性渲染、防黑帧(复用 carousel 的 `delayRender + __renderAt` 范式)。

## 命名(描述性两词名)

- **从原 preset key 机械提取**两词名,确定、可追溯、可重跑,无需人工逐个命名。
- 提取规则:取原名中的有意义词(优先作者名 + 一个关键词;原名常见格式 `作者 - 标题 - 变体...`),小写化、去符号、取前两个有意义 token,用短横线连接 → `<word>-<word>`。例:`$$$ Royal - Mashup (197)` → `royal-mashup`;`_Aderrasi - Wanderer in Curved Space ...` → `aderrasi-wanderer`。
- **去重**:两词名冲突时,追加判别后缀(如数字或第三个 token 的首段)使其唯一,但仍保持机械可推导。
- 最终产出一张确定的「两词名 ↔ 原 preset key」映射表(JSON,随脚本提交),恰好 100 条。
- 全部唯一,全小写短横线,与现有 label 风格一致(如 `hex-wave`)。去重后个别名可能含数字后缀,允许放宽 label 正则到 `^[a-z0-9]+(-[a-z0-9]+)+$`。

## 数据流(每帧,渲染时)

```
useCurrentFrame(frame) + useAudioData(audioSrc)
  → 从 channelWaveforms 取 frame 对应时间窗口的样本(长度 = fftSize 1024)
  → Float32(-1..1) 转 Uint8(0..255,中心 128):timeByteArray / L / R
  → delayRender 阻塞本帧
  → iframe.__bcRenderAt({timeByteArray, timeByteArrayL, timeByteArrayR, elapsedTime})
       → 壳内 visualizer.render({audioLevels:{...}, elapsedTime})
  → rAF 等一帧绘制 → continueRender
```

确定性来源:第 N 帧取的波形窗口由 `frame/fps` 决定,与渲染顺序无关。

## 组件分流

- **新建 `ButterchurnAnim`**(不复用 `BeatReactiveAnim`):两者都是 delayRender + 喂音频进 iframe,但喂的数据不同(BeatReactive 喂虚拟时间标量;Butterchurn 喂时域字节数组),职责分开更清晰。
- `BackgroundLayer` 据 label 是否属 WINAMP 分类(查 manifest)选用 `ButterchurnAnim` 还是现有分支。
- **WINAMP 不叠 CSS 脉冲**:preset 本身即音频反应,外层再叠 scale/brightness 会画蛇添足。`--bg-anim-beat` 对 WINAMP 类只做音频注入,不施加 CSS 通道。

## 错误处理(静默降级,绝不黑屏崩渲染)

- preset 加载失败 / WebGL2 不可用 → 壳内 try/catch,画静态深色背景兜底。
- `useAudioData` 未就绪 → 当帧喂静音字节(全 128),壳照常 render,不阻塞。
- iframe 未暴露 `__bcRenderAt` → 跳过注入,delayRender 用超时+cleanup 释放(同 carousel),不挂死。

## 测试策略

1. **生成脚本单测**(node:test):mock presets + mock 映射表,断言生成 HTML 含正确 `__BC_PRESET`、manifest 条目 category=WINAMP、唯一性/计数校验生效。
2. **命名映射校验单测**:断言映射表 100 条、label 全唯一且匹配 `^[a-z0-9]+(-[a-z0-9]+)+$`(允许去重后缀)、每个 presetKey 存在于真实包;并断言提取规则对几个已知原名产出预期两词名。
3. **波形转换单测**:Float32(-1..1)→Uint8(0..255 中心 128)正确、窗口长度 = fftSize、静音→全 128。
4. **端到端冒烟**:渲染 3-5 个代表性 WINAMP preset 各一小段,抽帧判定非黑;确认 `--gl=angle` 自动加、vendor 复制、音频注入生效。
5. **回归**:现有 72 模板 + 节拍功能不受影响(manifest 只追加,组件按分类分流)。

## 风险 / 边界

- **实现 Task 1 先验证**:`render({audioLevels})` 注入接口在浏览器壳里实测——喂时域字节后画面确随音频变化(源码已确认入口,需实测闭环)。失败则止损。
- **波形窗口→Uint8 转换**有数值细节(范围映射、窗口长度匹配 fftSize 1024),单测覆盖。
- **100 个 preset 不逐一渲染验证**:抽样 3-5 个,其余同构,文档标明(同 VANTA 那批处理方式)。
- **库体积**:vendor 增 ~830KB,100 个薄壳各几百字节,仓库增量 <1MB。

## 交付物

- vendor 库 2 文件(butterchurn.min.js、butterchurnPresets.min.js)
- 共享壳 `src/animbg/vendor/bc-player.js`
- 生成脚本 `scripts/gen_winamp.mjs` + 映射表 JSON
- `src/preset/ButterchurnAnim.tsx`
- `BackgroundLayer` 分类分流
- 生成的 100 个 `animbg/<two-word>/index.html` + manifest WINAMP 段
- 单测(生成脚本、命名映射、波形转换)
- USAGE.md 更新(WINAMP 分类说明)