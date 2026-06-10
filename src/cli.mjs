#!/usr/bin/env node

/**
 * cli.mjs - Friendly wrapper for rendering music videos (Node port of render-mv.sh).
 *
 * Responsibilities (the "convenience" layer):
 *   - Parse friendly CLI args and resolve file paths to absolute
 *   - Default output naming (out/<audio_basename>.mp4)
 *   - CJK font check/auto-install in Linux containers
 *   - Invoke render.mjs (the core: props build + remotion)
 *   - Post-render standardized H.264 transcode (CRF 24, profile/level per --res; always)
 *
 * Usage:
 *   node cli.mjs --audio <file> --lyrics <lrc_or_srt> --title "Title" [options]
 *
 * Options:
 *   --audio       Audio file path (absolute or relative)
 *   --lyrics      LRC or SRT lyrics file
 *   --lyrics-json JSON lyrics file [{start, end, text}]
 *   --title       Video title (default: "Music Video")
 *   --subtitle    Subtitle text
 *   --credit      Bottom credit text
 *   --offset      Lyric timing offset in seconds (default: -0.5)
 *   --output      Output file path (default: out/<audio_basename>.mp4)
 *   --crf         视频质量/体积(libx264 -crf，默认 24；越大越小越糊，常用 20-28)
 *   --bg-image    Background image file OR directory (multi-image = transition slideshow)
 *   --bg-image-intvl  Seconds each carousel image holds (default 5)
 *   --bg-image-trans  Carousel transition group: soft|cool|hard (default soft)
 *   --bg-video    Background video file (mutually exclusive)
 *   --bg-anim     Animated background effect label (see src/animbg/), or 'random' (mutually exclusive)
 *   --no-bg-anim-beat  Disable beat-reactive animation for --bg-anim (default: enabled)
 *   --font        字体名(font/<lang>/ 下 woff2 去扩展名)或 'random'；按歌词语言自动选 en/zh_CN/zh_TW/kr/ja 目录
 *   --browser     Custom browser executable path (Chrome/Edge/Chromium)
 *   --preset      Visual template under preset/<label>/ (default: orig), or 'random'
 *   --res         Output resolution WxH (default: 1080x720)
 *   --fps         Frames per second (default: 24)
 *   --font-scale  字号倍率，整体放大/缩小所有文字(默认 1=跟随 preset；clamp 0.1–10)
 *   --html        Start a local web preview (Remotion Studio) instead of rendering
 *   --debug-bg-anim   与 --html 配合：在预览画面叠加 bg-anim 调试控制条（下一个/标记）
 *   --debug-preset    与 --html 配合：在预览画面叠加 preset 调试控制条（下一个）。与 --debug-bg-anim 互斥
 *
 * Environment variables:
 *   BROWSER_EXECUTABLE  Path to browser executable (overrides auto-detection)
 */

import {execSync, spawnSync} from 'child_process';
import {existsSync, mkdirSync} from 'fs';
import {resolve, dirname, basename, extname} from 'path';
import {fileURLToPath} from 'url';

const RENDER_DIR = dirname(fileURLToPath(import.meta.url));

// PLACEHOLDER_REST

// --- Parse args (value flags + boolean flags) ---
const booleanFlags = new Set(['html', 'no-bg-anim-beat', 'debug-bg-anim', 'debug-preset']);
const opts = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const key = argv[i];
  if (key === '-h' || key === '--help') {
    // Print the header doc block (lines between the first /** and */).
    const src = execSync(`sed -n '/^\\/\\*\\*/,/^ \\*\\//p' "${fileURLToPath(import.meta.url)}"`, {encoding: 'utf-8'});
    process.stdout.write(src);
    process.exit(0);
  }
  if (key.startsWith('--')) {
    const name = key.slice(2);
    if (booleanFlags.has(name)) {
      opts[name] = true;
    } else if (i + 1 < argv.length) {
      opts[name] = argv[i + 1];
      i++;
    }
  } else {
    console.error(`Error: unknown argument: ${key}`);
    process.exit(1);
  }
}

// --- Validate audio ---
if (!opts.audio) {
  console.error('Error: --audio is required');
  process.exit(1);
}
if (!existsSync(opts.audio)) {
  console.error(`Error: audio file not found: ${opts.audio}`);
  process.exit(1);
}

// --- Resolve paths to absolute ---
const audio = resolve(opts.audio);

// Default output: out/<audio_basename>.mp4
mkdirSync(resolve(RENDER_DIR, 'out'), {recursive: true});
const output = opts.output
  ? resolve(opts.output)
  : resolve(RENDER_DIR, 'out', basename(audio, extname(audio)) + '.mp4');
mkdirSync(dirname(output), {recursive: true});

// --- Build render.mjs args (array form, no shell escaping issues) ---
const nodeArgs = [
  resolve(RENDER_DIR, 'render.mjs'),
  '--audio', audio,
  '--title', opts.title || 'Music Video',
  '--offset', opts.offset || '-0.5',
  '--output', output,
  '--crf', opts.crf || '24',
  '--preset', opts.preset || 'orig',
];
if (opts.lyrics) nodeArgs.push('--lyrics', resolve(opts.lyrics));
else if (opts['lyrics-json']) nodeArgs.push('--lyrics-json', resolve(opts['lyrics-json']));
if (opts.subtitle) nodeArgs.push('--subtitle', opts.subtitle);
if (opts.credit) nodeArgs.push('--credit', opts.credit);
if (opts['bg-image']) nodeArgs.push('--bg-image', resolve(opts['bg-image']));
if (opts['bg-image-intvl']) nodeArgs.push('--bg-image-intvl', String(opts['bg-image-intvl']));
if (opts['bg-image-trans']) nodeArgs.push('--bg-image-trans', opts['bg-image-trans']);
if (opts['bg-video']) nodeArgs.push('--bg-video', resolve(opts['bg-video']));
if (opts['bg-anim']) nodeArgs.push('--bg-anim', opts['bg-anim']);
if (opts['no-bg-anim-beat']) nodeArgs.push('--no-bg-anim-beat');
if (opts.font) nodeArgs.push('--font', opts.font);
if (opts.browser) nodeArgs.push('--browser', opts.browser);
if (opts.res) nodeArgs.push('--res', opts.res);
if (opts.fps) nodeArgs.push('--fps', opts.fps);
if (opts['font-scale']) nodeArgs.push('--font-scale', opts['font-scale']);
if (opts.html) nodeArgs.push('--html');
if (opts['debug-bg-anim']) nodeArgs.push('--debug-bg-anim');
if (opts['debug-preset']) nodeArgs.push('--debug-preset');

// PLACEHOLDER_FONTS

// --- CJK font check for Linux container environments ---
function hasCmd(cmd) {
  return spawnSync('command', ['-v', cmd], {shell: true, stdio: 'ignore'}).status === 0;
}
function tryRun(cmd) {
  return spawnSync('sh', ['-c', cmd], {stdio: 'ignore'}).status === 0;
}
function checkAndInstallCjkFonts() {
  if (process.platform !== 'linux') return;

  if (hasCmd('fc-list')) {
    const zh = spawnSync('sh', ['-c', 'fc-list :lang=zh 2>/dev/null | head -1'], {encoding: 'utf-8'});
    const ja = spawnSync('sh', ['-c', 'fc-list :lang=ja 2>/dev/null | head -1'], {encoding: 'utf-8'});
    if ((zh.stdout && zh.stdout.trim()) || (ja.stdout && ja.stdout.trim())) return; // fonts present
  }

  console.log('⚠️  No CJK fonts detected. Non-ASCII lyrics may render as □ boxes.');

  if (hasCmd('apt-get')) {
    console.log('   Attempting to install fonts-noto-cjk...');
    if (tryRun('apt-get update -qq && apt-get install -y -qq fonts-noto-cjk') ||
        tryRun('sudo apt-get update -qq && sudo apt-get install -y -qq fonts-noto-cjk')) {
      if (hasCmd('fc-cache')) tryRun('fc-cache -f');
      console.log('   ✅ CJK fonts installed successfully.');
      return;
    }
  } else if (hasCmd('apk')) {
    console.log('   Attempting to install font-noto-cjk (Alpine)...');
    if (tryRun('apk add --no-cache font-noto-cjk')) {
      if (hasCmd('fc-cache')) tryRun('fc-cache -f');
      console.log('   ✅ CJK fonts installed successfully.');
      return;
    }
  } else if (hasCmd('dnf')) {
    console.log('   Attempting to install google-noto-sans-cjk-fonts (dnf)...');
    if (tryRun('dnf install -y -q google-noto-sans-cjk-fonts')) {
      if (hasCmd('fc-cache')) tryRun('fc-cache -f');
      console.log('   ✅ CJK fonts installed successfully.');
      return;
    }
  }

  console.log('   ⚠️  Could not auto-install CJK fonts. Please install manually:');
  console.log('      Debian/Ubuntu: apt-get install fonts-noto-cjk');
  console.log('      Alpine: apk add font-noto-cjk');
  console.log('      Fedora/RHEL: dnf install google-noto-sans-cjk-fonts');
}

checkAndInstallCjkFonts();

// PLACEHOLDER_RENDER

// --- Render (delegates to render.mjs) ---
console.log('Rendering MV...');
console.log(`  Audio: ${basename(audio)}`);
console.log(`  Title: ${opts.title || 'Music Video'}`);
if (!opts.html) console.log(`  Output: ${output}`);

const res = spawnSync('node', nodeArgs, {stdio: 'inherit', cwd: RENDER_DIR});
if (res.status !== 0) process.exit(res.status ?? 1);

// In --html mode render.mjs runs Studio (long-running); nothing more to do here.
if (opts.html) process.exit(0);

// 渲染由 render.mjs 一次成型（h264/CRF/slow/yuv420p/AAC 128k，h264 默认带 faststart），
// 无二次转码。
console.log('');
console.log(`Output: ${output}`);



