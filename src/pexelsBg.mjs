/**
 * pexelsBg.mjs — --bg-pexels-image / --bg-pexels-video 的全部业务逻辑。
 * 设计文档：docs/superpowers/specs/2026-06-11-pexels-bg-design.md
 */
import {join} from 'path';

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
