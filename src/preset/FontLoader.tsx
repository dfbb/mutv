import {useEffect, useState} from 'react';
import {staticFile, delayRender, continueRender} from 'remotion';

/**
 * 异步加载 --font 选中的 woff2 并注册到 document.fonts，使各 preset 文字可用该字体。
 * 用 delayRender/continueRender 确保渲染前字体已就绪。两者为空 → 零副作用（return null）。
 * 这是个纯副作用组件，不渲染任何可见内容。
 */
export const FontLoader: React.FC<{fontFamily?: string; fontFile?: string}> = ({
  fontFamily,
  fontFile,
}) => {
  const active = Boolean(fontFamily && fontFile);
  const [handle] = useState(() => (active ? delayRender(`load font ${fontFamily}`) : null));

  useEffect(() => {
    if (!active || handle === null) return;
    const url = fontFile!.startsWith('http') ? fontFile! : staticFile(fontFile!);
    let cancelled = false;
    const face = new FontFace(fontFamily!, `url(${url}) format('woff2')`);
    face
      .load()
      .then((loaded) => {
        // 即便已卸载也要 continueRender，否则会卡住 Remotion 渲染（Studio 热更边界）。
        if (cancelled) {
          continueRender(handle);
          return;
        }
        // document.fonts.add 在当前 TS DOM lib 类型里缺失，运行时存在，故断言。
        (document.fonts as unknown as {add: (f: FontFace) => void}).add(loaded);
        continueRender(handle);
      })
      .catch(() => continueRender(handle));
    return () => {
      cancelled = true;
    };
  }, [active, fontFamily, fontFile, handle]);

  return null;
};
