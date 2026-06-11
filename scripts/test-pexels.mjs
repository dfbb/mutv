#!/usr/bin/env node
/**
 * test-pexels.mjs — 探针：测试 Pexels 图片/视频搜索与下载。
 * 验证 key、orientation 过滤、响应字段（width/height/duration/video_files）、
 * 下载，以及 429 次数限制报警。
 *
 * 用法：
 *   node scripts/test-pexels.mjs [关键词] [orientation] [per_page]
 *   默认： "misty mountains river"  landscape  5
 *
 * key 取自 scripts/api.key 的 pexels=... 行。下载落到 scripts/_pextest/。
 */
import {readFileSync, mkdirSync, writeFileSync} from 'fs';
import {resolve, dirname} from 'path';
import {fileURLToPath} from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

function parseApiKeys(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([^=#\s]+)\s*=\s*(.+?)\s*$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}
const keys = parseApiKeys(readFileSync(resolve(ROOT, 'scripts/api.key'), 'utf-8'));
if (!keys.pexels) {
  console.error('Error: scripts/api.key 缺少 pexels=...');
  process.exit(1);
}

const query = process.argv[2] || 'misty mountains river';
const orientation = process.argv[3] || 'landscape';
const perPage = process.argv[4] || '5';
const outDir = resolve(ROOT, 'scripts/_pextest');
mkdirSync(outDir, {recursive: true});

/** 统一请求：带 429（次数限制）报警，出现即退出。 */
async function pexelsGet(url) {
  const resp = await fetch(url, {headers: {Authorization: keys.pexels}});
  if (resp.status === 429) {
    console.error('❌ Pexels 次数限制（HTTP 429）。已达配额上限，请稍后再试。');
    const reset = resp.headers.get('X-Ratelimit-Reset');
    if (reset) console.error(`   配额重置时间(unix)：${reset}`);
    process.exit(1);
  }
  if (resp.status === 401) {
    console.error('❌ Pexels 鉴权失败（HTTP 401）。检查 scripts/api.key 的 pexels key。');
    process.exit(1);
  }
  if (!resp.ok) {
    console.error(`❌ Pexels HTTP ${resp.status}`);
    console.error(await resp.text());
    process.exit(1);
  }
  // 打印剩余配额（Pexels 在每个响应头返回）
  const limit = resp.headers.get('X-Ratelimit-Limit');
  const remain = resp.headers.get('X-Ratelimit-Remaining');
  if (limit) console.log(`   配额：剩余 ${remain}/${limit}`);
  return resp.json();
}

async function download(url, dest) {
  const resp = await fetch(url, {headers: {Authorization: keys.pexels}});
  if (resp.status === 429) {
    console.error('❌ Pexels 次数限制（HTTP 429，下载阶段）。请稍后再试。');
    process.exit(1);
  }
  if (!resp.ok) {
    console.error(`❌ 下载失败 HTTP ${resp.status}: ${url}`);
    process.exit(1);
  }
  const buf = Buffer.from(await resp.arrayBuffer());
  writeFileSync(dest, buf);
  return buf.length;
}

const qp = `query=${encodeURIComponent(query)}&orientation=${orientation}&per_page=${perPage}`;
console.log(`关键词："${query}"  orientation=${orientation}  per_page=${perPage}\n`);

// ===== 图片搜索 =====
console.log('===== 图片搜索 /v1/search =====');
const photos = await pexelsGet(`https://api.pexels.com/v1/search?${qp}`);
console.log(`total_results=${photos.total_results}, 返回 ${photos.photos?.length || 0} 张`);
for (const p of photos.photos || []) {
  console.log(`  #${p.id}  ${p.width}x${p.height}  ratio=${(p.width / p.height).toFixed(3)}  ${p.src?.original}`);
}
if (photos.photos?.length) {
  const p = photos.photos[0];
  const ext = (p.src.original.match(/\.(\w+)(?:\?|$)/)?.[1] || 'jpg').toLowerCase();
  const dest = resolve(outDir, `photo-${p.id}.${ext}`);
  const n = await download(p.src.original, dest);
  console.log(`  ↓ 已下载首图 → ${dest}（${(n / 1024).toFixed(0)} KB）`);
}

// ===== 视频搜索 =====
console.log('\n===== 视频搜索 /videos/search =====');
const videos = await pexelsGet(`https://api.pexels.com/videos/search?${qp}`);
console.log(`total_results=${videos.total_results}, 返回 ${videos.videos?.length || 0} 段`);
for (const v of videos.videos || []) {
  console.log(`  #${v.id}  ${v.width}x${v.height}  时长=${v.duration}s  files=${v.video_files?.length || 0}`);
  for (const f of v.video_files || []) {
    console.log(`      [${f.quality}] ${f.width}x${f.height} fps=${f.fps ?? '?'}  ${f.link}`);
  }
}
if (videos.videos?.length) {
  const v = videos.videos[0];
  // 选 orientation 一致、分辨率最高的一个 file（探针简单起见取最大面积）
  const file = (v.video_files || [])
    .filter((f) => f.link)
    .sort((a, b) => b.width * b.height - a.width * a.height)[0];
  if (file) {
    const dest = resolve(outDir, `video-${v.id}.mp4`);
    const n = await download(file.link, dest);
    console.log(`  ↓ 已下载首段视频 → ${dest}（${(n / 1024 / 1024).toFixed(2)} MB, ${file.width}x${file.height}）`);
  }
}

console.log('\n✅ 完成。下载目录：scripts/_pextest/');
