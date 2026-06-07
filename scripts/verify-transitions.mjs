/**
 * 全转场中点验证（可信版）：用 buildCarousel 的 onlyTransition 强制渲染单个转场，
 * 经本地 http 服务（同源，避免 file:// 跨域污染纹理）用 CDP 加载、设转场中点 hash，
 * 直接 readPixels 采样多点检测黑屏。绕过 seed→transition 映射歧义与 Remotion 渲染缓存。
 *
 * 前置：在 src/public 起静态服务  (cd src/public && python3 -m http.server 8799)
 * 用法：node scripts/verify-transitions.mjs [group]
 */
import {writeFileSync, readdirSync, existsSync} from 'fs';
import {resolve, dirname, join} from 'path';
import {fileURLToPath} from 'url';
import {execSync, spawn} from 'child_process';
import {buildCarousel} from '../src/lib/buildCarousel.mjs';
import {groupTransitions} from '../src/lib/transitionGroups.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const SRC = resolve(ROOT, 'src');
const PUB = resolve(SRC, 'public');
const BROWSER = resolve(SRC, 'node_modules/.remotion/chrome-headless-shell/mac-arm64/chrome-headless-shell-mac-arm64/chrome-headless-shell');
const PORT = 8799;
const CDP_PORT = 9356;
const GROUP = process.argv[2] || 'soft';

const all = JSON.parse(execSync(`node "${resolve(SRC, 'lib/gl-transitions/gl-transition-transform.js')}" -d "${resolve(SRC, 'lib/gl-transitions/transitions')}"`, {encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024}));
const names = all.map((t) => t.name);
const needsExtra = (g) => /uniform\s+sampler2D\s+(?!from\b|to\b)\w+/.test(g);
const list = groupTransitions(GROUP, names).filter((n) => { const t = all.find((x) => x.name === n); return t && !needsExtra(t.glsl); });

const imgs = readdirSync(PUB).filter((f) => /^bgimg-/.test(f)).sort();
if (!imgs.length) { console.error('No bgimg-* in public/.'); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function probe(url) {
  execSync('rm -rf /tmp/vt-prof');
  const chrome = spawn(BROWSER, ['--headless=new', '--use-gl=angle', '--use-angle=metal',
    '--remote-debugging-port=' + CDP_PORT, '--user-data-dir=/tmp/vt-prof',
    '--window-size=1080,720', '--hide-scrollbars', url], {stdio: 'ignore'});
  try {
    let wsUrl;
    for (let i = 0; i < 60; i++) {
      try { const r = await fetch(`http://127.0.0.1:${CDP_PORT}/json`); const t = await r.json(); const p = t.find((x) => x.type === 'page'); if (p && p.webSocketDebuggerUrl) { wsUrl = p.webSocketDebuggerUrl; break; } } catch {}
      await sleep(120);
    }
    const ws = new WebSocket(wsUrl);
    await new Promise((res) => (ws.onopen = res));
    let id = 0; const pend = new Map();
    ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); } };
    const send = (method, params) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({id: i, method, params: params || {}})); });
    await send('Runtime.enable');
    await sleep(2500);
    const expr = `(function(){
      var c=document.getElementById('cv'); if(!c) return JSON.stringify({err:'no canvas'});
      var gl=c.getContext('webgl')||c.getContext('webgl2'); if(!gl) return JSON.stringify({err:'no gl'});
      var pts=[[0.5,0.5],[0.25,0.25],[0.75,0.75],[0.15,0.5],[0.85,0.5],[0.5,0.2],[0.5,0.8]];
      var dark=0;
      for(var i=0;i<pts.length;i++){var px=new Uint8Array(4);gl.readPixels((c.width*pts[i][0])|0,(c.height*pts[i][1])|0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);if(px[0]+px[1]+px[2]<24)dark++;}
      return JSON.stringify({dark:dark,total:pts.length});
    })()`;
    const r = await send('Runtime.evaluate', {expression: expr, returnByValue: true});
    ws.close();
    return JSON.parse(r.result.value);
  } finally { chrome.kill(); }
}

const url = `http://127.0.0.1:${PORT}/bgimage-carousel.html#t=5500`;
const bad = [];
for (const name of list) {
  writeFileSync(join(PUB, 'bgimage-carousel.html'),
    buildCarousel({imageUrls: imgs, intvl: 5, transDur: 1, group: GROUP, width: 1080, height: 720, seed: 1, onlyTransition: name}));
  const res = await probe(url);
  const flag = (res.dark >= res.total) ? '⚠️ ALL-BLACK' : (res.dark > 0 ? `${res.dark}/${res.total} dark` : 'ok');
  console.log(name.padEnd(20), JSON.stringify(res), flag);
  if (res.err || res.dark >= res.total) bad.push(name);
}
console.log(`\n=== ${GROUP}: ${list.length} transitions, midpoint ===`);
console.log(bad.length ? `⚠️ all-black: ${bad.join(', ')}` : '✅ none all-black at midpoint');
process.exit(0);
