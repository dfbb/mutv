#!/usr/bin/env node
// demo/gen-index.mjs — 扫描 demo/bganim 与 demo/lyric 下的 mp4，
// 配上对应的 --bg-anim / --preset 参数与中文解释，生成两个自包含画廊 HTML。
// 重新运行即可在新增/删除视频后刷新列表：  node demo/gen-index.mjs
import {readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

const DEMO = dirname(fileURLToPath(import.meta.url));
const ROOT = join(DEMO, '..');

const listMp4 = (dir) =>
  readdirSync(join(DEMO, dir))
    .filter((f) => f.toLowerCase().endsWith('.mp4'))
    .sort();

// ---- bg-anim：从 src/animbg/manifest.json 取 name / category / tech ----
const CAT_ZH = {
  'particles-systems': '粒子与系统',
  backgrounds: '背景',
  '3d-webgl': '3D & WebGL',
  celebration: '庆祝',
  'retro-cyberpunk': '复古 & 赛博朋克',
  interactive: '交互',
  'text-typography': '文字与排版',
  WINAMP: 'WINAMP 音频可视化',
};
const manifest = JSON.parse(readFileSync(join(ROOT, 'src/animbg/manifest.json'), 'utf8'));
const byLabel = Object.fromEntries(manifest.map((e) => [e.label, e]));

const bgItems = listMp4('bganim').map((file) => {
  const label = file.replace(/\.mp4$/i, '');
  const m = byLabel[label] || {};
  const cat = CAT_ZH[m.category] || m.category || '';
  const desc = [m.name, cat && `分类：${cat}`, m.tech && `渲染：${m.tech}`]
    .filter(Boolean)
    .join(' · ');
  return {file, param: `--bg-anim ${label}`, label, desc};
});

// ---- preset：编号特效取自 _engine/effects/{text,visual}/NNN-*.ts 的 name ----
const NAMED = {
  orig: '频谱可视化 + 整行字幕，底部跳动的频率柱与径向辉光',
  no2: '逐词卡拉OK高亮，跟随圆点指示当前演唱位置',
  apple: 'Apple Music 风格：滚动歌词 + 逐词渐亮 + 模糊背景',
  ktv: '经典卡拉OK：多行可见 + 逐词扫光双色描边 + lead-in 箭头',
  neon: '赛博朋克霓虹：逐词出场 + RGB 色差/故障 + 扫描线',
  cinema: '电影预告片：居中超大字 + 金色辉光 + 黑边暗角',
  bounce: '彩虹弹跳：每词不同色，随机方向弹入 + 旋转',
  typewriter: '打字机：逐字符显示 + 当前词高亮 + 闪烁光标',
};

// 建 id(001..097) -> name 映射
const effectName = {};
for (const kind of ['text', 'visual']) {
  const dir = join(ROOT, 'src/preset/_engine/effects', kind);
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.ts') || f.endsWith('.test.ts')) continue;
    const src = readFileSync(join(dir, f), 'utf8');
    const id = src.match(/id:\s*['"](\d+)['"]/)?.[1];
    let name = src.match(/name:\s*['"]([^'"]+)['"]/)?.[1] || '';
    name = name.replace(/^\d+\s+/, '').trim(); // 去掉 visual name 前缀的编号
    if (id) effectName[id] = name;
  }
}

const lyricItems = listMp4('lyric').map((file) => {
  const label = file.replace(/\.mp4$/i, ''); // 如 fx-019-css-neon / fx-orig
  const rest = label.replace(/^fx-/, '');
  const num = rest.match(/^(\d{3})/)?.[1];
  let desc;
  if (num) desc = effectName[num] || rest.replace(/^\d{3}-/, '').replace(/-/g, ' ');
  else desc = NAMED[rest] || rest;
  return {file, param: `--preset ${label}`, label, desc};
});

// ---- HTML 模板 ----
const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function buildHtml({title, subtitle, dir, items}) {
  const data = JSON.stringify(items.map((i) => ({...i, src: `${dir}/${i.file}`})));
  return `<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #0d0f14; color: #e8eaf0;
    font: 15px/1.5 -apple-system, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif; }
  header { padding: 28px 24px 8px; }
  h1 { margin: 0 0 4px; font-size: 24px; }
  .sub { color: #8b91a3; font-size: 14px; }
  .sub code { background: #1b2030; padding: 1px 6px; border-radius: 5px; color: #b9c2ff; }
  .count { color: #6b7180; }
  .grid { display: grid; gap: 14px; padding: 20px 24px 60px;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
  .card { background: #151926; border: 1px solid #232838; border-radius: 12px;
    overflow: hidden; cursor: pointer; transition: border-color .15s, transform .15s; }
  .card:hover { border-color: #4858ff; transform: translateY(-2px); }
  .card video { width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block; background: #000; }
  .meta { padding: 9px 11px 11px; }
  .param { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12.5px;
    color: #b9c2ff; word-break: break-all; }
  .desc { color: #8b91a3; font-size: 12.5px; margin-top: 3px;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  /* 放大层 */
  .modal { position: fixed; inset: 0; background: rgba(6,8,12,.94);
    display: none; align-items: center; justify-content: center; flex-direction: column; padding: 24px; z-index: 99; }
  .modal.open { display: flex; }
  .modal video { max-width: 92vw; max-height: 78vh; border-radius: 10px; background: #000; }
  .modal .info { margin-top: 14px; text-align: center; }
  .modal .info .param { font-size: 15px; color: #c7cdff; }
  .modal .info .desc { font-size: 14px; color: #aab; margin-top: 6px; -webkit-line-clamp: unset; max-width: 80vw; }
  .close { position: fixed; top: 18px; right: 22px; width: 42px; height: 42px; border-radius: 50%;
    border: 1px solid #2c3346; background: #161b29; color: #e8eaf0; font-size: 22px; line-height: 1;
    cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .close:hover { background: #232a3d; }
</style>
</head>
<body>
<header>
  <h1>${esc(title)}</h1>
  <div class="sub">${subtitle} <span class="count" id="count"></span></div>
</header>
<div class="grid" id="grid"></div>

<div class="modal" id="modal">
  <button class="close" id="close" aria-label="返回列表">✕</button>
  <video id="player" controls playsinline></video>
  <div class="info">
    <div class="param" id="mParam"></div>
    <div class="desc" id="mDesc"></div>
  </div>
</div>

<script>
const ITEMS = ${data};
const grid = document.getElementById('grid');
document.getElementById('count').textContent = '（共 ' + ITEMS.length + ' 个）';

for (const it of ITEMS) {
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML =
    '<video src="' + it.src + '" muted preload="metadata" playsinline></video>' +
    '<div class="meta"><div class="param">' + it.param + '</div>' +
    '<div class="desc">' + (it.desc || '') + '</div></div>';
  card.addEventListener('click', () => open(it));
  grid.appendChild(card);
}

const modal = document.getElementById('modal');
const player = document.getElementById('player');
const mParam = document.getElementById('mParam');
const mDesc = document.getElementById('mDesc');

function open(it) {
  player.src = it.src;
  mParam.textContent = it.param;
  mDesc.textContent = it.desc || '';
  modal.classList.add('open');
  player.currentTime = 0;
  player.play().catch(() => {});
}
function close() {
  modal.classList.remove('open');
  player.pause();
  player.removeAttribute('src');
  player.load();
}
document.getElementById('close').addEventListener('click', close);
modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
</script>
</body>
</html>
`;
}

writeFileSync(
  join(DEMO, 'index-bg.html'),
  buildHtml({
    title: '动画背景特效画廊（--bg-anim）',
    subtitle: '点击放大播放，按 <code>✕</code> 或 Esc 返回。参数用法：<code>--bg-anim &lt;label&gt;</code>',
    dir: 'bganim',
    items: bgItems,
  }),
);
writeFileSync(
  join(DEMO, 'index-lyric.html'),
  buildHtml({
    title: '歌词视觉模板画廊（--preset）',
    subtitle: '点击放大播放，按 <code>✕</code> 或 Esc 返回。参数用法：<code>--preset &lt;label&gt;</code>',
    dir: 'lyric',
    items: lyricItems,
  }),
);

console.log(`index-bg.html: ${bgItems.length} 个，index-lyric.html: ${lyricItems.length} 个`);
