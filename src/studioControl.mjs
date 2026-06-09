import {existsSync, readdirSync, readFileSync, writeFileSync} from 'fs';
import {resolve, join} from 'path';
import http from 'node:http';
import {spawn} from 'node:child_process';

/** 在长度 len 的环形列表里取下一个下标（到末尾回环）。 */
export function nextIndex(idx, len) {
  return (idx + 1) % len;
}

/** src/animbg/ 下所有含 index.html 的目录名，按名排序。 */
export function listAnimLabels() {
  const dir = resolve('animbg');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((d) => existsSync(join(dir, d, 'index.html')))
    .sort();
}

const STUDIO_PORT = 3000;
const CONTROL_PORT = 3001;

const CORS = {'Access-Control-Allow-Origin': '*'};

// 轮询 studio（:3000）直到它能响应或超时，用于「下一个」重启后再放行叠加层 reload。
async function waitForStudio(timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(`http://localhost:${STUDIO_PORT}`, {method: 'GET'});
      if (r.status < 500) return true;
    } catch {}
    await new Promise((res) => setTimeout(res, 200));
  }
  return false;
}

/**
 * 启动控制服务（:3001）并接管 remotion studio 子进程（:3000）。
 * 仅在 --debug-bg-anim 时由 render.mjs 调用。
 *
 * @param {{presetEntry: string, propsFile: string, presetLabel: string,
 *          beatReactive: boolean, prepareAnim: Function}} ctx
 */
export function startStudioControl({presetEntry, propsFile, presetLabel, beatReactive, prepareAnim}) {
  const animList = listAnimLabels();

  // 当前序号：从 props 文件的 backgroundAnim（animbg/animbg-<label>.html）反推。
  let currentIndex = 0;
  try {
    const props = JSON.parse(readFileSync(propsFile, 'utf-8'));
    const m = /animbg-(.+)\.html$/.exec(props.backgroundAnim || '');
    if (m) {
      const i = animList.indexOf(m[1]);
      if (i >= 0) currentIndex = i;
    }
  } catch {}

  let studio = null;
  let restarting = false;

  function spawnStudio() {
    studio = spawn('npx', ['remotion', 'studio', presetEntry, `--props=${propsFile}`], {stdio: 'inherit'});
    studio.on('exit', (code) => {
      if (restarting) return; // 主动重启时由 restartStudio 的 once 处理
      process.exit(code ?? 0);
    });
  }

  function restartStudio() {
    return new Promise((res) => {
      restarting = true;
      const killTimer = setTimeout(() => studio.kill('SIGKILL'), 10000);
      studio.once('exit', () => {
        clearTimeout(killTimer);
        spawnStudio();
        restarting = false;
        res();
      });
      studio.kill('SIGTERM');
    });
  }

  function state() {
    return {
      presetLabel,
      animLabel: animList[currentIndex],
      animIndex: currentIndex + 1,
      animTotal: animList.length,
    };
  }

  const send = (res, code, obj) => {
    res.writeHead(code, {'Content-Type': 'application/json', ...CORS});
    res.end(JSON.stringify(obj));
  };

  const server = http.createServer(async (req, res) => {
    const url = req.url || '';
    if (req.method === 'OPTIONS') {
      res.writeHead(204, CORS);
      return res.end();
    }
    if (req.method === 'GET' && url === '/state') {
      return send(res, 200, state());
    }
    if (req.method === 'POST' && url === '/next') {
      if (restarting) return send(res, 409, {error: 'restart in progress'});
      const idx = nextIndex(currentIndex, animList.length);
      const label = animList[idx];
      try {
        const {backgroundAnim, backgroundAnimKind} = prepareAnim({label, beatReactive});
        const props = JSON.parse(readFileSync(propsFile, 'utf-8'));
        props.backgroundAnim = backgroundAnim;
        props.backgroundAnimKind = backgroundAnimKind;
        writeFileSync(propsFile, JSON.stringify(props));
      } catch (e) {
        return send(res, 500, {error: String((e && e.message) || e)});
      }
      currentIndex = idx; // 仅在 prepare + 写 props 成功后再提交序号推进
      await restartStudio();
      if (!(await waitForStudio())) {
        return send(res, 500, {error: 'studio restart timeout'});
      }
      return send(res, 200, state());
    }
    if (req.method === 'POST' && url === '/mark') {
      try {
        writeFileSync(resolve('animbg', animList[currentIndex], 'blank.txt'), '');
        return send(res, 200, {marked: true});
      } catch (e) {
        return send(res, 500, {error: String((e && e.message) || e)});
      }
    }
    return send(res, 404, {error: 'not found'});
  });

  server.on('error', (e) => {
    if (e && e.code === 'EADDRINUSE') {
      console.error(`Error: 控制服务端口 ${CONTROL_PORT} 被占用，请释放或关闭占用进程。`);
      process.exit(1);
    }
    throw e;
  });

  server.listen(CONTROL_PORT, '127.0.0.1', () => {
    console.log(`bg-anim 调试控制服务: http://localhost:${CONTROL_PORT}`);
    spawnStudio();
  });
}
