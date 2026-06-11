// visual 类 CodePen 特效 → Remotion preset 的 CSS 转换脚本（postcss 实现）。
//
// 核心：CSS 动画在 Remotion 逐帧渲染下不会推进，故我们把动画暂停（引擎做），
// 再用每行注入的时间变量 --fx-t 驱动 animation-delay（delay = 原delay - var(--fx-t)）。
// 同时把每个特效的 CSS scope 到唯一类 .fx-<id> 下（无 Shadow DOM）。
//
// 导出 transformCss(css,id) 与 parseEffectFile(name,code)；main() 批量转换，
// 但仅在直接执行本文件时运行（不在测试中）。批量运行属于 Task 7。

import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';
import valueParser from 'postcss-value-parser';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// 直接执行时才用到（main），测试时不触发
const TIME_BASE_GLOBAL = new Set(['014', '030']);

/**
 * 把一个特效的 css 转换为已 scope、已改名 keyframes、已合成 --fx-t delay 的 css。
 * @param {string} css
 * @param {string} id  形如 '014'
 * @returns {string}
 */
export function transformCss(css, id) {
  const root = postcss.parse(css);
  const prefix = `.fx-${id}`;

  // 1. 收集 @keyframes / @-webkit-keyframes 名称，改名为 fx<id>-<name>
  const renameMap = new Map(); // 原名 -> 新名
  root.walkAtRules(/^(-webkit-)?keyframes$/, (atRule) => {
    const name = atRule.params.trim();
    const renamed = `fx${id}-${name}`;
    renameMap.set(name, renamed);
    atRule.params = renamed;
  });

  // 2. 删除所有 @import
  root.walkAtRules('import', (atRule) => atRule.remove());

  // 3. 删除所有 font-family 声明（字体由引擎 FontLoader 统一复用）。
  //    其余属性（font-size 等）不动。
  root.walkDecls('font-family', (decl) => decl.remove());

  // 4. 选择器加前缀；:host / :root 替换为 .fx-<id>。keyframes 内部的选择器（from/to/%）跳过。
  root.walkRules((rule) => {
    // 跳过 @keyframes 内部的关键帧选择器
    if (rule.parent && rule.parent.type === 'atrule' && /keyframes$/.test(rule.parent.name)) return;
    rule.selector = scopeSelector(rule.selector, prefix);
  });

  // 5. animation / animation-name 中的 keyframes 名引用同步改名
  if (renameMap.size) {
    root.walkDecls(/^(-webkit-)?animation(-name)?$/, (decl) => {
      const parsed = valueParser(decl.value);
      parsed.walk((node) => {
        if (node.type === 'word' && renameMap.has(node.value)) {
          node.value = renameMap.get(node.value);
        }
      });
      decl.value = parsed.toString();
    });
  }

  // 6. 合成 delay：让暂停的动画被 --fx-t 驱动。
  synthesizeDelays(root);

  return root.toString();
}

// 把单个选择器字符串里的每个逗号分隔子选择器加前缀
function scopeSelector(selector, prefix) {
  return selectorParser((selectors) => {
    selectors.each((sel) => {
      const first = sel.first;
      // 首节点是 :host / :root 伪类 → 整体替换为 .fx-<id>
      if (first && first.type === 'pseudo' && (first.value === ':host' || first.value === ':root')) {
        // :host / :root 整体替换为 .fx-<id>（prefix 形如 '.fx-014'，className 取去掉点的 'fx-014'）。
        // ':host .x' 中 :host 后的空白与其余节点由 replaceWith 保留。
        first.replaceWith(selectorParser.className({value: prefix.slice(1)}));
      } else {
        // 普通选择器：前置 '.fx-<id> '（类 + 后代组合子）
        const cls = selectorParser.className({value: prefix.slice(1)});
        const combinator = selectorParser.combinator({value: ' '});
        sel.prepend(combinator);
        sel.prepend(cls);
      }
    });
  }).processSync(selector);
}

// 给所有动画合成 animation-delay: calc(<delay> - var(--fx-t))
function synthesizeDelays(root) {
  root.walkRules((rule) => {
    if (rule.parent && rule.parent.type === 'atrule' && /keyframes$/.test(rule.parent.name)) return;

    // 6a. 现有 animation-delay 声明：每个逗号分隔值包进 calc(<v> - var(--fx-t))
    rule.walkDecls(/^(-webkit-)?animation-delay$/, (decl) => {
      const parts = splitTopComma(valueParser(decl.value));
      decl.value = parts.map((v) => `calc(${v.trim()} - var(--fx-t))`).join(', ');
    });

    // 6b. animation shorthand：抽取每个动画的 delay（第二个 <time>），
    //     追加一条 animation-delay longhand 覆盖之（CSS 层叠后者生效）。
    rule.walkDecls(/^(-webkit-)?animation$/, (decl) => {
      const animations = splitTopComma(valueParser(decl.value));
      const delays = animations.map(extractDelay);
      const delayValue = delays.map((d) => `calc(${d} - var(--fx-t))`).join(', ');
      decl.cloneAfter({prop: 'animation-delay', value: delayValue});
    });
  });
}

// 把一段 value（valueParser 解析结果）按顶层逗号拆成字符串数组
function splitTopComma(parsed) {
  const groups = [];
  let cur = [];
  for (const node of parsed.nodes) {
    if (node.type === 'div' && node.value === ',') {
      groups.push(valueParser.stringify(cur));
      cur = [];
    } else {
      cur.push(node);
    }
  }
  groups.push(valueParser.stringify(cur));
  return groups;
}

// 从单条 animation shorthand 取 delay：第一个 <time> 是 duration，第二个 <time> 是 delay。
// 无第二个 time → '0s'。
function extractDelay(animationStr) {
  const parsed = valueParser(animationStr);
  const times = [];
  parsed.walk((node) => {
    if (node.type === 'word' && isTime(node.value)) {
      times.push(node.value);
    }
    // calc(...) 等函数内不下钻找 time（保守：只认顶层裸 time 词）
    if (node.type === 'function') return false;
  });
  return times.length >= 2 ? times[1] : '0s';
}

// 是否为 <time> 词：数字 + s/ms 后缀
function isTime(word) {
  return /^-?(\d+\.?\d*|\.\d+)(s|ms)$/i.test(word);
}

/**
 * 执行特效文件的 BL.register({...})，捕获注册对象，并判定 timeBase 候选。
 * @param {string} filename 形如 '030-airport-info.js'
 * @param {string} code 文件源码
 * @returns {{effect: object, timeBaseCandidate: boolean}}
 */
export function parseEffectFile(filename, code) {
  let captured = null;
  const BL = {register(obj) { captured = obj; }};
  // eslint-disable-next-line no-new-func
  const fn = new Function('BL', code);
  fn(BL);
  if (!captured) throw new Error(`${filename}: 未捕获到 BL.register`);

  const timeBaseCandidate = computeTimeBaseCandidate(captured.css || '');
  return {effect: captured, timeBaseCandidate};
}

// timeBaseCandidate：有 infinite 动画 且 至少一个 keyframes 含位移属性 → 适合用全局时间轴
function computeTimeBaseCandidate(css) {
  let root;
  try {
    root = postcss.parse(css);
  } catch {
    return false;
  }

  // 1. 是否存在 infinite 迭代（animation shorthand 或 animation-iteration-count）
  let hasInfinite = false;
  root.walkDecls(/^(-webkit-)?animation(-iteration-count)?$/, (decl) => {
    valueParser(decl.value).walk((node) => {
      if (node.type === 'word' && node.value === 'infinite') hasInfinite = true;
    });
  });
  if (!hasInfinite) return false;

  // 2. 是否有 keyframes 含位移/平移属性
  let hasMotion = false;
  root.walkAtRules(/^(-webkit-)?keyframes$/, (atRule) => {
    atRule.walkDecls((decl) => {
      const prop = decl.prop.toLowerCase();
      if (['left', 'right', 'top', 'bottom', 'margin', 'translate'].includes(prop)) {
        hasMotion = true;
      } else if (prop === 'transform' && /translate/i.test(decl.value)) {
        hasMotion = true;
      }
    });
  });

  return hasInfinite && hasMotion;
}

// ============================ 批量转换（Task 7 使用，直接执行才跑） ============================

function slugOf(filename) {
  return filename.replace(/^\d+-/, '').replace(/\.js$/, '');
}

function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const effectDir = path.resolve(__dirname, '../../../example/effect');
  const files = fs.readdirSync(effectDir)
    .filter((f) => /^\d{3}-.*\.js$/.test(f))
    .filter((f) => {
      const n = parseInt(f.slice(0, 3), 10);
      return n >= 12 && n <= 97; // 跳过 001-011 与 core-*
    })
    .sort();

  for (const file of files) {
    const code = fs.readFileSync(path.join(effectDir, file), 'utf8');
    const {effect} = parseEffectFile(file, code);
    if (effect.kind !== 'visual') continue;
    const id = effect.id;
    const slug = slugOf(file);
    const css = transformCss(effect.css || '', id);
    const timeBase = TIME_BASE_GLOBAL.has(id) ? 'global' : 'line';

    const header = `// ${effect.name} · ${effect.src}，源 example/effect/${file}，本文件由 convert-effects.mjs 生成`;
    const effDef = `${header}
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: ${JSON.stringify(id)},
  name: ${JSON.stringify(effect.name)},
  src: ${JSON.stringify(effect.src || '')},
  css: ${JSON.stringify(css)},
  html: ${JSON.stringify(effect.html || '')},${effect.letterTpl ? `\n  letterTpl: ${JSON.stringify(effect.letterTpl)},` : ''}
  timeBase: ${JSON.stringify(timeBase)},
};
`;
    const effPath = path.resolve(__dirname, `../preset/_engine/effects/visual/${id}-${slug}.ts`);
    fs.mkdirSync(path.dirname(effPath), {recursive: true});
    fs.writeFileSync(effPath, effDef);

    const presetIndex = `import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/${id}-${slug}';

registerRoot(registerVisualPreset(effect));
`;
    const presetPath = path.resolve(__dirname, `../preset/fx-${id}-${slug}/index.ts`);
    fs.mkdirSync(path.dirname(presetPath), {recursive: true});
    fs.writeFileSync(presetPath, presetIndex);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
