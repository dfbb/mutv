import React from 'react';

/**
 * 全局文字颜色覆盖（--font-fg-color / --font-bg-color）。
 * fgColor 覆盖所有文字的填充色；bgColor 用 8 方向 text-shadow 模拟勾边
 * （em 单位随各处字号等比缩放），并替换 preset 自带的 text-shadow/发光。
 * 两者都为空 → 零副作用（return null），完全跟随 preset 默认配色。
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

export const TextColorOverride: React.FC<{fgColor?: string; bgColor?: string}> = ({
  fgColor,
  bgColor,
}) => {
  if (!fgColor && !bgColor) return null;
  const decls: string[] = [];
  if (fgColor) decls.push(`color: ${fgColor} !important;`);
  if (bgColor) {
    const shadow = OUTLINE_OFFSETS.map((off) => `${off} 0 ${bgColor}`).join(', ');
    decls.push(`text-shadow: ${shadow} !important;`);
  }
  return <style>{`* { ${decls.join(' ')} }`}</style>;
};
