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

/** src/preset/ 下所有含 index.ts 的目录名（视觉模板），按名排序。 */
export function listPresets() {
  const dir = resolve('preset');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((d) => existsSync(join(dir, d, 'index.ts')))
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
 * 由 render.mjs 在 --debug-bg-anim / --debug-preset 时调用。
 *
 * mode='bg-anim'：循环 bg-anim（改写 props 重启），有「标记」。
 * mode='preset' ：循环 preset（换 studio 入口 index.ts 重启），无「标记」。
 *
 * @param {{mode?: 'bg-anim'|'preset', presetEntry: string, propsFile: string,
 *          presetLabel: string, beatReactive: boolean, prepareAnim: Function}} ctx
 */
export function startStudioControl({mode = 'bg-anim', presetEntry, propsFile, presetLabel, beatReactive, prepareAnim}) {
  const isPreset = mode === 'preset';
  // 循环维度的候选列表：preset 模式是视觉模板，bg-anim 模式是动画特效。
  const items = isPreset ? listPresets() : listAnimLabels();

  // 当前序号：preset 从 presetLabel 取；bg-anim 从 props.backgroundAnim 反推。
  let currentIndex = 0;
  if (isPreset) {
    const i = items.indexOf(presetLabel);
    if (i >= 0) currentIndex = i;
  } else {
    try {
      const props = JSON.parse(readFileSync(propsFile, 'utf-8'));
      const m = /animbg-(.+)\.html$/.exec(props.backgroundAnim || '');
      if (m) {
        const i = items.indexOf(m[1]);
        if (i >= 0) currentIndex = i;
      }
    } catch {}
  }

  let studio = null;
  let restarting = false;

  // studio 入口：preset 模式随当前 preset 变（换 index.ts）；bg-anim 模式固定。
  function currentEntry() {
    return isPreset ? resolve('preset', items[currentIndex], 'index.ts') : presetEntry;
  }

  function spawnStudio() {
    studio = spawn('npx', ['remotion', 'studio', currentEntry(), `--props=${propsFile}`], {stdio: 'inherit'});
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
      mode,
      presetLabel: isPreset ? items[currentIndex] : presetLabel,
      animLabel: isPreset ? '' : items[currentIndex],
      index: currentIndex + 1,
      total: items.length,
      canMark: !isPreset,
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
      const idx = nextIndex(currentIndex, items.length);
      if (!isPreset) {
        // bg-anim 模式：拷贝下一个特效并改写 props（preset 模式只换入口、不动 props）。
        const label = items[idx];
        try {
          const {backgroundAnim, backgroundAnimKind} = prepareAnim({label, beatReactive});
          const props = JSON.parse(readFileSync(propsFile, 'utf-8'));
          props.backgroundAnim = backgroundAnim;
          props.backgroundAnimKind = backgroundAnimKind;
          writeFileSync(propsFile, JSON.stringify(props));
        } catch (e) {
          return send(res, 500, {error: String((e && e.message) || e)});
        }
      }
      currentIndex = idx; // 仅在（bg-anim）prepare+写 props 成功后再提交序号推进
      await restartStudio();
      if (!(await waitForStudio())) {
        return send(res, 500, {error: 'studio restart timeout'});
      }
      return send(res, 200, state());
    }
    if (req.method === 'POST' && url === '/mark') {
      if (isPreset) return send(res, 404, {error: 'mark not available in preset mode'});
      try {
        writeFileSync(resolve('animbg', items[currentIndex], 'blank.txt'), '');
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
    console.log(`${isPreset ? 'preset' : 'bg-anim'} 调试控制服务: http://localhost:${CONTROL_PORT}`);
    spawnStudio();
  });
}
