/**
 * 用 Chrome DevTools Protocol 的 Page.captureScreenshot 截图（与 Puppeteer/Remotion
 * 真实渲染走同一条合成路径，能正确捕获 canvas/WebGL）。
 * 用法: node scripts/cdp-shot.mjs <file-url> <out.png> [waitMs]
 */
import {writeFileSync} from 'fs';
import {execSync, spawn} from 'child_process';

const url = process.argv[2];
const out = process.argv[3] || '/tmp/cdp-shot.png';
const waitMs = parseInt(process.argv[4] || '3500', 10);
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9333;

execSync('rm -rf /tmp/cdp-prof');
const chrome = spawn(CHROME, [
  '--headless=new', '--use-gl=angle', '--disable-gpu=false',
  '--remote-debugging-port=' + PORT, '--user-data-dir=/tmp/cdp-prof',
  '--window-size=1080,720', '--hide-scrollbars', url,
], {stdio: 'ignore'});

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function getWsUrl() {
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json`);
      const tabs = await r.json();
      const page = tabs.find((t) => t.type === 'page');
      if (page && page.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(150);
  }
  throw new Error('no CDP target');
}

async function main() {
  const wsUrl = await getWsUrl();
  const ws = new WebSocket(wsUrl);
  await new Promise((res) => (ws.onopen = res));
  let id = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  };
  const send = (method, params) => new Promise((res) => {
    const myId = ++id; pending.set(myId, res);
    ws.send(JSON.stringify({id: myId, method, params: params || {}}));
  });

  await send('Page.enable');
  await sleep(waitMs);
  const {data} = await send('Page.captureScreenshot', {format: 'png'});
  writeFileSync(out, Buffer.from(data, 'base64'));
  console.log('CDP screenshot written:', out);
  ws.close();
  chrome.kill();
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); chrome.kill(); process.exit(1); });
