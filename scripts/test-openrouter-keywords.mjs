#!/usr/bin/env node
/**
 * test-openrouter-keywords.mjs — 探针：用 OpenRouter 的 mistralai/mistral-nemo
 * 读「提示词 + 歌词」生成 Pexels 搜索关键词。验证 key、模型、提示词与解析。
 *
 * 用法：
 *   node scripts/test-openrouter-keywords.mjs [歌词文件]
 *   默认歌词文件 example/cn-3.srt
 *
 * key 取自 scripts/api.key 的 openrouter=... 行。
 */
import {readFileSync} from 'fs';
import {resolve, dirname} from 'path';
import {fileURLToPath} from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

// --- 读取 api.key ---
function parseApiKeys(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([^=#\s]+)\s*=\s*(.+?)\s*$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}
const keys = parseApiKeys(readFileSync(resolve(ROOT, 'scripts/api.key'), 'utf-8'));
if (!keys.openrouter) {
  console.error('Error: scripts/api.key 缺少 openrouter=...');
  process.exit(1);
}

// --- 读取并提取歌词纯文本（去 SRT 序号/时间轴；兼容 LRC 标签） ---
const lyricsFile = process.argv[2] || 'example/cn-3.srt';
const raw = readFileSync(resolve(ROOT, lyricsFile), 'utf-8');
const lyricsText = raw
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l && !/^\d+$/.test(l) && !l.includes('-->'))
  .map((l) => l.replace(/^\[\d{1,2}:\d{2}(?:[.:]\d{1,3})?\]/, '').trim()) // 去 LRC 时间标签
  .filter(Boolean)
  .join('\n');

console.log(`歌词文件：${lyricsFile}（${lyricsText.split('\n').length} 行）`);
console.log('---- 歌词纯文本 ----');
console.log(lyricsText);
console.log('--------------------\n');

// --- 提示词（与 spec §4 一致，{{LYRICS}} 注入） ---
const PROMPT = `You are a keyword generator for searching free stock videos on Pexels.
Your task is to read song lyrics and generate search keywords for finding visual background videos suitable for a music video or lyric video.
Goal: Generate keywords that describe mood, scene, atmosphere, color, motion, and visual style. The keywords should be useful for searching on Pexels.
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
${lyricsText}
Output:
Generate 20 to 40 Pexels search keywords.`;

// --- 解析关键词：一行一个，去序号/项目符号/空行/去重 ---
function parseKeywords(text) {
  const seen = new Set();
  const out = [];
  for (const line of text.split(/\r?\n/)) {
    const kw = line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim().toLowerCase();
    if (kw && !seen.has(kw)) {
      seen.add(kw);
      out.push(kw);
    }
  }
  return out;
}

// --- 调用 OpenRouter ---
console.log('调用 OpenRouter（mistralai/mistral-nemo）...\n');
const t0 = Date.now();
const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${keys.openrouter}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'mistralai/mistral-nemo',
    messages: [{role: 'user', content: PROMPT}],
  }),
});

if (!resp.ok) {
  const body = await resp.text();
  if (resp.status === 402) {
    console.error('❌ OpenRouter 余额不足/欠费（HTTP 402）。请充值后重试。');
  } else if (resp.status === 429) {
    console.error('❌ OpenRouter 速率限制（HTTP 429）。请稍后重试。');
  } else if (resp.status === 401) {
    console.error('❌ OpenRouter 鉴权失败（HTTP 401）。检查 scripts/api.key 的 openrouter key。');
  } else {
    console.error(`❌ OpenRouter HTTP ${resp.status}`);
  }
  console.error(body);
  process.exit(1);
}
const data = await resp.json();
const content = data.choices?.[0]?.message?.content ?? '';
const keywords = parseKeywords(content);

console.log(`---- 模型原始返回（${Date.now() - t0}ms）----`);
console.log(content);
console.log('\n---- 解析后关键词 ----');
keywords.forEach((k, i) => console.log(`${String(i + 1).padStart(2, ' ')}. ${k}`));
console.log(`\n共 ${keywords.length} 个关键词（目标 20-40）`);
if (data.usage) console.log(`token 用量：`, data.usage);
