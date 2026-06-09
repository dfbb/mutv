/**
 * langDetect.mjs — 从歌词文本检测语言，用于 --font 选择字库目录。
 *
 * 返回 'en' | 'zh_CN' | 'zh_TW' | 'kr' | 'ja'。纯 Unicode 启发式，无外部依赖。
 * 顺序：先假名(日)→ 谚文(韩)→ CJK 汉字(中，再分简/繁)→ 其余拉丁/欧洲语言(en)。
 * 已知局限：纯汉字、无假名的日文会被判为中文。
 */

const KANA = /[぀-ヿ]/; // 平假名 + 片假名
const HANGUL = /[가-힯ᄀ-ᇿ㄰-㆏]/;
const CJK = /[㐀-䶿一-鿿]/;

// 简体专属字（在繁体中写法不同）。出现得多 → 简体。
const SIMP = new Set(
  '国这来对时会说话东车门见爱长马儿点个们么还没过发后体关区医几万与书头龙风飞习乡写应业丽举义乐买卖红给经网难学节让认识语实现样种战边远连进开关闭电脑爱国'
);
// 繁体专属字（在简体中写法不同）。
const TRAD = new Set(
  '國這來對時會說話東車門見愛長馬兒點個們麼還沒過發後體關區醫幾萬與書頭龍風飛習鄉寫應業麗舉義樂買賣紅給經網難學節讓認識語實現樣種戰邊遠連進開閉電腦愛國'
);

/** 检测文本语言，返回字库目录名。 */
export function detectLang(text) {
  const s = String(text || '');
  if (KANA.test(s)) return 'ja';
  if (HANGUL.test(s)) return 'kr';
  if (CJK.test(s)) {
    let simp = 0;
    let trad = 0;
    for (const ch of s) {
      if (SIMP.has(ch)) simp++;
      else if (TRAD.has(ch)) trad++;
    }
    return trad > simp ? 'zh_TW' : 'zh_CN';
  }
  return 'en';
}
