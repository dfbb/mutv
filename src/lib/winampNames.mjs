/**
 * winampNames.mjs — 从 butterchurn preset 原名机械提取唯一的两词 label。
 * 确定性、可追溯、可重跑:相同输入永远产出相同映射。
 */

// 提取有意义 token:按非字母数字切分,丢弃空串与纯数字串。
function tokens(key) {
  return key
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t && !/^\d+$/.test(t));
}

/** 取前两个有意义 token 组成 `<word>-<word>`;不足两词补 -fx 保持两段。 */
export function twoWordLabel(key) {
  const t = tokens(key);
  if (t.length === 0) return 'preset-fx';
  if (t.length === 1) return `${t[0]}-fx`;
  return `${t[0]}-${t[1]}`;
}

/**
 * 为一组原 key 生成 {label: key} 映射,label 全唯一。
 * 冲突时按出现顺序追加 -2、-3… 后缀(确定性)。
 */
export function buildNameMap(keys) {
  const used = new Map(); // baseLabel -> count
  const map = {};
  for (const key of keys) {
    const base = twoWordLabel(key);
    const n = (used.get(base) || 0) + 1;
    used.set(base, n);
    const label = n === 1 ? base : `${base}-${n}`;
    map[label] = key;
  }
  return map;
}
