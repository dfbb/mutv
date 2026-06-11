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

- **视频预拼接**：用系统 **ffmpeg** 在调用 Remotion 之前把多段视频拼接成**单个完整 mp4**（长度 = 歌曲时长，尺寸 = `--res`），再走现有 `--bg-video` 单文件路径渲染。背景源本身**不改任何 preset**；仅 `BackgroundLayer.tsx` + `types.ts` 因「最后 1 秒右下角署名字幕」各做一处小改（见 §7.1，靠 `getInputProps()` 无需改 preset）。
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
            4) image → 返回 imageUrls[] + credits[]，render.mjs 复用 buildCarousel
               video → ffmpeg 把多段缩放裁剪并拼接成单个完整 mp4（长度=歌曲时长、尺寸=--res）
                       → 返回该 public mp4 文件名 + credits[] → render.mjs 当作 backgroundVideo
            5) render.mjs 用 credits[]：写 out/<basename>.credits.md + 注入 pexelsCreditsText
               （最后 1 秒右下角屏上署名，Pexels 合规）
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

- 解析：按行 split，trim，去空行、去序号/项目符号前缀，去重。**截断到最多 40 个**（实测 nemo 可能返回 48 个，超出即 `slice(0,40)`）。
- **用法**：Pexels `query` 是单字符串，一次请求只接受一个查询。**每个关键词 = 一次独立搜索**（每词 1-4 字符合 Pexels 习惯）。需要的搜索次数 = 槽位数：图片 `ceil(时长/intvl)`，视频累积到歌曲长度的若干段。关键词池不够时循环复用并翻页（page 2、3…）取新结果。
- 失败：OpenRouter 整体失败 → 报错退出。专项报警：**HTTP 402 = 余额不足/欠费**、**429 = 速率限制**、**401 = 鉴权失败**，各打印对应中文错误后退出（已在探针 `scripts/test-openrouter-keywords.mjs` 验证）。

## 5. Pexels 搜索与选择

- **HTTP 客户端：搜索用官方 `pexels` SDK（反爬必需——裸 `fetch` 在持续调用下会被反爬拦截）**。`createClient(pexelsKey)`，`.photos.search(...)` / `.videos.search(...)`。下载素材文件走 CDN（images./videos.pexels.com），用全局 `fetch` 即可。
- **配额/报警与预算**：SDK 不暴露 `X-Ratelimit-*` 响应头，故**限流防护以客户端预算上限为主**（见下），不依赖响应头。SDK 调用 best-effort 容错：抛错或返回 `{error}` → 视为该次搜索失败；疑似限流（429/"Too Many Requests"）或**累计失败达预算上限** → 打印中文错误后退出。`401/鉴权失败`（key 错）同样退出。硬上限：
  - `maxPagesPerKeyword = 3`（每个关键词最多翻 3 页）。
  - `maxAttemptsPerSlot = 8`（单个槽位最多尝试 8 次搜索/候选后放弃该槽位）。
  - `requestBudget`（全局 Pexels 请求数上限，默认 `min(150, 槽位数×4)`）；超预算即停止继续搜索，用已得素材兜底（循环填满/减少图数）。
- 搜索参数：`{query: 单关键词, orientation, locale, per_page: 15（图）/ 10（视频）, page, size}`。图片用 `size=large`（≥24MP 优先）做粗筛以提高满足最小分辨率的概率。
- **orientation**：`width > height → landscape`，`height > width → portrait`，相等 → `square`。
- **比例过滤**：目标比 `R = width/height`，候选比 `r = w/h`，保留 `|r − R| ≤ 0.35` 的（实拍图常见 3:2=1.5，对 16:9=1.778 偏差 0.278，阈值须放宽到 0.35，否则误杀大量正常素材）；全被过滤则放宽到 0.6 重试一次，仍无则跳过该关键词。
  - 图片：用结果的 `width/height` 过滤。
  - 视频：先在视频级用 `v.width/v.height` 过滤掉超宽/超窄片（如 3840×1600=2.4）。
- **下载分辨率选择**：
  - 图片：**先按最小分辨率过滤** `photo.width ≥ resWidth && photo.height ≥ resHeight`（保证不放大；动态裁剪 `fit=crop` 在原图过小时会拉伸放大，故此过滤必须前置）；满足后再**不下原图**（实测原图可达 12000px / 数 MB），用 Pexels 动态裁剪 `<src.original>?auto=compress&cs=tinysrgb&w=W&h=H&fit=crop&dpr=1` 取目标尺寸已 cover 裁剪的小图。最小分辨率过滤后无候选 → 跳过该关键词。
  - 视频：在 `video_files` 里**先剔除非法档**——只保留 `Number.isFinite(width) && Number.isFinite(height)` 且**直链 mp4**（`file_type === 'video/mp4'` 或 link 以 `.mp4` 结尾）的；**HLS/m3u8/其它格式跳过**（否则缓存成 .mp4 后 ffmpeg 拼接失败）。再在合法档里选 orientation 一致、**分辨率 ≥ 目标且面积最接近**目标的档（**不取最大**——实测最大档可达 4K/53MB；多数视频有现成 1280×720）。无 ≥ 目标的档则取最大合法档；无任何合法 mp4 档 → 跳过该视频。取该档 `link`。
- **低重复选择**：候选（已过比例/最小分辨率过滤、排除本次 run 已用 id）按 `usage[id]` 升序排序（新资源 count=0 最优），取最小者；同 count 保持搜索相关性顺序。

## 6. 缓存、使用次数与 Pexels 署名（attribution）

- 资源文件（缓存键含决定文件内容的参数，避免换 `--res` 二次渲染串用旧尺寸；并按媒体 id **末尾两位散列成两级目录**避免单目录文件过多）：
  - 散列：`shard(id) = <倒数第二位>/<最后一位>`（id 不足两位前补 0，如 id=7 → `0/7`），100 个桶；按媒体 id（photoId/videoId）散列，同一视频多 fileId 落同一桶。
  - 图片 `cache/pexels/photos/<shard(photoId)>/<photoId>-<W>x<H>-crop.jpg`（**键含目标 `WxH`**——图按 `fit=crop&w=W&h=H` 下载，不同 `--res` 内容不同）。
  - 视频 `cache/pexels/videos/<shard(videoId)>/<videoId>-<fileId>.mp4`（**键含 `video_files[].id`**——同一 video 有多个不同分辨率/fps 的 file，只按 video id 会串用错文件）。
- **SQLite `cache/usage.sqlite`**（`better-sqlite3`），两张表：
  - `usage(type TEXT, id INTEGER, count INTEGER DEFAULT 0, PRIMARY KEY(type,id))`，`type ∈ ('photo','video')`，**按 Pexels 媒体 id 统计**（图片按 photoId、视频按 videoId，均不含尺寸/fileId，保证跨分辨率多样性一致）。查最少用 `SELECT id,count FROM usage WHERE type=? AND id IN (...)`（缺失 = 0）；累加 `INSERT ... ON CONFLICT(type,id) DO UPDATE SET count=count+1`。
  - `attribution(type TEXT, id INTEGER, author TEXT, author_url TEXT, pexels_url TEXT, PRIMARY KEY(type,id))`——下载时从搜索结果写入（图片 `photographer`/`photographer_url`/`url`；视频 `user.name`/`user.url`/`url`）。cache 命中也据此补全署名。
- 下载前查 cache（文件）：命中则从 cache 复制到 `public/`，不命中才走网络并写入 cache；两种情况都 upsert `attribution`。
- 选中并实际使用后立即 upsert `usage` 累加（每槽位选定即写，避免崩溃丢计数）。
- 复制到 public 的命名：图片 `pexbg-NNN-<photoId>.jpg`，视频 `pexvid-NNN-<videoId>.mp4`。
- **合规署名输出（两路）**：每个**实际用到**的素材收集 `{author, author_url, pexels_url}`，render.mjs：
  1. 写 sidecar `out/<basename>.credits.md`：顶部一行 "Photos/Videos provided by Pexels (https://www.pexels.com)"，逐条 "- Photo/Video by <author> (<author_url>) — <pexels_url>"（完整清单，供视频描述/存档）。
  2. 生成**屏上署名**：把素材作者拼成一行简短文本，作为 `pexelsCreditsText` 传入 Remotion，最后 1 秒打印在背景右下角（见 §7.1）。
  二者满足 Pexels Guidelines「展示 Pexels 链接 + 尽量 credit 作者」。

## 7.1 署名片尾字幕（最后 1 秒，背景右下角）

把 credits 生成一条小字幕，在视频**最后 1 秒叠加在背景右下角**（不替换背景，视频/图片照常显示）。图片与视频两条路径统一，**不改各 preset**：

- 文本来源：render.mjs 用实际用到的素材作者去重拼一行，如 `Backgrounds via Pexels — Jane Doe, John Roe`（作者过多则截断为 `…等N位`），作为 `pexelsCreditsText` 写入 Remotion props。
- 渲染位置：**共享 `BackgroundLayer.tsx`** 内实现，靠 Remotion `getInputProps()` 直接读 `pexelsCreditsText`（避免逐 preset 透传）。当 `getInputProps().pexelsCreditsText` 非空且 `useCurrentFrame() ≥ durationInFrames − fps`（最后 1 秒）时，在背景之上渲染一个绝对定位的右下角小字幕（`position:absolute; right:24px; bottom:24px; 半透明深色底 + 白字 + 小字号 + 圆角内边距`），叠在背景图/视频上方。
- `types.ts` 的 `MVInputProps` 新增 `pexelsCreditsText: string`（默认 `''`，空=不显示），仅为类型完整；实际取值走 `getInputProps()`。
- 边界：非 pexels 背景时 `pexelsCreditsText=''`，不渲染、零影响。`getInputProps()` 若拿不到（理论上不会，render.mjs 经 `--props` 注入）→ 回退为经 BackgroundLayer prop 透传（需改各 preset 调用点）；实现时先验证 `getInputProps()` 可用。
- 注：字幕在 BackgroundLayer 内，理论上位于 preset 前景之下；右下角通常无前景元素，实测若被遮挡再提升层级。

## 7. 视频拼接（系统 ffmpeg 预拼接成单个 mp4）

在调用 Remotion 之前，用系统 ffmpeg 把已下载的多段视频合成**一个**完整 mp4，再交给现有 `--bg-video` 单文件路径渲染。背景源不改任何 preset（署名字幕的 BackgroundLayer/types 小改见 §7.1）。

- **前置检查**：`--bg-pexels-video` 需要系统 `ffmpeg`（项目已用 `ffprobe`）。缺失则报错退出并提示安装。
- **段数累积**：逐关键词下载视频，累加各段 `duration`（Pexels 视频含 `duration` 秒）直到总和 ≥ 歌曲时长；不足且关键词池耗尽 → 循环复用已下载片段填满。
- **高质量近无损**：拼接 mp4 是**中间产物**，之后会被 Remotion 二次编码成最终视频；两次编码叠加损失，故中间用接近无损参数（`-crf 16 -preset slow`），把质量瓶颈留给最终 `--crf`，避免双重压缩伪影。
- **拼接命令**（单次 `filter_complex`：每段 scale 到 cover 再 crop 到精确 `WxH`、统一 fps，再 concat，最后 `-t` 截到歌曲时长）：

```
ffmpeg -y -i c0.mp4 -i c1.mp4 ... \
  -filter_complex \
   "[0:v]scale=W:H:force_original_aspect_ratio=increase,crop=W:H,setsar=1,fps=F[v0]; \
    [1:v]scale=W:H:force_original_aspect_ratio=increase,crop=W:H,setsar=1,fps=F[v1]; \
    ... \
    [v0][v1]...[vN-1]concat=n=N:v=1:a=0[outv]" \
  -map "[outv]" -an -t <歌曲时长> \
  -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p \
  public/pexvid-concat.mp4
```

- `W=resWidth, H=resHeight, F=fps`。`force_original_aspect_ratio=increase + crop` = cover，保证每段精确 `WxH`、无黑边。`-an` 去音轨（背景静音）。`-t` 截到歌曲时长。`-crf 16 -preset slow` = 近无损中间件。
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

## 10. 兜底与报警

**部分容错 + 循环填满**：
- 某关键词无结果 / 单次下载失败 → 跳过，取下一个关键词。
- 视频累积时长不足且关键词池耗尽 → 循环已下载片段填满。
- 仅当「一张图都拿不到」或「一段视频都拿不到」→ 报错退出（清晰提示原因）。

**硬报警（立即退出，不容错）**：
- **OpenRouter 402** → 「余额不足/欠费」；**429** → 「速率限制」；**401** → 「鉴权失败」。
- **Pexels 疑似限流**（SDK 抛错/解析失败/"Too Many Requests"，因 SDK 不暴露响应头，按 best-effort 判定）或**累计失败达预算上限** → 「次数限制/请求失败」；**鉴权失败**（key 错）→ 「鉴权失败」。
- 这两类是账户级故障，重试无意义，打印对应中文错误后 `exit(1)`。

## 11. 模块接口（`src/pexelsBg.mjs`）

```js
/**
 * 准备 Pexels 背景。返回含背景源 + 署名清单。
 * @returns image: { imageUrls: string[], credits: Credit[] }（imageUrls 交 buildCarousel）
 *          video: { videoFile: string, credits: Credit[] }（videoFile 交 backgroundVideo）
 *   Credit = { type:'photo'|'video', id, author, authorUrl, pexelsUrl }（仅实际用到的素材）
 */
export async function preparePexelsBackground({
  kind,            // 'image' | 'video'
  lyricsText,      // 拼接后的歌词
  durationSec, width, height, fps,
  locale,
  intvl,           // 仅 image：每张停留秒数（默认 5）
  apiKeys,         // {pexels, openrouter}
  publicDir, cacheDir,
  limits,          // {maxPagesPerKeyword:3, maxAttemptsPerSlot:8, requestBudget}
})

// render.mjs：用返回的 credits ① 写 out/<basename>.credits.md；
//             ② 经 renderCreditsLine() 生成屏上一行，作为 pexelsCreditsText 注入 props。

// 辅助（可单测，无网络）：
export function parseApiKeys(text)        // 'pexels=..\nopenrouter=..' → {pexels, openrouter}
export function langToLocale(lang)        // 'zh_CN' → 'zh-CN'
export function orientationOf(w, h)       // → 'landscape'|'portrait'|'square'
export function aspectScore(cw, ch, w, h) // |cw/ch − w/h|
export function meetsMinRes(cw, ch, w, h) // cw>=w && ch>=h
export function pickPhotoCropUrl(originalUrl, w, h) // 加 ?w&h&fit=crop&dpr=1
export function pickVideoFile(files, w, h)         // 仅 finite w/h + 直链 mp4；≥目标且面积最接近，否则最大合法档；无则 null
export function pickLeastUsed(cands, counts, usedThisRun) // counts: Map<id,count> → 选中 id
export function parseKeywords(text)       // LLM 输出 → string[]（slice 0,40）
export function buildConcatArgs(clips, w, h, fps, durationSec, outPath) // → ffmpeg 参数数组
export function shard(id)                  // → '<倒二位>/<末位>'（不足两位补0）
export function photoCachePath(cacheDir, photoId, w, h) // → .../photos/<shard>/<id>-<W>x<H>-crop.jpg
export function videoCachePath(cacheDir, videoId, fileId) // → .../videos/<shard>/<videoId>-<fileId>.mp4
export function renderCreditsMd(credits)  // Credit[] → credits.md 完整文本
export function renderCreditsLine(credits) // Credit[] → 屏上一行（去重作者、过多截断），pexelsCreditsText
// SQLite 封装（better-sqlite3），两表 usage + attribution：
export function openCacheDb(cacheDir)     // → {getCounts(type,ids), bumpUsage(type,id),
                                          //     putAttribution(c), getAttribution(type,id), close()}
```

## 12. 测试（`node --test`，网络部分 mock）

- `parseApiKeys`：多行/含等号值/缺键。
- `langToLocale`：5 种映射 + 回退。
- `orientationOf`：横/竖/方。
- `aspectScore` / 比例过滤阈值（0.35→0.6 放宽）。
- `meetsMinRes`：边界（恰好相等通过、任一维不足拒绝）。
- `pickPhotoCropUrl`：正确拼接 `w/h/fit=crop`。
- `pickVideoFile`：选 ≥目标且最接近、无≥目标时取最大**合法**档、超宽片排除、**跳过 HLS/m3u8/非 mp4/空宽高**、全非法返回 null。
- `pickLeastUsed`：优先 count 0、排除已用、同 count 稳定顺序。
- `parseKeywords`：去序号/空行/去重、`slice(0,40)`。
- `buildConcatArgs`：N 段输入 → 正确 `filter_complex`（scale/crop/fps/concat=n=N）、`-t 时长`、`-an`、近无损 `-crf 16 -preset slow`、输出路径。
- `openCacheDb`：建两表、`bumpUsage` 递增、`getCounts` 缺失=0、`putAttribution`/`getAttribution` 往返。
- 缓存键：图片键含 `WxH`（不同 `--res` 键不同）、视频键含 `fileId`；usage 仍按媒体 id。
- `shard`/`photoCachePath`/`videoCachePath`：末两位散列（id=7→`0/7`、id=…28→`2/8`）、路径含 shard 与正确文件名。
- `renderCreditsMd`：含 Pexels 链接行 + 每条作者/URL。
- `renderCreditsLine`：去重作者、作者过多截断为 `…等N位`、含 "Pexels"。
- 视频段数累积 + 循环填满（总时长 ≥ 目标）；预算上限触发后停止。
- 端到端 smoke：mock OpenRouter/Pexels/fetch/ffmpeg(exec)，验证 image 返回 imageUrls+credits、video 返回单个 videoFile+credits。
- 署名字幕时机（轻量）：在 fps=24、durationInFrames=N 下，断言「最后 1 秒」判定 `frame ≥ N − fps` 的边界（纯函数抽出，不渲染 React）。

## 13. 依赖与文档

- `src/package.json` 加依赖：`pexels`（官方 SDK，搜索调用走它以过反爬）、`better-sqlite3`（usage/attribution 计数）。素材**下载**走 CDN 用全局 `fetch`，不经 SDK。
- 前置：系统 `ffmpeg`（`--bg-pexels-video` 需要）+ 已有的 `ffprobe`。
- `.gitignore` 加 `cache/`、`scripts/_pextest/`。
- 探针（已写并验证）：`scripts/test-openrouter-keywords.mjs`、`scripts/test-pexels.mjs`，零依赖（探针用裸 fetch 验证参数/响应字段，少量调用未触发反爬）；**生产搜索改用官方 SDK**（见 §5）。
- `USAGE.md`：在「画面」参数表新增 `--bg-pexels-image` / `--bg-pexels-video` 两行，新增「Pexels 智能背景」小节说明关键词生成、比例匹配、ffmpeg 视频拼接、缓存与低重复策略、**Pexels 署名（`out/<name>.credits.md` + 最后 1 秒右下角字幕）**、api.key 配置、ffmpeg 前置，并在「工作原理」补充 pexels 流程。

## 14. 非目标（YAGNI）

- 不缓存关键词（每次新生成即带来多样性）。
- 不支持手动传 query 覆盖 LLM（保持布尔 flag）。
- 视频拼接用系统 ffmpeg 预合成单个 mp4；Remotion 改动仅限 `BackgroundLayer.tsx` + `types.ts`（最后 1 秒右下角署名字幕），**不改任何 preset**。
- 署名字幕固定右下角、最后 1 秒、单行；不做可配置位置/时长/样式。
- 不引入 core-* 类抽象，逻辑集中在单一 `pexelsBg.mjs`。
