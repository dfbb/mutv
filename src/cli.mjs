#!/usr/bin/env node

/**
 * cli.mjs - Friendly wrapper for rendering music videos (Node port of render-mv.sh).
 *
 * Responsibilities (the "convenience" layer):
 *   - Parse friendly CLI args and resolve file paths to absolute
 *   - Default output naming (out/<audio_basename>.mp4)
 *   - CJK font check/auto-install in Linux containers
 *   - Invoke render.mjs (the core: props build + remotion)
 *   - Post-render --max-size compression via two-pass ffmpeg
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
 *   --codec       h264|h265|vp8|vp9 (default: h264)
 *   --bg-image    Background image file OR directory (multi-image = transition slideshow)
 *   --bg-image-intvl  Seconds each carousel image holds (default 5)
 *   --bg-image-trans  Carousel transition group: soft|cool|hard (default soft)
 *   --bg-video    Background video file (mutually exclusive)
 *   --bg-anim     Animated background effect label (see src/animbg/), or 'random' (mutually exclusive)
 *   --no-bg-anim-beat  Disable beat-reactive animation for --bg-anim (default: enabled)
 *   --browser     Custom browser executable path (Chrome/Edge/Chromium)
 *   --preset      Visual template under preset/<label>/ (default: orig), or 'random'
 *   --res         Output resolution WxH (default: 1080x720)
 *   --fps         Frames per second (default: 24)
 *   --max-size    Max output size in MB; compresses video if exceeded
 *   --html        Start a local web preview (Remotion Studio) instead of rendering
 *   --debug-bg-anim   与 --html 配合：在预览画面叠加 bg-anim 调试控制条（下一个/标记）
 *
 * Environment variables:
 *   BROWSER_EXECUTABLE  Path to browser executable (overrides auto-detection)
 */

import {execSync, spawnSync} from 'child_process';
import {existsSync, mkdirSync, statSync, rmSync} from 'fs';
import {resolve, dirname, basename, extname} from 'path';
import {fileURLToPath} from 'url';

const RENDER_DIR = dirname(fileURLToPath(import.meta.url));

// PLACEHOLDER_REST

// --- Parse args (value flags + boolean flags) ---
const booleanFlags = new Set(['html', 'no-bg-anim-beat', 'debug-bg-anim']);
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
  '--codec', opts.codec || 'h264',
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
if (opts.browser) nodeArgs.push('--browser', opts.browser);
if (opts.res) nodeArgs.push('--res', opts.res);
if (opts.fps) nodeArgs.push('--fps', opts.fps);
if (opts.html) nodeArgs.push('--html');
if (opts['debug-bg-anim']) nodeArgs.push('--debug-bg-anim');

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

// --- Post-render: compress if --max-size is set ---
if (opts['max-size'] && existsSync(output)) {
  const maxSizeMb = parseInt(opts['max-size'], 10);
  const fileBytes = statSync(output).size;
  const maxBytes = maxSizeMb * 1024 * 1024;

  if (fileBytes > maxBytes) {
    console.log('');
    console.log(`Video size ${Math.floor(fileBytes / 1024 / 1024)}MB exceeds ${maxSizeMb}MB limit. Compressing...`);

    const compressed = output.replace(/\.mp4$/, '_compressed.mp4');

    let duration;
    try {
      duration = parseFloat(execSync(
        `ffprobe -v error -show_entries format=duration -of csv=p=0 "${output}"`,
        {encoding: 'utf-8'}
      ).trim());
    } catch {
      duration = NaN;
    }
    if (!Number.isFinite(duration)) {
      console.error('Error: Cannot determine video duration for compression.');
      process.exit(1);
    }

    // Target total bitrate (bits/s) from max size and duration, with 0.95 safety margin.
    const targetBitrate = Math.floor((maxBytes * 8 / duration) * 0.95);
    const audioBitrate = 96000; // 96k audio
    const videoBitrate = targetBitrate - audioBitrate;

    if (videoBitrate < 100000) {
      console.error('Error: Target size too small for this video duration.');
      process.exit(1);
    }

    console.log(`  Target video bitrate: ${Math.floor(videoBitrate / 1000)}kbps`);

    // Two-pass encoding for best quality at target size.
    spawnSync('ffmpeg', ['-y', '-i', output, '-c:v', 'libx264', '-b:v', String(videoBitrate),
      '-pass', '1', '-preset', 'medium', '-an', '-f', 'null', '/dev/null'], {stdio: 'ignore', cwd: RENDER_DIR});
    spawnSync('ffmpeg', ['-y', '-i', output, '-c:v', 'libx264', '-b:v', String(videoBitrate),
      '-pass', '2', '-preset', 'medium', '-c:a', 'aac', '-b:a', '96k',
      '-movflags', '+faststart', compressed], {stdio: 'ignore', cwd: RENDER_DIR});

    // Clean up two-pass log files.
    for (const f of ['ffmpeg2pass-0.log', 'ffmpeg2pass-0.log.mbtree']) {
      try { rmSync(resolve(RENDER_DIR, f)); } catch {}
    }

    if (existsSync(compressed)) {
      const compBytes = statSync(compressed).size;
      console.log(`  Compressed: ${Math.floor(compBytes / 1024 / 1024)}MB (was ${Math.floor(fileBytes / 1024 / 1024)}MB)`);
      rmSync(output);
      spawnSync('mv', [compressed, output]);
      console.log(`  ✅ Compressed video saved to: ${output}`);
    } else {
      console.log('  ⚠️  Compression failed, keeping original file.');
    }
  } else {
    console.log(`Video size ${Math.floor(fileBytes / 1024 / 1024)}MB is within ${maxSizeMb}MB limit. No compression needed.`);
  }
}

console.log('');
console.log(`Output: ${output}`);



