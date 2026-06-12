/**
 * pexelsBg.mjs — --bg-pexels-image / --bg-pexels-video 的全部业务逻辑。
 * 设计文档：docs/superpowers/specs/2026-06-11-pexels-bg-design.md
 */
import {join, dirname} from 'path';
import Database from 'better-sqlite3';
import {mkdirSync, copyFileSync, writeFileSync, existsSync} from 'fs';
import {spawnSync} from 'child_process';

export function parseApiKeys(text) {
  const out = {};
  for (const line of String(text).split(/\r?\n/)) {
    const m = line.match(/^\s*([^=#\s]+)\s*=\s*(.+?)\s*$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

const LOCALES = {en: 'en-US', zh_CN: 'zh-CN', zh_TW: 'zh-TW', kr: 'ko-KR', ja: 'ja-JP'};
export function langToLocale(lang) { return LOCALES[lang] || 'en-US'; }

export function orientationOf(w, h) { return w > h ? 'landscape' : h > w ? 'portrait' : 'square'; }

/** 比值容差：max(r,R)/min(r,R) ≤ tol（横竖屏对称）。 */
export function aspectOk(cw, ch, w, h, tol) {
  const r = cw / ch, R = w / h;
  return Math.max(r, R) / Math.min(r, R) <= tol;
}

export function meetsMinRes(cw, ch, w, h) { return cw >= w && ch >= h; }

/** Pexels 图片动态裁剪：目标尺寸已 cover 裁剪的小图。 */
export function pickPhotoCropUrl(originalUrl, w, h) {
  const sep = originalUrl.includes('?') ? '&' : '?';
  return `${originalUrl}${sep}auto=compress&cs=tinysrgb&w=${w}&h=${h}&fit=crop&dpr=1`;
}

/** 只认直链 mp4（不信 file_type）；≥目标且面积最接近，否则最大合法档；无则 null。 */
export function pickVideoFile(files, w, h) {
  const legal = (files || []).filter((f) =>
    Number.isFinite(f.width) && Number.isFinite(f.height) &&
    typeof f.link === 'string' && !f.link.includes('.m3u8') && /\.mp4($|\?)/.test(f.link));
  if (!legal.length) return null;
  const target = w * h;
  const ge = legal.filter((f) => f.width >= w && f.height >= h)
    .sort((a, b) => a.width * a.height - b.width * b.height);
  if (ge.length) return ge[0];
  return legal.sort((a, b) => b.width * b.height - a.width * a.height)[0];
}

/** usage count 升序（缺失=0），排除已用；同 count 保持原顺序。空则 null。 */
export function pickLeastUsed(cands, counts, usedThisRun) {
  const avail = cands.filter((c) => !usedThisRun.has(c.id));
  if (!avail.length) return null;
  let best = null, bestCount = Infinity;
  for (const c of avail) {
    const n = counts.get(c.id) ?? 0;
    if (n < bestCount) { best = c; bestCount = n; }
  }
  return best;
}

/** LLM 输出 → 关键词数组：去序号/项目符号/空行，lowercase 去重，最多 40。# 注释/章节标题行直接跳过。 */
export function parseKeywords(text) {
  const seen = new Set(), out = [];
  for (const line of String(text).split(/\r?\n/)) {
    if (/^\s*#/.test(line)) continue; // skip comment/section header lines
    const kw = line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim().toLowerCase();
    if (kw && !seen.has(kw)) { seen.add(kw); out.push(kw); }
  }
  return out.slice(0, 40);
}

/** 关键词 → 文件名/目录安全 tag：小写，非 [a-z0-9] 连续段转 '-'，去首尾 '-'；空则 '_'。 */
export function sanitizeTag(keyword) {
  const t = String(keyword).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return t || '_';
}

export function photoCachePath(cacheDir, tag, photoId, w, h) {
  return join(cacheDir, 'pexels', 'photos', tag, `${photoId}-${w}x${h}-crop.jpg`);
}
export function videoCachePath(cacheDir, tag, videoId, fileId, durationSec) {
  return join(cacheDir, 'pexels', 'videos', tag, `${videoId}-${fileId}-${durationSec}s.mp4`);
}

/** ffmpeg 预拼接参数：scale(cover)+crop+fps → concat → -t 截断，近无损中间件。 */
export function buildConcatArgs(clips, w, h, fps, durationSec, outPath) {
  const inputs = clips.flatMap((c) => ['-i', c]);
  const filters = clips.map((_, i) =>
    `[${i}:v]scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},setsar=1,fps=${fps}[v${i}]`);
  const concat = clips.map((_, i) => `[v${i}]`).join('') + `concat=n=${clips.length}:v=1:a=0[outv]`;
  return ['-y', ...inputs,
    '-filter_complex', [...filters, concat].join(';'),
    '-map', '[outv]', '-an', '-t', String(durationSec),
    '-c:v', 'libx264', '-crf', '16', '-preset', 'veryfast', '-pix_fmt', 'yuv420p',
    outPath];
}

export function renderCreditsMd(credits) {
  const lines = ['Photos/Videos provided by Pexels (https://www.pexels.com)', ''];
  for (const c of credits) {
    lines.push(`- ${c.type === 'video' ? 'Video' : 'Photo'} by ${c.author} (${c.authorUrl}) — ${c.pexelsUrl}`);
  }
  return lines.join('\n') + '\n';
}

/** 屏上一行署名：作者去重，>4 位截断为 ...；必含 Pexels.com。 */
export function renderCreditsLine(credits) {
  const authors = [...new Set(credits.map((c) => c.author).filter(Boolean))];
  const shown = authors.length > 4 ? `${authors.slice(0, 4).join(', ')} ...` : authors.join(', ');
  return `Backgrounds: Pexels.com — ${shown}`;
}

/** 最后 1 秒判定（署名字幕时机）。 */
export function isLastSecond(frame, durationInFrames, fps) {
  return frame >= durationInFrames - fps;
}

/** 打开 cache/usage.sqlite（两表 usage[按 tag] + attribution[按 id]）。 */
export function openCacheDb(cacheDir) {
  mkdirSync(cacheDir, {recursive: true});
  const db = new Database(join(cacheDir, 'usage.sqlite'));
  // usage 表升级：旧版无 tag 列则丢弃重建（缓存可再生，attribution 保留）。
  const cols = db.prepare('PRAGMA table_info(usage)').all();
  if (cols.length && !cols.some((c) => c.name === 'tag')) db.exec('DROP TABLE usage');
  db.exec(`CREATE TABLE IF NOT EXISTS usage (
      type TEXT NOT NULL, tag TEXT NOT NULL, id INTEGER NOT NULL, count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (type, tag, id));
    CREATE TABLE IF NOT EXISTS attribution (
      type TEXT NOT NULL, id INTEGER NOT NULL,
      author TEXT, author_url TEXT, pexels_url TEXT,
      PRIMARY KEY (type, id));
    CREATE TABLE IF NOT EXISTS candidate (
      type TEXT NOT NULL, tag TEXT NOT NULL, id INTEGER NOT NULL,
      url TEXT NOT NULL, file_id INTEGER, duration INTEGER,
      PRIMARY KEY (type, tag, id));`);
  const bump = db.prepare(
    'INSERT INTO usage(type,tag,id,count) VALUES(?,?,?,1) ON CONFLICT(type,tag,id) DO UPDATE SET count=count+1');
  const putAttr = db.prepare(
    'INSERT INTO attribution(type,id,author,author_url,pexels_url) VALUES(?,?,?,?,?) ' +
    'ON CONFLICT(type,id) DO UPDATE SET author=excluded.author,author_url=excluded.author_url,pexels_url=excluded.pexels_url');
  const getAttr = db.prepare('SELECT * FROM attribution WHERE type=? AND id=?');
  const putCand = db.prepare(
    'INSERT INTO candidate(type,tag,id,url,file_id,duration) VALUES(?,?,?,?,?,?) ' +
    'ON CONFLICT(type,tag,id) DO UPDATE SET url=excluded.url,file_id=excluded.file_id,duration=excluded.duration');
  const getCands = db.prepare('SELECT id,url,file_id AS fileId,duration FROM candidate WHERE type=? AND tag=?');
  return {
    /** 某 tag 下这批 id 的使用次数；缺失=0。 */
    getCounts(type, tag, ids) {
      const map = new Map(ids.map((i) => [i, 0]));
      if (ids.length) {
        const rows = db.prepare(
          `SELECT id,count FROM usage WHERE type=? AND tag=? AND id IN (${ids.map(() => '?').join(',')})`)
          .all(type, tag, ...ids);
        for (const r of rows) map.set(r.id, r.count);
      }
      return map;
    },
    bumpUsage(type, tag, id) { bump.run(type, tag, id); },
    putAttribution(c) { putAttr.run(c.type, c.id, c.author, c.authorUrl, c.pexelsUrl); },
    getAttribution(type, id) {
      const r = getAttr.get(type, id);
      return r ? {type: r.type, id: r.id, author: r.author, authorUrl: r.author_url, pexelsUrl: r.pexels_url} : null;
    },
    /** 候选索引：记录某关键词搜到的素材元数据（不下载），供跨次/同次轮换按需下载。 */
    putCandidate(c) { putCand.run(c.type, c.tag, c.id, c.url, c.fileId ?? null, c.duration ?? null); },
    getCandidates(type, tag) { return getCands.all(type, tag); },
    close() { db.close(); },
  };
}

const KEYWORD_PROMPT = `You are a keyword generator for searching free stock videos on Pexels.
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
Generate 20 to 40 Pexels search keywords.`;

/** OpenRouter mistral-nemo 生成关键词池。402/429/401 专项报警，空结果抛错。 */
export async function generateKeywords({lyricsText, apiKey, fetchImpl = fetch}) {
  const resp = await fetchImpl('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({
      model: 'mistralai/mistral-nemo',
      messages: [{role: 'user', content: KEYWORD_PROMPT.replace('{{LYRICS}}', lyricsText)}],
    }),
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    if (resp.status === 402) throw new Error(`OpenRouter 余额不足/欠费（HTTP 402）。请充值后重试。\n${body}`);
    if (resp.status === 429) throw new Error(`OpenRouter 速率限制（HTTP 429）。请稍后重试。\n${body}`);
    if (resp.status === 401) throw new Error(`OpenRouter 鉴权失败（HTTP 401）。检查 scripts/api.key。\n${body}`);
    throw new Error(`OpenRouter HTTP ${resp.status}\n${body}`);
  }
  const data = await resp.json();
  const kws = parseKeywords(data.choices?.[0]?.message?.content ?? '');
  if (!kws.length) throw new Error('OpenRouter 返回空关键词，无法继续。');
  return kws;
}

const ASPECT_TOL = 1.25, ASPECT_TOL_RELAXED = 1.5;

async function downloadToFile(url, dest, downloadImpl) {
  const buf = await downloadImpl(url);
  mkdirSync(dirname(dest), {recursive: true});
  writeFileSync(dest, buf);
}

async function defaultDownload(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`下载失败 HTTP ${resp.status}: ${url}`);
  return Buffer.from(await resp.arrayBuffer());
}

/**
 * 主入口。kind='image' → {imageUrls, credits}；kind='video' → {videoFile, credits}。
 * pexelsClient/fetchImpl/downloadImpl/execImpl 可注入（测试 mock）。
 */
export async function preparePexelsBackground({
  kind, lyricsText, durationSec, width, height, fps, locale, intvl = 5,
  apiKeys, publicDir, cacheDir,
  limits = {},
  pexelsClient = null, fetchImpl = fetch, downloadImpl = defaultDownload,
  execImpl = (cmd, args) => spawnSync(cmd, args, {stdio: 'inherit'}),
}) {
  const {maxPagesPerKeyword = 3, maxAttemptsPerSlot = 8} = limits;
  const slots = kind === 'image' ? Math.ceil(durationSec / intvl) : Infinity;
  const requestBudget = limits.requestBudget ??
    Math.min(150, (kind === 'image' ? Math.ceil(durationSec / intvl) : Math.ceil(durationSec / 15)) * 4);

  // 1) 关键词
  const keywords = await generateKeywords({lyricsText, apiKey: apiKeys.openrouter, fetchImpl});
  console.log(`Pexels 关键词（${keywords.length}）：${keywords.slice(0, 8).join(', ')}…`);

  // 2) SDK client（生产）：搜索必须走 SDK 过反爬
  if (!pexelsClient) {
    const {createClient} = await import('pexels');
    pexelsClient = createClient(apiKeys.pexels);
  }

  const orientation = orientationOf(width, height);
  const type = kind === 'image' ? 'photo' : 'video';
  const db = openCacheDb(cacheDir);
  const usedThisRun = new Set();
  const credits = [];
  let requests = 0;
  let kwIdx = 0;
  const kwPage = new Map();

  /** 搜该关键词的下一页（预算/翻页上限内），比例过滤（严格→放宽）。返回原始候选项数组或 []。 */
  async function searchPage(kw) {
    if (requests >= requestBudget) return [];
    const page = kwPage.get(kw) ?? 1;
    if (page > maxPagesPerKeyword) return [];
    kwPage.set(kw, page + 1);
    requests++;
    let res;
    try {
      res = kind === 'image'
        ? await pexelsClient.photos.search({query: kw, orientation, locale, per_page: 15, page, size: 'large'})
        : await pexelsClient.videos.search({query: kw, orientation, locale, per_page: 10, page});
    } catch (e) {
      const msg = String(e?.message || e);
      if (/429|Too Many Requests/i.test(msg)) throw new Error(`Pexels 次数限制（疑似 429）。请稍后再试。\n${msg}`);
      if (/401|Unauthorized/i.test(msg)) throw new Error(`Pexels 鉴权失败。检查 scripts/api.key 的 pexels key。\n${msg}`);
      console.warn(`  搜索失败（跳过 "${kw}" p${page}）：${msg}`);
      return [];
    }
    if (res?.error) { console.warn(`  搜索返回 error（跳过 "${kw}"）：${res.error}`); return []; }
    const items = kind === 'image' ? (res.photos || []) : (res.videos || []);
    const filt = (tol) => items.filter((it) => aspectOk(it.width, it.height, width, height, tol))
      .filter((it) => kind === 'video' || meetsMinRes(it.width, it.height, width, height));
    let cands = filt(ASPECT_TOL);
    if (!cands.length) cands = filt(ASPECT_TOL_RELAXED);
    return cands;
  }

  /** 搜一页并把全部合法候选的元数据（不下载）写入候选索引 + attribution。返回是否新增了候选 id。 */
  async function searchAndIndex(kw, tag) {
    const items = await searchPage(kw);
    if (!items.length) return false;
    const known = new Set(db.getCandidates(type, tag).map((c) => c.id));
    let added = 0;
    for (const it of items) {
      if (kind === 'image') {
        if (!known.has(it.id)) added++;
        db.putCandidate({type: 'photo', tag, id: it.id, url: it.src.original, fileId: null, duration: null});
        db.putAttribution({type: 'photo', id: it.id, author: it.photographer, authorUrl: it.photographer_url, pexelsUrl: it.url});
      } else {
        const file = pickVideoFile(it.video_files, width, height);
        if (!file) continue;
        if (!known.has(it.id)) added++;
        db.putCandidate({type: 'video', tag, id: it.id, url: file.link, fileId: file.id, duration: Math.max(1, Math.round(it.duration || 0))});
        db.putAttribution({type: 'video', id: it.id, author: it.user?.name, authorUrl: it.user?.url, pexelsUrl: it.url});
      }
    }
    return added > 0;
  }

  /** 按需下载一个候选（缓存已存在则跳过下载）。返回素材或 null（下载失败）。 */
  async function ensureDownloaded(tag, cand) {
    try {
      if (kind === 'image') {
        const dest = photoCachePath(cacheDir, tag, cand.id, width, height);
        if (!existsSync(dest)) await downloadToFile(pickPhotoCropUrl(cand.url, width, height), dest, downloadImpl);
        return {cachePath: dest, id: cand.id};
      }
      const dur = Math.max(1, Math.round(cand.duration || 0));
      const dest = videoCachePath(cacheDir, tag, cand.id, cand.fileId, dur);
      if (!existsSync(dest)) await downloadToFile(cand.url, dest, downloadImpl);
      return {cachePath: dest, id: cand.id, duration: dur};
    } catch (e) {
      console.warn(`  下载失败（跳过 #${cand.id}）：${e.message}`);
      return null;
    }
  }

  /** 在该关键词的候选索引里按 usage 最少选一个、按需下载并服务。返回素材或 null（无可用候选）。 */
  async function serveFromIndex(tag) {
    while (true) {
      const pool = db.getCandidates(type, tag).filter((c) => !usedThisRun.has(c.id));
      if (!pool.length) return null;
      const counts = db.getCounts(type, tag, pool.map((c) => c.id));
      const pick = pickLeastUsed(pool, counts, usedThisRun);
      if (!pick) return null;
      const got = await ensureDownloaded(tag, pick);
      if (got) {
        db.bumpUsage(type, tag, pick.id);
        usedThisRun.add(pick.id);
        credits.push(db.getAttribution(type, pick.id) || {type, id: pick.id, author: '', authorUrl: '', pexelsUrl: ''});
        return got;
      }
      usedThisRun.add(pick.id); // 下载失败 → 本次跳过该候选，试下一个
    }
  }

  /** 取一个素材：轮转关键词，先在候选索引里按 usage 轮换（命中不调 API）；索引无未用候选才搜一页扩充。 */
  async function acquireOne() {
    for (let attempt = 0; attempt < maxAttemptsPerSlot; attempt++) {
      const kw = keywords[kwIdx % keywords.length];
      kwIdx++;
      const tag = sanitizeTag(kw);

      // (a) 候选索引命中：按 usage 最少选、按需下载（跨次/同次轮换，零或少 API）
      let got = await serveFromIndex(tag);
      if (got) return got;

      // (b) 索引无未用候选 → 搜一页扩充索引，再取
      if (await searchAndIndex(kw, tag)) {
        got = await serveFromIndex(tag);
        if (got) return got;
      }
    }
    return null;
  }

  try {
    if (kind === 'image') {
      const imageUrls = [];
      for (let i = 0; i < slots; i++) {
        const got = await acquireOne();
        if (!got) break;
        const name = `pexbg-${String(i).padStart(3, '0')}-${got.id}.jpg`;
        mkdirSync(publicDir, {recursive: true});
        copyFileSync(got.cachePath, join(publicDir, name));
        imageUrls.push(name);
        console.log(`  [${i + 1}/${slots}] photo #${got.id}`);
      }
      if (!imageUrls.length) throw new Error('Pexels 一张图都没拿到（检查网络/关键词/key）。');
      return {imageUrls, credits};
    }

    // video mode
    const clips = [];
    let total = 0;
    while (total < durationSec) {
      const got = await acquireOne();
      if (!got) break;
      clips.push(got);
      total += got.duration || 1;
      console.log(`  clip #${got.id} ${got.duration}s（累计 ${total}/${durationSec}s）`);
    }
    if (!clips.length) throw new Error('Pexels 一段视频都没拿到（检查网络/关键词/key）。');
    const seq = [];
    let t = 0;
    for (let i = 0; t < durationSec; i++) { const c = clips[i % clips.length]; seq.push(c.cachePath); t += c.duration || 1; }
    mkdirSync(publicDir, {recursive: true});
    const outPath = join(publicDir, 'pexvid-concat.mp4');
    const args = buildConcatArgs(seq, width, height, fps, durationSec, outPath);
    console.log(`ffmpeg 拼接 ${seq.length} 段 → pexvid-concat.mp4 ...`);
    const r = execImpl('ffmpeg', args);
    if (r.status !== 0 || !existsSync(outPath)) throw new Error('ffmpeg 拼接失败。');
    return {videoFile: 'pexvid-concat.mp4', credits};
  } finally {
    db.close();
  }
}
