#!/usr/bin/env node

/**
 * CLI entry point for rendering music videos.
 * 
 * Usage:
 *   node render.mjs --audio music.mp3 --lyrics lyrics.lrc --title "Song Name" --output out/video.mp4
 *   node render.mjs --audio music.mp3 --lyrics-json lyrics.json --title "Song Name"
 * 
 * Options:
 *   --audio        Audio file path (absolute paths auto-copied to public/) or filename in public/
 *   --lyrics       Path to LRC format lyrics file
 *   --lyrics-json  Path to JSON lyrics file [{start, end, text}]
 *   --title        Main title (default: "Music Video")
 *   --subtitle     Subtitle (default: "")
 *   --credit       Bottom credit text (default: "")
 *   --duration     Audio duration in seconds (auto-detected if omitted)
 *   --offset       Lyric timing offset in seconds (default: -0.5)
 *   --output       Output file path (default: out/video.mp4)
 *   --codec        Video codec: h264, h265, vp8, vp9 (default: h264)
 *   --bg-image     Background image file OR directory (multi-image = transition slideshow)
 *   --bg-image-intvl   Seconds each carousel image holds (default 5)
 *   --bg-image-trans   Carousel transition group: soft|cool|hard (default soft)
 *   --bg-video     Background video file (mutually exclusive)
 *   --bg-anim      Animated background effect label under animbg/<label>/, or 'random' (mutually exclusive)
 *   --preset       Visual template under preset/<label>/ (default: orig)
 *   --res          Output resolution WxH (default: 1080x720)
 *   --fps          Frames per second (default: 24)
 *   --html         Launch local Remotion Studio preview instead of rendering
 */

import {execSync, spawn} from 'child_process';
import {readFileSync, writeFileSync, readdirSync, existsSync, copyFileSync, mkdirSync, statSync} from 'fs';
import {resolve, basename, isAbsolute, join} from 'path';
import {prepareAnim} from './animbgPrepare.mjs';
import {startStudioControl} from './studioControl.mjs';
import {buildCarousel} from './lib/buildCarousel.mjs';
import {isValidGroup, VALID_GROUPS} from './lib/transitionGroups.mjs';
import {homedir} from 'os';

/**
 * Resolve a file path that may be a MSYS2/Cygwin-style path on Windows.
 * Converts paths like /e/foo/bar to E:/foo/bar for Node.js compatibility.
 */
function resolveFilePath(p) {
  if (process.platform === 'win32' && /^\/[a-zA-Z]\//.test(p)) {
    // Convert MSYS2 path /x/... to X:/...
    return p[1].toUpperCase() + ':' + p.slice(2);
  }
  return resolve(p);
}

/**
 * Find a usable browser executable for Remotion rendering.
 *
 * Search priority:
 *   1. Environment variable BROWSER_EXECUTABLE
 *   2. CLI argument --browser
 *   3. Remotion cache (chrome-headless-shell)
 *   4. System Chrome (requires --chrome-mode=chrome-for-testing)
 *   5. System Edge (requires --chrome-mode=chrome-for-testing)
 *   6. System Chromium (requires --chrome-mode=chrome-for-testing)
 *
 * Returns {path, chromeMode} or {path: null, chromeMode: 'headless-shell'} if not found.
 *
 * chromeMode:
 *   - 'headless-shell': for chrome-headless-shell binary (uses --headless=old)
 *   - 'chrome-for-testing': for regular Chrome/Edge/Chromium (uses --headless=new)
 */
function findBrowserExecutable(cliOverride) {
  // 1. Environment variable — highest priority
  const envExe = process.env.BROWSER_EXECUTABLE;
  if (envExe && existsSync(envExe)) {
    const mode = isHeadlessShell(envExe) ? 'headless-shell' : 'chrome-for-testing';
    return {path: envExe, chromeMode: mode};
  }

  // 2. CLI argument
  if (cliOverride && existsSync(cliOverride)) {
    const mode = isHeadlessShell(cliOverride) ? 'headless-shell' : 'chrome-for-testing';
    return {path: cliOverride, chromeMode: mode};
  }

  const platform = process.platform;
  const home = homedir();

  // 3. Local node_modules/.remotion (chrome-headless-shell) — uses --headless=old
  const localCacheDir = join(process.cwd(), 'node_modules', '.remotion', 'chrome-headless-shell');
  if (existsSync(localCacheDir)) {
    try {
      // Structure: chrome-headless-shell/linux64/chrome-headless-shell-linux64/chrome-headless-shell
      const platformDir = platform === 'win32' ? 'win64' : platform === 'darwin' ? 'mac-arm64' : 'linux64';
      const exeName = platform === 'win32' ? 'chrome-headless-shell.exe' : 'chrome-headless-shell';
      const platformPath = join(localCacheDir, platformDir);

      if (existsSync(platformPath)) {
        const subdirs = readdirSync(platformPath);
        for (const subdir of subdirs) {
          const exe = join(platformPath, subdir, exeName);
          if (existsSync(exe)) return {path: exe, chromeMode: 'headless-shell'};
        }
      }
    } catch {}
  }

  // 4. User home Remotion cache (chrome-headless-shell) — uses --headless=old
  let cacheDir;
  if (platform === 'win32') {
    cacheDir = join(home, 'AppData', 'Local', 'remotion', 'chrome-headless-shell');
  } else if (platform === 'darwin') {
    cacheDir = join(home, 'Library', 'Caches', 'remotion', 'chrome-headless-shell');
  } else {
    cacheDir = join(home, '.cache', 'remotion', 'chrome-headless-shell');
  }

  if (existsSync(cacheDir)) {
    try {
      const versions = readdirSync(cacheDir).sort().reverse();
      const exeName = platform === 'win32' ? 'chrome-headless-shell.exe' : 'chrome-headless-shell';
      for (const ver of versions) {
        const exe = join(cacheDir, ver, exeName);
        if (existsSync(exe)) return {path: exe, chromeMode: 'headless-shell'};
      }
    } catch {}
  }

  // 4-6. System browsers: Chrome, Edge, Chromium — require --chrome-mode=chrome-for-testing
  const browserPaths = platform === 'win32' ? [
    // Chrome
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    // Edge (pre-installed on Windows 10/11)
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ] : platform === 'darwin' ? [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ] : [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/microsoft-edge',
    '/usr/bin/microsoft-edge-stable',
  ];

  for (const p of browserPaths) {
    if (existsSync(p)) return {path: p, chromeMode: 'chrome-for-testing'};
  }

  return {path: null, chromeMode: 'headless-shell'};
}

/**
 * Check if the given executable path is a chrome-headless-shell binary.
 */
function isHeadlessShell(exePath) {
  const name = exePath.toLowerCase().replace(/\\/g, '/');
  return name.includes('chrome-headless-shell');
}

function parseLrc(content) {
  const lines = content.split(/\r?\n/).filter(l => l.trim());
  const parsed = [];
  for (const line of lines) {
    const match = line.match(/^\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]\s*(.*)$/);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const cs = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) / 1000 : 0;
      const time = minutes * 60 + seconds + cs;
      const text = match[4].trim();
      parsed.push({time, text});
    }
  }
  const result = [];
  for (let i = 0; i < parsed.length; i++) {
    const start = parsed[i].time;
    const end = i < parsed.length - 1 ? parsed[i + 1].time : start + 5;
    if (parsed[i].text) {
      result.push({start, end, text: parsed[i].text});
    }
  }
  return result;
}

function parseSrt(content) {
  // SRT format: index line, "HH:MM:SS,mmm --> HH:MM:SS,mmm", one or more text lines, blank line
  const toSeconds = (h, m, s, ms) =>
    parseInt(h, 10) * 3600 + parseInt(m, 10) * 60 + parseInt(s, 10) + parseInt(ms, 10) / 1000;
  const result = [];
  const blocks = content.replace(/\r\n/g, '\n').split(/\n\s*\n/);
  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;
    // Find the timing line (handles optional leading index line)
    const timeIdx = lines.findIndex(l => /-->/.test(l));
    if (timeIdx === -1) continue;
    const m = lines[timeIdx].match(
      /(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/
    );
    if (!m) continue;
    const start = toSeconds(m[1], m[2], m[3], m[4]);
    const end = toSeconds(m[5], m[6], m[7], m[8]);
    const text = lines.slice(timeIdx + 1).join(' ').trim();
    if (text) result.push({start, end, text});
  }
  return result;
}

function getAudioDuration(filePath) {
  try {
    const result = execSync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`,
      {encoding: 'utf-8'}
    ).trim();
    return parseFloat(result);
  } catch {
    return null;
  }
}

function parseArgs(argv) {
  // Flags that take no value (presence = true)
  const booleanFlags = new Set(['html', 'no-bg-anim-beat', 'debug-bg-anim', 'debug-preset']);
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const key = argv[i];
    if (key.startsWith('--')) {
      const name = key.slice(2);
      if (booleanFlags.has(name)) {
        args[name] = true;
      } else if (i + 1 < argv.length) {
        args[name] = argv[i + 1];
        i++;
      }
    }
  }
  return args;
}

const args = parseArgs(process.argv);

// --debug-preset 与 --debug-bg-anim 互斥（都需配合 --html）。
if (args['debug-preset'] && args['debug-bg-anim']) {
  console.error('Error: --debug-preset 与 --debug-bg-anim 互斥，不能同时使用');
  process.exit(1);
}

// 节拍反应默认开;--no-bg-anim-beat 关闭;--bg-anim-beat=false 也关闭。
const beatReactive =
  !args['no-bg-anim-beat'] &&
  String(args['bg-anim-beat'] ?? 'true').toLowerCase() !== 'false';

// Resolve preset: visual template under preset/<label>/. Default 'orig'. 'random' picks one at random.
const availablePresets = existsSync(resolve('preset'))
  ? readdirSync(resolve('preset')).filter(d => existsSync(join(resolve('preset'), d, 'index.ts')))
  : [];
let presetLabel = args.preset || 'orig';
if (presetLabel === 'random') {
  if (availablePresets.length === 0) {
    console.error('Error: --preset random requested but no presets found');
    process.exit(1);
  }
  presetLabel = availablePresets[Math.floor(Math.random() * availablePresets.length)];
  console.log(`Randomly selected preset: ${presetLabel}`);
}
const presetDir = resolve('preset', presetLabel);
const presetEntry = join(presetDir, 'index.ts');
if (!existsSync(presetEntry)) {
  console.error(`Error: preset "${presetLabel}" not found (expected ${presetEntry})`);
  console.error(`Available presets: ${availablePresets.length ? availablePresets.join(', ') : '(none)'}`);
  process.exit(1);
}

// Resolution (--res WxH) and fps (--fps N). Defaults: 1080x720 @ 24fps.
let resWidth = 1080;
let resHeight = 720;
if (args.res) {
  const m = String(args.res).match(/^(\d+)x(\d+)$/i);
  if (!m) {
    console.error(`Error: --res must be in WxH format (e.g. 1920x1080), got: ${args.res}`);
    process.exit(1);
  }
  resWidth = parseInt(m[1], 10);
  resHeight = parseInt(m[2], 10);
}
let fps = 24;
if (args.fps) {
  fps = parseInt(args.fps, 10);
  if (!Number.isFinite(fps) || fps <= 0) {
    console.error(`Error: --fps must be a positive integer, got: ${args.fps}`);
    process.exit(1);
  }
}

// Validate required args
if (!args.audio) {
  console.error('Error: --audio is required');
  console.error('Usage: node render.mjs --audio music.mp3 --lyrics lyrics.lrc --title "Song"');
  process.exit(1);
}

// If audio is an absolute path, copy it into public/ and use the filename
let audioFileName = args.audio;
const resolvedAudio = resolveFilePath(args.audio);
if (isAbsolute(resolvedAudio)) {
  if (!existsSync(resolvedAudio)) {
    console.error(`Error: Audio file not found: ${resolvedAudio}`);
    process.exit(1);
  }
  const pubDir = resolve('public');
  mkdirSync(pubDir, {recursive: true});
  const fname = basename(resolvedAudio);
  const dest = resolve(pubDir, fname);
  if (resolve(resolvedAudio) !== dest) {
    copyFileSync(resolvedAudio, dest);
    console.log(`Copied audio to public/${fname}`);
  }
  audioFileName = fname;
} else {
  // Relative name — must exist in public/
  const audioPath = resolve('public', args.audio);
  if (!existsSync(audioPath)) {
    console.error(`Error: Audio file not found in public/: ${args.audio}`);
    process.exit(1);
  }
}

// Parse lyrics
let lyrics = [];
if (args.lyrics) {
  const lrcPath = resolveFilePath(args.lyrics);
  if (!existsSync(lrcPath)) {
    console.error(`Error: LRC file not found: ${lrcPath}`);
    process.exit(1);
  }
  lyrics = parseLrc(readFileSync(lrcPath, 'utf-8'));
  console.log(`Parsed ${lyrics.length} lyric lines from LRC file`);
  // Fall back to SRT parsing if LRC produced nothing (file is actually SRT)
  if (lyrics.length === 0) {
    const srtParsed = parseSrt(readFileSync(lrcPath, 'utf-8'));
    if (srtParsed.length > 0) {
      lyrics = srtParsed;
      console.log(`Parsed ${lyrics.length} lyric lines from SRT file`);
    }
  }
} else if (args['lyrics-json']) {
  const jsonPath = resolveFilePath(args['lyrics-json']);
  if (!existsSync(jsonPath)) {
    console.error(`Error: JSON lyrics file not found: ${jsonPath}`);
    process.exit(1);
  }
  lyrics = JSON.parse(readFileSync(jsonPath, 'utf-8'));
  console.log(`Loaded ${lyrics.length} lyric lines from JSON file`);
}

// --- Background sources (mutually exclusive): video > image > anim ---
const bgFlags = ['bg-video', 'bg-image', 'bg-anim'].filter((k) => args[k]);
if (bgFlags.length > 1) {
  console.error(`Error: choose only one background source (got: ${bgFlags.map((f) => '--' + f).join(', ')})`);
  process.exit(1);
}

function copyToPublic(srcPath, kind) {
  const resolved = resolveFilePath(srcPath);
  if (!existsSync(resolved)) {
    console.error(`Error: ${kind} file not found: ${resolved}`);
    process.exit(1);
  }
  const pubDir = resolve('public');
  mkdirSync(pubDir, {recursive: true});
  const name = basename(resolved);
  const dest = resolve(pubDir, name);
  if (resolve(resolved) !== dest) {
    copyFileSync(resolved, dest);
    console.log(`Copied ${kind} to public/${name}`);
  }
  return name;
}

let backgroundImage = '';
let backgroundVideo = '';
let backgroundAnim = '';
let backgroundCarousel = '';
let backgroundAnimLabel = '';
let backgroundAnimKind = '';

if (args['bg-image']) {
  const resolvedBg = resolveFilePath(args['bg-image']);
  if (!existsSync(resolvedBg)) {
    console.error(`Error: background path not found: ${resolvedBg}`);
    process.exit(1);
  }
  const isDir = statSync(resolvedBg).isDirectory();
  if (!isDir) {
    backgroundImage = copyToPublic(args['bg-image'], 'background image');
  } else {
    // Directory: scan images, sort by name
    const IMG_RE = /\.(jpe?g|png|webp|gif)$/i;
    const imgs = readdirSync(resolvedBg).filter((f) => IMG_RE.test(f)).sort();
    if (imgs.length === 0) {
      console.error(`Error: no images (jpg/jpeg/png/webp/gif) found in directory: ${resolvedBg}`);
      process.exit(1);
    }
    if (imgs.length === 1) {
      backgroundImage = copyToPublic(join(resolvedBg, imgs[0]), 'background image');
    } else {
      // carousel
      const group = args['bg-image-trans'] || 'soft';
      if (!isValidGroup(group)) {
        console.error(`Error: --bg-image-trans must be one of ${VALID_GROUPS.join('|')}, got: ${group}`);
        process.exit(1);
      }
      const intvl = args['bg-image-intvl'] ? parseFloat(args['bg-image-intvl']) : 5;
      if (!(intvl > 0)) {
        console.error(`Error: --bg-image-intvl must be a positive number, got: ${args['bg-image-intvl']}`);
        process.exit(1);
      }
      const pubDir = resolve('public');
      mkdirSync(pubDir, {recursive: true});
      // Copy images to public/ and pass their public-relative filenames to buildCarousel.
      // Images are served from localhost (same-origin as the IFrame), so no CORS issues.
      const imageUrls = imgs.map((name, i) => {
        const dest = `bgimg-${String(i).padStart(3, '0')}-${name}`;
        copyFileSync(join(resolvedBg, name), resolve(pubDir, dest));
        return dest;
      });
      const html = buildCarousel({
        imageUrls,
        intvl,
        transDur: 1,
        group,
        width: resWidth,
        height: resHeight,
        seed: Math.floor(Math.random() * 0xffffffff),
      });
      writeFileSync(resolve(pubDir, 'bgimage-carousel.html'), html);
      backgroundCarousel = 'bgimage-carousel.html';
      console.log(`Using image carousel: ${imageUrls.length} images, ${intvl}s interval, ${group} transitions`);
    }
  }
} else if (args['bg-video']) {
  backgroundVideo = copyToPublic(args['bg-video'], 'background video');
} else if (args['bg-anim']) {
  const avail = existsSync(resolve('animbg'))
    ? readdirSync(resolve('animbg')).filter((d) => existsSync(join(resolve('animbg'), d, 'index.html')))
    : [];
  let animLabel = args['bg-anim'];
  if (animLabel === 'random') {
    if (avail.length === 0) {
      console.error('Error: --bg-anim random requested but no animated backgrounds found (run scripts/fetch_animbg.py)');
      process.exit(1);
    }
    animLabel = avail[Math.floor(Math.random() * avail.length)];
    console.log(`Randomly selected animated background: ${animLabel}`);
  }
  const animFile = resolve('animbg', animLabel, 'index.html');
  if (!existsSync(animFile)) {
    console.error(`Error: bg-anim "${animLabel}" not found (expected ${animFile})`);
    console.error(`Available animated backgrounds: ${avail.length ? avail.join(', ') : '(none — run scripts/fetch_animbg.py)'}`);
    process.exit(1);
  }
  // 拷贝逻辑已抽到 animbgPrepare.mjs（与 --debug-bg-anim 的「下一个」共用）。
  ({backgroundAnim, backgroundAnimKind} = prepareAnim({label: animLabel, beatReactive}));
  backgroundAnimLabel = animLabel;
  console.log(`Using animated background: ${animLabel}`);
}

// Determine audio duration
let duration = args.duration ? parseFloat(args.duration) : null;
if (!duration) {
  const audioPath = resolve('public', audioFileName);
  if (existsSync(audioPath)) {
    duration = getAudioDuration(audioPath);
    if (duration) {
      console.log(`Auto-detected audio duration: ${duration.toFixed(2)}s`);
    }
  }
}
if (!duration) {
  console.error('Error: Could not detect audio duration. Please provide --duration');
  process.exit(1);
}

// Build input props
// Sanitize title: single-line, max 50 chars
const rawTitle = (args.title || 'Music Video').replace(/[\r\n]+/g, ' ').trim();
const title = rawTitle.length > 50 ? rawTitle.slice(0, 47) + '...' : rawTitle;

const inputProps = {
  audioFileName: audioFileName,
  lyrics,
  title,
  subtitle: (args.subtitle || '').replace(/[\r\n]+/g, ' ').trim(),
  creditText: args.credit || '',
  durationInSeconds: duration,
  lyricOffset: args.offset ? parseFloat(args.offset) : -0.5,
  backgroundImage,
  backgroundVideo,
  backgroundAnim,
  backgroundCarousel,
  backgroundAnimBeat: beatReactive,
  backgroundAnimKind,
  width: resWidth,
  height: resHeight,
  fps,
};

const output = args.output ? resolveFilePath(args.output) : 'out/video.mp4';
const codec = args.codec || 'h264';

// Write props to temp file to avoid shell escaping issues
const propsFile = resolve('.render-props.json');
writeFileSync(propsFile, JSON.stringify(inputProps));

// --html mode: launch the Remotion Studio (local web preview) instead of rendering.
// The props file is kept on disk so Studio can load it; Studio is a long-running server.
if (args.html) {
  console.log(`\nStarting local web preview (Remotion Studio)...`);
  console.log(`  Preset: ${presetLabel}`);
  console.log(`  Audio: ${args.audio}`);
  console.log(`  Title: ${inputProps.title}`);
  console.log(`  Duration: ${duration.toFixed(1)}s`);
  console.log(`  Resolution: ${resWidth}x${resHeight} @ ${fps}fps`);
  console.log(`  Lyrics: ${lyrics.length} lines`);
  if (backgroundImage) console.log(`  Background: ${backgroundImage}`);
  if (backgroundVideo) console.log(`  Background video: ${backgroundVideo}`);
  if (backgroundAnim) console.log(`  Background anim: ${backgroundAnimLabel}`);
  if (backgroundCarousel) console.log(`  Background carousel: ${backgroundCarousel}`);
  console.log('');
  console.log('  A browser tab will open at http://localhost:3000 (Composition: MusicVideo).');
  console.log('  Press Ctrl+C to stop the server.\n');

  // Do NOT delete the props file here — Studio needs it while running.
  if (args['debug-bg-anim']) {
    // 调试模式：由控制服务接管 studio 子进程，并提供 bg-anim 切换/标记。
    console.log('  bg-anim 调试控制条已启用（叠加在预览画面上）。');
    startStudioControl({mode: 'bg-anim', presetEntry, propsFile, presetLabel, beatReactive, prepareAnim});
  } else if (args['debug-preset']) {
    // 调试模式：循环切换 preset（换 studio 入口重启），无标记。
    console.log('  preset 调试控制条已启用（叠加在预览画面上）。');
    startStudioControl({mode: 'preset', presetEntry, propsFile, presetLabel, beatReactive, prepareAnim});
  } else {
    // Inherit stdio so Studio's "Server ready" line is shown live.
    const studio = spawn(
      'npx',
      ['remotion', 'studio', presetEntry, `--props=${propsFile}`],
      {stdio: 'inherit'}
    );
    studio.on('exit', (code) => process.exit(code ?? 0));
  }
} else {

const {path: browserExe, chromeMode} = findBrowserExecutable(args.browser);

if (!browserExe) {
  console.warn('⚠️  No browser found. Remotion will attempt to download chrome-headless-shell from Google servers.');
  console.warn('   If download fails (e.g. Google servers inaccessible), try one of these:');
  console.warn('   1. Set environment variable: BROWSER_EXECUTABLE=/path/to/chrome-or-edge');
  console.warn('   2. Pass CLI argument: --browser /path/to/chrome-or-edge');
  console.warn('   3. Enable proxy and retry');
  console.warn('');
}

const cmd = [
  'npx remotion render',
  `"${presetEntry}"`,
  'MusicVideo',
  `"${output}"`,
  `--props="${propsFile}"`,
  `--codec=${codec}`,
  '--log=error',
  // WebGL-based anim effects (Vanta/three) need a real GL backend; the default
  // headless context fails to create one. ANGLE provides software WebGL.
  backgroundAnim ? '--gl=angle' : '',
  browserExe ? `--browser-executable="${browserExe}"` : '',
  chromeMode !== 'headless-shell' ? `--chrome-mode=${chromeMode}` : '',
].filter(Boolean).join(' ');

console.log(`\nRendering video...`);
console.log(`  Preset: ${presetLabel}`);
console.log(`  Audio: ${args.audio}`);
console.log(`  Title: ${inputProps.title}`);
console.log(`  Duration: ${duration.toFixed(1)}s`);
console.log(`  Resolution: ${resWidth}x${resHeight} @ ${fps}fps`);
console.log(`  Lyrics: ${lyrics.length} lines`);
console.log(`  Output: ${output}`);
console.log(`  Codec: ${codec}`);
if (backgroundImage) console.log(`  Background: ${backgroundImage}`);
if (backgroundVideo) console.log(`  Background video: ${backgroundVideo}`);
if (backgroundAnim) console.log(`  Background anim: ${backgroundAnimLabel}`);
if (backgroundCarousel) console.log(`  Background carousel: ${backgroundCarousel}`);
if (browserExe) console.log(`  Browser: ${browserExe}`);
if (chromeMode !== 'headless-shell') console.log(`  Chrome mode: ${chromeMode}`);
console.log('');

try {
  const result = execSync(cmd, {encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe']});
  // Only show the final output file line (starts with '+') and size info
  const outputLines = result.split(/\r?\n/).filter(l => l.includes(output) || /^\+/.test(l.replace(/\x1b\[[0-9;]*m/g, '').trim()));
  if (outputLines.length) console.log(outputLines.join('\n'));
  console.log(`\n✅ Video rendered successfully: ${output}`);
} catch (e) {
  // Show stderr on failure for debugging
  if (e.stderr) console.error(e.stderr.toString());
  console.error('\n❌ Render failed');
  process.exit(1);
} finally {
  // Clean up temp props file
  try {
    const {unlinkSync} = await import('fs');
    unlinkSync(propsFile);
  } catch {}
}

} // end of render (non-html) branch
