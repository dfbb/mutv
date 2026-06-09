import {test} from 'node:test';
import assert from 'node:assert/strict';
import {detectLang} from './langDetect.mjs';

test('英文 / 欧洲语言 → en', () => {
  assert.equal(detectLang('Hello world, this is a song.'), 'en');
  assert.equal(detectLang('Voilà, déjà café résumé Straße'), 'en');
});

test('日文(含假名)→ ja，即使夹汉字', () => {
  assert.equal(detectLang('いろはにほへと'), 'ja');
  assert.equal(detectLang('こんにちは世界'), 'ja'); // 含汉字 世界，但有假名 → ja
  assert.equal(detectLang('アイウエオ カキクケコ'), 'ja'); // 片假名
});

test('韩文(谚文)→ kr', () => {
  assert.equal(detectLang('안녕하세요 반갑습니다'), 'kr');
});

test('简体中文 → zh_CN', () => {
  assert.equal(detectLang('北国风光，千里冰封，万里雪飘。'), 'zh_CN');
  assert.equal(detectLang('这是一首关于爱与梦想的歌'), 'zh_CN');
});

test('繁体中文 → zh_TW', () => {
  assert.equal(detectLang('北國風光，千里冰封，萬里雪飄。'), 'zh_TW');
  assert.equal(detectLang('這是一首關於愛與夢想的歌'), 'zh_TW');
});

test('空 / 无歌词 → en', () => {
  assert.equal(detectLang(''), 'en');
  assert.equal(detectLang(null), 'en');
  assert.equal(detectLang('123 456 !!!'), 'en');
});

test('假名优先于汉字(纯汉字日文回退中文是已知局限，但有假名必判 ja)', () => {
  assert.equal(detectLang('日本語の歌詞です'), 'ja'); // の/です 是假名
});
