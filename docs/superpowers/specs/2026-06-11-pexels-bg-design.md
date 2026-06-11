# Pexels 智能背景设计：`--bg-pexels-image` / `--bg-pexels-video`

日期：2026-06-11
状态：设计已确认，待 review → 进入实现计划

## 1. 目标

给 MTV 生成器新增两个背景源参数，自动从 [Pexels](https://www.pexels.com/api/) 拉取与歌曲气质匹配的免费图片/视频作背景：

- `--bg-pexels-image`：每 5 秒一张图，gl-transitions 转场轮播到歌曲结束。
- `--bg-pexels-video`：多段视频顺序拼接，总长 ≥ 歌曲长度。

关键词由 OpenRouter 的 `mistralai/mistral-nemo` 读「提示词 + 歌词」生成。下载素材按 id 缓存并累计使用次数，跨次渲染优先用次数少的，降低重复度。

两参数均为**布尔 flag**（无值），示例：

```bash
node src/cli.mjs --audio example/cn-1.mp3 --lyrics example/cn-1.srt \
  --title "歌名" --preset random --font random --bg-pexels-image
```

## 2. 硬约束

- **视频预拼接**：用系统 **ffmpeg** 在调用 Remotion 之前把多段视频拼接成**单个完整 mp4**（长度 = 歌曲时长，尺寸 = `--res`），再走现有 `--bg-video` 单文件路径渲染。**不改** `types.ts` / `BackgroundLayer` / 各 preset。
- **比例匹配**：下载素材的宽高比必须与 `--res` 生成尺寸相近，再缩放裁剪（cover）到生成尺寸（图片 `objectFit:cover`，视频由 ffmpeg `scale+crop`）。
- **复用现有配置**：图片轮播完全复用 `--bg-image` 目录模式的 `buildCarousel`、`--bg-image-intvl`、`--bg-image-trans`。
- **密钥**：Pexels 与 OpenRouter 的 key 都在 `scripts/api.key`（已 gitignore，格式 `pexels=...` / `openrouter=...`）。

## 3. 数据流

```
cli.mjs（透传布尔 flag）
  └─ render.mjs
       ├─ 解析歌词（已有）→ detectLang(歌词文本) → locale
       ├─ 检测音频时长（提前到背景处理之前）
       ├─ 读 scripts/api.key → {pexels, openrouter}
       └─ pexelsBg.preparePexelsBackground(...)
            1) OpenRouter(mistral-nemo)：提示词 + 歌词 → 20-40 个英文关键词池
            2) orientation = 由 --res 推断（landscape / portrait / square）
            3) 逐槽位选择：
                 取下一个关键词 → Pexels 搜索（query=单个关键词, orientation, locale）
                 → 按宽高比接近度过滤候选
                 → 在「候选 ∩ 未被本次运行用过」里按 usage 升序挑最少用的 id
                 → 命中 cache 则复制，否则下载存 cache；usage[id]++
            4) image → 返回 imageUrls[]，render.mjs 复用 buildCarousel
               video → ffmpeg 把多段缩放裁剪并拼接成单个完整 mp4（长度=歌曲时长、尺寸=--res）
                       → 返回该 public mp4 文件名 → render.mjs 当作 backgroundVideo
```

## 4. 关键词生成

- 端点：`POST https://openrouter.ai/api/v1/chat/completions`，`Authorization: Bearer <openrouter>`。
- 模型：`mistralai/mistral-nemo`。
- 提示词（`{{LYRICS}}` 注入拼接后的歌词文本，要求输出 20-40 个关键词，一行一个）：

```
You are a keyword generator for searching free stock videos on Pexels.
Your task is to read song lyrics and generate search keywords for finding visual
background videos suitable for a music video or lyric video.
Goal: Generate keywords that describe mood, scene, atmosphere, color, motion, and
visual style. The keywords should be useful for searching on Pexels.
Rules:
1. Do not summarize the lyrics.
2. Do not translate the lyrics line by line.
3. Do not generate abstract concepts that cannot be searched visually.
4. Prefer concrete visual keywords.
5. Use simple English keywords.
6. Each keyword should be 1 to 4 words.
7. Avoid names of people, brands, songs, artists, copyrighted characters, or specific places unless clearly needed.
8. Avoid violent, sexual, political, or unsafe keywords.
9. If the lyrics are sad, generate moody, lonely, rainy, night, slow-motion, cinematic keywords.
10. If the lyrics are romantic, generate warm, soft, sunset, couple, flowers, dreamy keywords.
11. If the lyrics are energetic, generate neon, city night, dancing, stage lights, motion, party keywords.
12. If the lyrics are nostalgic, generate vintage, film grain, old room, sunset road, memory, retro keywords.
13. If the lyrics mention nature, generate ocean, waves, forest, mountains, clouds, moon, stars, wind, rain keywords.
14. Include both general keywords and specific search phrases.
15. Output only keywords, one per line. No explanation.
Keyword categories to consider:
* mood: dreamy, lonely, romantic, emotional, peaceful, mysterious
* scene: ocean, beach, city night, forest, road, bedroom, cafe, train station
* weather: rain, fog, snow, wind, storm clouds, sunset, sunrise
* light: neon lights, bokeh lights, soft light, golden hour, moonlight, stage lights
* motion: slow motion, waves, dancing, walking alone, moving clouds, light trails
* texture: film grain, light leak, water reflection, rain window, abstract texture
* music video style: cinematic background, lyric video background, abstract background, visualizer background
Input lyrics:
{{LYRICS}}
Output:
Generate 20 to 40 Pexels search keywords.
```

- 解析：按行 split，trim，去空行、去可能的序号前缀，去重，得到关键词池。
- **用法**：Pexels `query` 是单字符串，一次请求只接受一个查询。**每个关键词 = 一次独立搜索**（每词 1-4 字符合 Pexels 习惯）。需要的搜索次数 = 槽位数：图片 `ceil(时长/intvl)`，视频累积到歌曲长度的若干段。关键词池不够时循环复用并翻页（page 2、3…）取新结果。
- 失败：OpenRouter 整体失败（网络/鉴权/空返回）→ 报错退出（属「LLM 整体失败」）。

## 5. Pexels 搜索与选择

- SDK：官方 `pexels` npm 包，`createClient(pexelsKey)`，`.photos.search(...)` / `.videos.search(...)`。下载用全局 `fetch`（Node 18+）拉 `src`/`link` URL。
- 搜索参数：`{query: 单关键词, orientation, locale, per_page: 15（图）/ 10（视频）, page}`。
- **orientation**：`width > height → landscape`，`height > width → portrait`，相等 → `square`。
- **比例过滤**：目标比 `R = width/height`。
  - 图片：每条结果有 `width/height`，计算 `|w/h − R|`，保留 ≤ 阈值（如 0.25）的候选；全被过滤掉则放宽阈值重试一次，仍无则跳过该关键词。
  - 视频：先在 `video_files` 里选 orientation 一致、分辨率 ≥ 目标且最接近的 file；再用该 file 的 `w/h` 做同样的比例过滤。
- **下载分辨率选择**：
  - 图片：用 `src.original`（最高分辨率原图，cover 裁剪到目标尺寸，保证 ≥ 目标不放大失真）。
  - 视频：选中的 `video_files[].link`。
- **低重复选择**：候选（已过比例过滤、排除本次 run 已用 id）按 `usage[id]` 升序排序（新资源 count=0 最优），取最小者；同 count 保持搜索相关性顺序。

## 6. 缓存与使用次数

- 目录：`cache/pexels/photos/<id>.<ext>`、`cache/pexels/videos/<id>.mp4`（项目根，gitignore 加 `cache/`）。
- 计数：**SQLite 数据库 `cache/usage.sqlite`**，依赖 `better-sqlite3`（同步、简单）。
  - 表：`CREATE TABLE IF NOT EXISTS usage (type TEXT NOT NULL, id INTEGER NOT NULL, count INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (type, id));`，`type ∈ ('photo','video')`。
  - 查最少用：对一批候选 id `SELECT id, count FROM usage WHERE type=? AND id IN (...)`，库中缺失的 id 视作 count=0。
  - 累加：`INSERT INTO usage(type,id,count) VALUES(?,?,1) ON CONFLICT(type,id) DO UPDATE SET count=count+1;`
- 下载前查 cache（文件）：命中则从 cache 复制到 `public/`，不命中才走网络并写入 cache。
- 选中并实际使用后立即对该 id 执行上面的 UPSERT 累加（每个槽位选定即写，避免崩溃丢计数）。
- 复制到 public 的命名：图片 `pexbg-NNN-<id>.<ext>`，视频 `pexvid-NNN-<id>.mp4`。

## 7. 视频拼接（系统 ffmpeg 预拼接成单个 mp4）

在调用 Remotion 之前，用系统 ffmpeg 把已下载的多段视频合成**一个**完整 mp4，再交给现有 `--bg-video` 单文件路径渲染。**不改** `types.ts` / `BackgroundLayer.tsx` / 任何 preset。

- **前置检查**：`--bg-pexels-video` 需要系统 `ffmpeg`（项目已用 `ffprobe`）。缺失则报错退出并提示安装。
- **段数累积**：逐关键词下载视频，累加各段 `duration`（Pexels 视频含 `duration` 秒）直到总和 ≥ 歌曲时长；不足且关键词池耗尽 → 循环复用已下载片段填满。
- **拼接命令**（单次 `filter_complex`：每段 scale 到 cover 再 crop 到精确 `WxH`、统一 fps，再 concat，最后 `-t` 截到歌曲时长）：

```
ffmpeg -y -i c0.mp4 -i c1.mp4 ... \
  -filter_complex \
   "[0:v]scale=W:H:force_original_aspect_ratio=increase,crop=W:H,setsar=1,fps=F[v0]; \
    [1:v]scale=W:H:force_original_aspect_ratio=increase,crop=W:H,setsar=1,fps=F[v1]; \
    ... \
    [v0][v1]...[vN-1]concat=n=N:v=1:a=0[outv]" \
  -map "[outv]" -an -t <歌曲时长> -c:v libx264 -pix_fmt yuv420p \
  public/pexvid-concat.mp4
```

- `W=resWidth, H=resHeight, F=fps`。`force_original_aspect_ratio=increase + crop` = cover，保证每段精确 `WxH`、无黑边。`-an` 去音轨（背景静音）。`-t` 截到歌曲时长。
- 输出 `public/pexvid-concat.mp4`，render.mjs 把它作为 `backgroundVideo`（现有单视频路径，`<Video loop muted cover>`；已等长，loop 不触发）。

## 8. CLI 与互斥

- `cli.mjs`：`booleanFlags` 加 `bg-pexels-image`、`bg-pexels-video`；命中则向 render.mjs 透传对应 flag。
- `render.mjs`：背景源互斥集合扩展为 `['bg-video','bg-image','bg-anim','bg-pexels-image','bg-pexels-video']`，多于一个即报错。
- 时长检测块上移到背景源解析之前（仅依赖已复制的 `public/<audio>`）。

## 9. locale 映射

`detectLang(歌词)` → Pexels locale：

| detectLang | locale |
| --- | --- |
| en | en-US |
| zh_CN | zh-CN |
| zh_TW | zh-TW |
| kr | ko-KR |
| ja | ja-JP |

不在 Pexels 支持列表的 → 回退 `en-US`。

## 10. 兜底（部分容错 + 循环填满）

- 某关键词无结果 / 下载失败 → 跳过，取下一个关键词。
- 视频累积时长不足且关键词池耗尽 → 循环已下载片段填满。
- 仅当「一张图都拿不到」或「一段视频都拿不到」或「OpenRouter 整体失败」→ 报错退出（清晰提示原因）。

## 11. 模块接口（`src/pexelsBg.mjs`）

```js
/**
 * 准备 Pexels 背景。返回 { imageUrls } 或 { videoFile }。
 * @returns image: { imageUrls: string[] }（public 相对文件名，交 buildCarousel）
 *          video: { videoFile: string }（public 相对的已拼接 mp4，交 backgroundVideo）
 */
export async function preparePexelsBackground({
  kind,            // 'image' | 'video'
  lyricsText,      // 拼接后的歌词
  durationSec, width, height, fps,
  locale,
  intvl,           // 仅 image：每张停留秒数（默认 5）
  apiKeys,         // {pexels, openrouter}
  publicDir, cacheDir,
})

// 辅助（可单测，无网络）：
export function parseApiKeys(text)        // 'pexels=..\nopenrouter=..' → {pexels, openrouter}
export function langToLocale(lang)        // 'zh_CN' → 'zh-CN'
export function orientationOf(w, h)       // → 'landscape'|'portrait'|'square'
export function aspectScore(cw, ch, w, h) // |cw/ch − w/h|
export function pickLeastUsed(cands, counts, usedThisRun) // counts: Map<id,count> → 选中 id
export function parseKeywords(text)       // LLM 输出 → string[]
export function buildConcatArgs(clips, w, h, fps, durationSec, outPath) // → ffmpeg 参数数组
// usage SQLite 封装（better-sqlite3）：
export function openUsageDb(cacheDir)     // → {getCounts(type, ids), bump(type, id), close()}
```

## 12. 测试（`node --test`，网络部分 mock）

- `parseApiKeys`：多行/含等号值/缺键。
- `langToLocale`：5 种映射 + 回退。
- `orientationOf`：横/竖/方。
- `aspectScore` / 比例过滤阈值逻辑。
- `pickLeastUsed`：优先 count 0、排除已用、同 count 稳定顺序。
- `parseKeywords`：去序号/空行/去重。
- `buildConcatArgs`：N 段输入 → 正确的 `filter_complex`（scale/crop/fps/concat=n=N）、`-t 时长`、`-an`、输出路径。
- `openUsageDb`：建表、`bump` 后 count 递增、`getCounts` 缺失 id 返回 0（用临时 sqlite 文件）。
- 视频段数累积 + 循环填满逻辑（总时长 ≥ 目标）。
- 端到端 smoke：mock OpenRouter/Pexels/fetch/ffmpeg(exec)，验证 image 返回 imageUrls、video 返回单个 videoFile。

## 13. 依赖与文档

- `src/package.json` 加依赖：`pexels`（官方 SDK）、`better-sqlite3`（usage 计数）。
- 前置：系统 `ffmpeg`（`--bg-pexels-video` 需要）+ 已有的 `ffprobe`。
- `.gitignore` 加 `cache/`。
- `USAGE.md`：在「画面」参数表新增 `--bg-pexels-image` / `--bg-pexels-video` 两行，新增「Pexels 智能背景」小节说明关键词生成、比例匹配、ffmpeg 视频拼接、缓存与低重复策略、api.key 配置、ffmpeg 前置，并在「工作原理」补充 pexels 流程。

## 14. 非目标（YAGNI）

- 不缓存关键词（每次新生成即带来多样性）。
- 不支持手动传 query 覆盖 LLM（保持布尔 flag）。
- 视频拼接用系统 ffmpeg 预合成单个 mp4，**不改** Remotion 组件 / preset。
- 不引入 core-* 类抽象，逻辑集中在单一 `pexelsBg.mjs`。
