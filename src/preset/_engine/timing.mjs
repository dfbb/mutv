/**
 * 歌词时间工具：行级时间戳 → 每行按字符数均分出逐字（"音节"）时间。
 * 等价于 example/lyrics-demo.html 的 lineInfo 构建逻辑。
 *
 * @typedef {import('./types').LineInfo} LineInfo
 * @typedef {import('../../types').LyricLine} LyricLine
 */

/**
 * @param {LyricLine[]} lyrics 行级歌词（start/end 为秒）
 * @param {number} offsetSec 歌词偏移（秒）
 * @returns {LineInfo[]}
 */
export function buildLineInfo(lyrics, offsetSec) {
  return lyrics.map((l) => {
    const start = (l.start + offsetSec) * 1000;
    const end = (l.end + offsetSec) * 1000;
    const chars = [...l.text];
    const dur = Math.max(end - start, 1);
    const charDur = dur / Math.max(chars.length, 1);
    const charTimes = chars.map((ch, k) => ({ch, start: start + k * charDur, dur: charDur}));
    return {start, end, dur, chars, charDur, charTimes};
  });
}

/**
 * 当前播放行索引；ms 小于首行 start 时返回 -1。
 * @param {LineInfo[]} info
 * @param {number} ms
 * @returns {number}
 */
export function currentLineIndex(info, ms) {
  let idx = -1;
  for (let i = 0; i < info.length; i++) {
    if (ms >= info[i].start) idx = i;
    else break;
  }
  return idx;
}
