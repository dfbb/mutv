#!/usr/bin/env node

/**
 * Preset 全量冒烟测试脚本。
 *
 * 对 src/preset/ 下每个含 index.ts 的 preset 目录，用真实 cn-3 歌词与真实
 * cn-3.mp3 音频，通过 `npx remotion still` 渲染一帧真实静帧，任一 preset
 * 失败则以非零退出。这是迁移过程中的"广度"快速验证（end-to-end 用单独的
 * 全量 render 完成）。
 *
 * 用法（必须在 src/ 下运行）：
 *   cd src && node scripts/smoke-presets.mjs            # 全部 preset
 *   cd src && node scripts/smoke-presets.mjs fx-0       # 仅 fx-0 开头的 preset
 *   cd src && node scripts/smoke-presets.mjs --frame=120
 *
 * 第 288 帧 @24fps = 12s，落在歌词第 1 行（10.56s→13.8s）内，因此歌词
 * 渲染代码路径会真正执行。
 */

import {readdirSync, existsSync, mkdirSync, writeFileSync, rmSync} from 'node:fs';
import {join, resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url)); // src/scripts
const srcDir = resolve(here, '..'); // src
const presetRoot = join(srcDir, 'preset');
const outDir = join(srcDir, 'out', 'smoke');
mkdirSync(outDir, {recursive: true});

// 解析 argv：可选 --frame=N（默认 288），可选位置参数为 preset 名前缀过滤。
const args = process.argv.slice(2);
const frameArg = args.find((a) => a.startsWith('--frame='));
const frame = frameArg ? Number(frameArg.split('=')[1]) : 288;
const prefix = args.find((a) => !a.startsWith('--'));

// 镜像 render.mjs 的发现逻辑：跳过下划线开头目录，只取含 index.ts 的目录。
const presets = readdirSync(presetRoot)
  .filter((d) => !d.startsWith('_') && existsSync(join(presetRoot, d, 'index.ts')))
  .filter((d) => !prefix || d.startsWith(prefix))
  .sort();

// 真实 cn-3 数据：首 6 行歌词（秒为单位）+ 真实音频，无任何背景以隔离 preset/歌词。
const props = {
  audioFileName: 'cn-3.mp3',
  lyrics: [
    {start: 10.56, end: 13.8, text: '沧海一声笑'},
    {start: 13.8, end: 17.74, text: '滔滔两岸潮'},
    {start: 17.74, end: 22.16, text: '浮沉随浪'},
    {start: 22.16, end: 24.64, text: '只记今朝'},
    {start: 25.24, end: 28.34, text: '苍天笑'},
    {start: 28.34, end: 32.5, text: '纷纷世上潮'},
  ],
  title: '沧海一声笑',
  subtitle: '',
  creditText: '',
  durationInSeconds: 35,
  lyricOffset: 0,
  backgroundImage: '',
  backgroundVideo: '',
  backgroundAnim: '',
  backgroundCarousel: '',
  backgroundAnimBeat: false,
  backgroundAnimKind: '',
  width: 640,
  height: 360,
  fps: 24,
  fontFamily: '',
  fontFile: '',
  fontScale: 1,
  fontFgColor: '',
  fontBgColor: '',
};

const propsFile = join(outDir, 'props.json');
writeFileSync(propsFile, JSON.stringify(props));

if (presets.length === 0) {
  console.error(`没有匹配的 preset（前缀: ${prefix || '(无)'}）`);
  rmSync(propsFile, {force: true});
  process.exit(1);
}

const failed = [];
for (const p of presets) {
  const pngOut = join('out', 'smoke', `${p}.png`);
  const r = spawnSync(
    'npx',
    [
      'remotion',
      'still',
      join('preset', p, 'index.ts'),
      'MusicVideo',
      pngOut,
      `--frame=${frame}`,
      `--props=${propsFile}`,
      '--log=error',
    ],
    {cwd: srcDir, encoding: 'utf8', timeout: 120000},
  );
  const ok = r.status === 0 && existsSync(join(outDir, `${p}.png`));
  console.log(`${ok ? 'PASS' : 'FAIL'} ${p}`);
  if (!ok) {
    failed.push(p);
    // 失败时打印 stderr 尾部以便定位。
    console.error((r.stderr || r.stdout || '').slice(-1500));
  }
}

// 清理临时 props（保留 PNG 供后续任务检查）。
rmSync(propsFile, {force: true});

console.log(`\n${presets.length - failed.length}/${presets.length} passed`);
if (failed.length) {
  console.error('Failed:', failed.join(', '));
  process.exit(1);
}
