/**
 * pexelsBg.mjs — --bg-pexels-image / --bg-pexels-video 的全部业务逻辑。
 * 设计文档：docs/superpowers/specs/2026-06-11-pexels-bg-design.md
 */
import {join} from 'path';
import Database from 'better-sqlite3';
import {mkdirSync} from 'fs';

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

/** id 末两位散列两级目录（不足两位补 0）：7→'0/7'，…28→'2/8'。 */
export function shard(id) {
  const s = String(id).padStart(2, '0');
  return `${s[s.length - 2]}/${s[s.length - 1]}`;
}
export function photoCachePath(cacheDir, photoId, w, h) {
  return join(cacheDir, 'pexels', 'photos', shard(photoId), `${photoId}-${w}x${h}-crop.jpg`);
}
export function videoCachePath(cacheDir, videoId, fileId) {
  return join(cacheDir, 'pexels', 'videos', shard(videoId), `${videoId}-${fileId}.mp4`);
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

/** 屏上一行署名：作者去重，>4 位截断为 …等N位；必含 Pexels.com。 */
export function renderCreditsLine(credits) {
  const authors = [...new Set(credits.map((c) => c.author).filter(Boolean))];
  const shown = authors.length > 4 ? `${authors.slice(0, 4).join(', ')} …等${authors.length}位` : authors.join(', ');
  return `Backgrounds: Pexels.com — ${shown}`;
}

/** 最后 1 秒判定（署名字幕时机）。 */
export function isLastSecond(frame, durationInFrames, fps) {
  return frame >= durationInFrames - fps;
}

/** 打开 cache/usage.sqlite（两表 usage + attribution）。 */
export function openCacheDb(cacheDir) {
  mkdirSync(cacheDir, {recursive: true});
  const db = new Database(join(cacheDir, 'usage.sqlite'));
  db.exec(`CREATE TABLE IF NOT EXISTS usage (
      type TEXT NOT NULL, id INTEGER NOT NULL, count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (type, id));
    CREATE TABLE IF NOT EXISTS attribution (
      type TEXT NOT NULL, id INTEGER NOT NULL,
      author TEXT, author_url TEXT, pexels_url TEXT,
      PRIMARY KEY (type, id));`);
  const bump = db.prepare(
    'INSERT INTO usage(type,id,count) VALUES(?,?,1) ON CONFLICT(type,id) DO UPDATE SET count=count+1');
  const putAttr = db.prepare(
    'INSERT INTO attribution(type,id,author,author_url,pexels_url) VALUES(?,?,?,?,?) ' +
    'ON CONFLICT(type,id) DO UPDATE SET author=excluded.author,author_url=excluded.author_url,pexels_url=excluded.pexels_url');
  const getAttr = db.prepare('SELECT * FROM attribution WHERE type=? AND id=?');
  return {
    getCounts(type, ids) {
      const map = new Map(ids.map((i) => [i, 0]));
      if (ids.length) {
        const rows = db.prepare(
          `SELECT id,count FROM usage WHERE type=? AND id IN (${ids.map(() => '?').join(',')})`)
          .all(type, ...ids);
        for (const r of rows) map.set(r.id, r.count);
      }
      return map;
    },
    bumpUsage(type, id) { bump.run(type, id); },
    putAttribution(c) { putAttr.run(c.type, c.id, c.author, c.authorUrl, c.pexelsUrl); },
    getAttribution(type, id) {
      const r = getAttr.get(type, id);
      return r ? {type: r.type, id: r.id, author: r.author, authorUrl: r.author_url, pexelsUrl: r.pexels_url} : null;
    },
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
