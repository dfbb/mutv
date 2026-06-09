import {existsSync, readdirSync} from 'fs';
import {resolve, join} from 'path';

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
