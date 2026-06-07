/**
 * 验证 CSS 背景轮播：用本地 http 服务（同源，避免 file:// 图片污染）+ CDP 加载 carousel HTML，
 * 设置一组 #t=<ms>（覆盖 hold 与 transition 中点），对每帧多点采样检测「整屏是否露黑」。
 *
 * 前置：cd src/public && python3 -m http.server 8799
 * 用法：node scripts/verify-css-carousel.mjs [intvl] [transDur] [count]
 */
import {resolve, dirname} from 'path';
import {fileURLToPath} from 'url';
import {execSync, spawn} from 'child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const SRC = resolve(ROOT, 'src');
const BROWSER = resolve(SRC, 'node_modules/.remotion/chrome-headless-shell/mac-arm64/chrome-headless-shell-mac-arm64/chrome-headless-shell');
const PORT = 8799;
const CDP_PORT = 9360;

const intvl = parseFloat(process.argv[2] || '5');
const transDur = parseFloat(process.argv[3] || '1');
const count = parseInt(process.argv[4] || '6', 10);
const cycle = intvl + transDur;

// sample times: for each cycle, the hold midpoint and the transition midpoint
const times = [];
for (let s = 0; s < count; s++) {
  times.push({label: `hold#${s}`, ms: (s * cycle + intvl / 2) * 1000});
  times.push({label: `trans#${s}->${s + 1}`, ms: (s * cycle + intvl + transDur / 2) * 1000});
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function probe(ms) {
  execSync('rm -rf /tmp/vcss-prof');
  const chrome = spawn(BROWSER, ['--headless=new', '--use-gl=angle', '--use-angle=metal',
    '--remote-debugging-port=' + CDP_PORT, '--user-data-dir=/tmp/vcss-prof',
    '--window-size=1080,720', '--hide-scrollbars',
    `http://127.0.0.1:${PORT}/bgimage-carousel.html#t=${ms}`], {stdio: 'ignore'});
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
    await send('Page.enable');
    await sleep(1800);
    const r = await send('Page.captureScreenshot', {format: 'png', fromSurface: true});
    ws.close();
    if (!r || !r.data) return {err: 'no screenshot'};
    // decode PNG center-ish samples via an offscreen canvas in node? simpler: write & use sips?
    // Instead, sample pixels via a second evaluate using a 2D canvas of the screenshot.
    return {png: r.data};
  } finally { chrome.kill(); }
}

// We sample pixels by re-loading the screenshot into a canvas in a tiny CDP eval.
async function analyze(pngB64) {
  execSync('rm -rf /tmp/vcss-prof2');
  const chrome = spawn(BROWSER, ['--headless=new', '--remote-debugging-port=' + (CDP_PORT + 1),
    '--user-data-dir=/tmp/vcss-prof2', 'about:blank'], {stdio: 'ignore'});
  try {
    let wsUrl;
    for (let i = 0; i < 60; i++) {
      try { const r = await fetch(`http://127.0.0.1:${CDP_PORT + 1}/json`); const t = await r.json(); const p = t.find((x) => x.type === 'page'); if (p && p.webSocketDebuggerUrl) { wsUrl = p.webSocketDebuggerUrl; break; } } catch {}
      await sleep(120);
    }
    const ws = new WebSocket(wsUrl);
    await new Promise((res) => (ws.onopen = res));
    let id = 0; const pend = new Map();
    ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); } };
    const send = (method, params) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({id: i, method, params: params || {}})); });
    await send('Runtime.enable');
    const expr = `(async function(){
      var img=new Image(); img.src='data:image/png;base64,${pngB64}';
      await img.decode();
      var c=document.createElement('canvas'); c.width=img.width; c.height=img.height;
      var x=c.getContext('2d'); x.drawImage(img,0,0);
      var pts=[[0.5,0.5],[0.25,0.25],[0.75,0.75],[0.15,0.5],[0.85,0.5],[0.5,0.2],[0.5,0.8]];
      var dark=0;
      for(var i=0;i<pts.length;i++){var d=x.getImageData((c.width*pts[i][0])|0,(c.height*pts[i][1])|0,1,1).data;if(d[0]+d[1]+d[2]<24)dark++;}
      return JSON.stringify({dark:dark,total:pts.length,w:img.width,h:img.height});
    })()`;
    const r = await send('Runtime.evaluate', {expression: expr, returnByValue: true, awaitPromise: true});
    ws.close();
    return r && r.result ? JSON.parse(r.result.value) : {err: 'eval failed'};
  } finally { chrome.kill(); }
}

(async () => {
  let bad = 0;
  for (const t of times) {
    const shot = await probe(t.ms);
    if (shot.err) { console.log(t.label.padEnd(16), 'ERR', shot.err); bad++; continue; }
    const res = await analyze(shot.png);
    const flag = res.err ? 'ERR ' + res.err : (res.dark >= res.total ? '⚠️ ALL-BLACK' : (res.dark ? `${res.dark}/${res.total} dark` : 'ok'));
    console.log(t.label.padEnd(16), `t=${(t.ms / 1000).toFixed(2)}s`, flag);
    if (res.err || res.dark >= res.total) bad++;
  }
  console.log('\n=== ' + (bad ? `⚠️ ${bad} frame(s) black/err` : '✅ no black frames') + ' ===');
  process.exit(0);
})();
