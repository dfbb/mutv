/**
 * gen_winamp.mjs — 把 butterchurn-presets 主集合生成为 WINAMP bg-anim 模板。
 *
 * 用法:node scripts/gen_winamp.mjs
 * 读 src/animbg/vendor/butterchurnPresets.min.js 的 getPresets(),
 * 用 winampNames.buildNameMap 取唯一两词 label,为每个生成
 * src/animbg/<label>/index.html(薄壳),并把 WINAMP 条目写进 manifest.json
 * (覆盖 manifest 中 category===WINAMP 的旧条目,保留其它)。幂等可重跑。
 */
import {readFileSync, writeFileSync, mkdirSync, existsSync} from 'fs';
import {resolve, dirname} from 'path';
import {fileURLToPath} from 'url';
import vm from 'vm';
import {buildNameMap} from '../src/lib/winampNames.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ANIMBG = resolve(HERE, '..', 'src', 'animbg');

/** 在 vm 沙箱里加载 UMD presets 包,返回 getPresets() 的 key 列表。 */
export function loadPresetKeys(presetsJsPath) {
  const code = readFileSync(presetsJsPath, 'utf-8');
  const sandbox = {};
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  const BCP = sandbox.butterchurnPresets.default || sandbox.butterchurnPresets;
  return Object.keys(BCP.getPresets());
}

/** 生成单个薄壳 HTML。preset key 经 JSON.stringify + < 转义安全嵌入。 */
export function renderShellHtml(presetKey) {
  const safe = JSON.stringify(presetKey).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<style>html,body{margin:0;height:100%;background:#07080d;overflow:hidden}#bc{position:fixed;inset:0;width:100%;height:100%}</style>
<script src="../vendor/butterchurn.min.js"></script>
<script src="../vendor/butterchurnPresets.min.js"></script>
</head><body>
<canvas id="bc"></canvas>
<script>window.__BC_PRESET=${safe};</script>
<script src="../vendor/bc-player.js"></script>
</body></html>
`;
}

/** label→key 映射转 manifest 条目数组。 */
export function buildManifestEntries(map) {
  return Object.entries(map).map(([label, presetKey]) => ({
    label,
    name: label.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    category: 'WINAMP',
    tech: 'webgl',
    presetKey,
  }));
}

function main() {
  const presetsJs = resolve(ANIMBG, 'vendor', 'butterchurnPresets.min.js');
  const keys = loadPresetKeys(presetsJs);
  const map = buildNameMap(keys);
  const labels = Object.keys(map);
  if (labels.length !== keys.length) {
    throw new Error(`label 数(${labels.length})≠ preset 数(${keys.length})`);
  }

  for (const [label, key] of Object.entries(map)) {
    const dir = resolve(ANIMBG, label);
    mkdirSync(dir, {recursive: true});
    writeFileSync(resolve(dir, 'index.html'), renderShellHtml(key));
  }

  const manifestPath = resolve(ANIMBG, 'manifest.json');
  const existing = existsSync(manifestPath)
    ? JSON.parse(readFileSync(manifestPath, 'utf-8'))
    : [];
  const kept = existing.filter((e) => e.category !== 'WINAMP');
  const merged = kept.concat(buildManifestEntries(map));
  writeFileSync(manifestPath, JSON.stringify(merged, null, 2) + '\n');

  console.log(`Generated ${labels.length} WINAMP presets into animbg/`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
