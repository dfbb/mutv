import React from 'react';

/**
 * 全局文字颜色覆盖（--font-fg-color / --font-bg-color）。
 * fgColor 覆盖所有文字的填充色；bgColor 用 8 方向 text-shadow 模拟勾边
 * （em 单位随各处字号等比缩放），并替换 preset 自带的 text-shadow/发光。
 * 两者都为空 → 零副作用（return null），完全跟随 preset 默认配色。
 *
 * hasFill / hasStroke：preset 是否自带填充 / 描边发光。默认 true（沿用旧行为）。
 * native preset 样式是 inline、无可扫描源，由各 Composition 显式声明：preset 没有
 * 描边的（如 fx-no2）传 hasStroke={false}，则 --font-bg-color 不再凭空强加勾边。
 */
const OUTLINE_OFFSETS = [
  '-0.05em -0.05em',
  '0.05em -0.05em',
  '-0.05em 0.05em',
  '0.05em 0.05em',
  '-0.07em 0',
  '0.07em 0',
  '0 -0.07em',
  '0 0.07em',
];

export const TextColorOverride: React.FC<{
  fgColor?: string;
  bgColor?: string;
  hasFill?: boolean;
  hasStroke?: boolean;
}> = ({fgColor, bgColor, hasFill = true, hasStroke = true}) => {
  if (!fgColor && !bgColor) return null;
  const decls: string[] = [];
  if (fgColor && hasFill) decls.push(`color: ${fgColor} !important;`);
  if (bgColor && hasStroke) {
    const shadow = OUTLINE_OFFSETS.map((off) => `${off} 0 ${bgColor}`).join(', ');
    decls.push(`text-shadow: ${shadow} !important;`);
  }
  if (!decls.length) return null;
  return <style>{`* { ${decls.join(' ')} }`}</style>;
};
