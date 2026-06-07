/**
 * 诊断 carousel runtime 在转场帧的实际执行：用 CDP 以正确视口加载 carousel HTML，
 * 设置转场时间 hash，读取 window.__DIAG（执行分支/异常）+ 直接从 canvas readPixels
 * 采样中心像素。绕开 Remotion，定位"转场帧黑"的真正环节。
 */
import {execSync, spawn} from 'child_process';
import {resolve} from 'path';

const HTML = process.argv[2];
const tMs = process.argv[3] || '5500';
const SRC = resolve(process.cwd(), 'src');
const BROWSER = resolve(SRC, 'node_modules/.remotion/chrome-headless-shell/mac-arm64/chrome-headless-shell-mac-arm64/chrome-headless-shell');
const PORT = 9355;

const fullUrl = (HTML.startsWith('http') || HTML.startsWith('file:')) ? `${HTML}#t=${tMs}` : `file://${HTML}#t=${tMs}`;
execSync('rm -rf /tmp/diag-prof');
const chrome = spawn(BROWSER, [
  '--headless=new', '--use-gl=angle', '--use-angle=metal',
  '--remote-debugging-port=' + PORT, '--user-data-dir=/tmp/diag-prof',
  '--window-size=1080,720', '--hide-scrollbars',
  fullUrl,
], {stdio: 'ignore'});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  let wsUrl;
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}/json`); const t = await r.json(); const p = t.find((x) => x.type === 'page'); if (p && p.webSocketDebuggerUrl) { wsUrl = p.webSocketDebuggerUrl; break; } } catch {}
    await sleep(150);
  }
  const ws = new WebSocket(wsUrl);
  await new Promise((res) => (ws.onopen = res));
  let id = 0; const pend = new Map();
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); } };
  const send = (method, params) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({id: i, method, params: params || {}})); });
  await send('Runtime.enable');
  const pageErrors = [];
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.method === 'Runtime.exceptionThrown') pageErrors.push(m.params.exceptionDetails.exception ? m.params.exceptionDetails.exception.description : JSON.stringify(m.params.exceptionDetails));
    if (m.method === 'Runtime.consoleAPICalled') pageErrors.push('console.' + m.params.type + ': ' + m.params.args.map((a) => a.value || a.description).join(' '));
  });
  await sleep(3000);
  const expr = `JSON.stringify({
    diag: window.__DIAG || null,
    initErr: window.__INITERR || null,
    hash: window.location.hash,
    cvSize: (function(){var c=document.getElementById('cv');return c?[c.width,c.height,c.clientWidth,c.clientHeight]:null;})(),
    centerPx: (function(){
      var c=document.getElementById('cv'); if(!c) return 'no canvas';
      var gl=c.getContext('webgl')||c.getContext('webgl2');
      if(!gl) return 'no gl ctx';
      var pts=[[0.5,0.5],[0.25,0.25],[0.75,0.75],[0.1,0.5],[0.9,0.5]];
      var res={};
      for(var i=0;i<pts.length;i++){
        var px=new Uint8Array(4);
        gl.readPixels((c.width*pts[i][0])|0,(c.height*pts[i][1])|0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);
        res[pts[i][0]+','+pts[i][1]]=[px[0],px[1],px[2],px[3]];
      }
      return res;
    })(),
    nSlides: (window.__DIAG&&window.__DIAG.bail)?window.__DIAG.bail:'(loaded)'
  })`;
  const r = await send('Runtime.evaluate', {expression: expr, returnByValue: true});
  if (!r || !r.result) { console.log('EVAL FAILED:', JSON.stringify(r)); }
  else if (r.exceptionDetails) { console.log('EVAL EXCEPTION:', JSON.stringify(r.exceptionDetails)); }
  else { console.log(JSON.stringify(JSON.parse(r.result.value), null, 2)); }
  console.log('PAGE ERRORS/LOGS:', JSON.stringify(pageErrors, null, 2));
  ws.close(); chrome.kill();
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); chrome.kill(); process.exit(1); });
