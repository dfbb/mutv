import {readFileSync, writeFileSync, existsSync, mkdirSync, cpSync} from 'fs';
import {resolve} from 'path';
import {needsVirtualMouse, injectVirtualMouse, injectBeatClock} from './animbgInject.mjs';

/**
 * 把 animbg/<label>/index.html 拷进 public/animbg/ 并返回 props 片段。
 * 与 render.mjs 原 inline 逻辑一致：注入虚拟鼠标 / beat 时钟、查 manifest 定
 * winamp 类别、按需拷贝 vendor 库。以 process.cwd()（= src/）为根。
 *
 * @param {{label: string, beatReactive: boolean}} opts
 * @returns {{backgroundAnim: string, backgroundAnimLabel: string, backgroundAnimKind: string}}
 */
export function prepareAnim({label, beatReactive}) {
  const animFile = resolve('animbg', label, 'index.html');
  if (!existsSync(animFile)) {
    throw new Error(`bg-anim "${label}" not found (expected ${animFile})`);
  }
  const pubDir = resolve('public');
  const animDir = resolve(pubDir, 'animbg');
  mkdirSync(animDir, {recursive: true});

  const animPublicName = `animbg-${label}.html`;
  let animHtml = readFileSync(animFile, 'utf-8');
  if (needsVirtualMouse(animHtml)) animHtml = injectVirtualMouse(animHtml);
  if (beatReactive) animHtml = injectBeatClock(animHtml);
  writeFileSync(resolve(animDir, animPublicName), animHtml);

  let backgroundAnimKind = '';
  try {
    const manifestPath = resolve('animbg', 'manifest.json');
    if (existsSync(manifestPath)) {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
      const entry = manifest.find((e) => e.label === label);
      if (entry && entry.category === 'WINAMP') backgroundAnimKind = 'winamp';
    }
  } catch {}

  if (animHtml.includes('vendor/')) {
    const vendorSrc = resolve('animbg', 'vendor');
    if (existsSync(vendorSrc)) {
      cpSync(vendorSrc, resolve(pubDir, 'vendor'), {recursive: true});
    }
  }

  return {backgroundAnim: `animbg/${animPublicName}`, backgroundAnimLabel: label, backgroundAnimKind};
}
