import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {
  parseApiKeys, langToLocale, orientationOf, aspectOk, meetsMinRes,
  pickPhotoCropUrl, pickVideoFile, pickLeastUsed, parseKeywords,
  shard, photoCachePath, videoCachePath, buildConcatArgs,
  renderCreditsMd, renderCreditsLine, isLastSecond, openCacheDb,
  generateKeywords, preparePexelsBackground,
} from './pexelsBg.mjs';

test('parseApiKeys: 多行/含等号值/缺键', () => {
  const k = parseApiKeys('pexels=abc\nopenrouter=sk-or-v1=x\n# c\n\n');
  assert.equal(k.pexels, 'abc');
  assert.equal(k.openrouter, 'sk-or-v1=x'); // 值里可含 =
  assert.equal(parseApiKeys('pexels=a').openrouter, undefined);
});

test('langToLocale: 5 种映射 + 回退', () => {
  assert.equal(langToLocale('en'), 'en-US');
  assert.equal(langToLocale('zh_CN'), 'zh-CN');
  assert.equal(langToLocale('zh_TW'), 'zh-TW');
  assert.equal(langToLocale('kr'), 'ko-KR');
  assert.equal(langToLocale('ja'), 'ja-JP');
  assert.equal(langToLocale('xx'), 'en-US');
});

test('orientationOf', () => {
  assert.equal(orientationOf(1280, 720), 'landscape');
  assert.equal(orientationOf(720, 1280), 'portrait');
  assert.equal(orientationOf(500, 500), 'square');
});

test('aspectOk: 比值容差，横竖屏对称', () => {
  assert.ok(aspectOk(6000, 4000, 1280, 720, 1.25));   // 3:2 vs 16:9 → 1.185 过
  assert.ok(!aspectOk(3840, 1600, 1280, 720, 1.25));  // 2.4 vs 1.78 → 1.35 拒
  assert.ok(aspectOk(2000, 3000, 720, 1280, 1.25));   // 竖 2:3 vs 9:16 对称通过
});

test('meetsMinRes: 边界', () => {
  assert.ok(meetsMinRes(1280, 720, 1280, 720));
  assert.ok(!meetsMinRes(1279, 720, 1280, 720));
  assert.ok(!meetsMinRes(1280, 719, 1280, 720));
});

test('pickPhotoCropUrl: 拼 fit=crop', () => {
  const u = pickPhotoCropUrl('https://images.pexels.com/photos/1/a.jpeg', 1280, 720);
  assert.ok(u.includes('w=1280') && u.includes('h=720') && u.includes('fit=crop') && u.includes('dpr=1'));
});

test('pickVideoFile: 合法档筛选与选择', () => {
  const files = [
    {id: 1, width: 640, height: 360, link: 'a-640.mp4', file_type: 'video/mp4'},
    {id: 2, width: 1280, height: 720, link: 'a-1280.mp4', file_type: 'video/mp4'},
    {id: 3, width: 3840, height: 2160, link: 'a-4k.mp4', file_type: 'video/mp4'},
    {id: 4, width: null, height: null, link: 'a.m3u8', file_type: 'video/mp4'}, // HLS 标错 type
  ];
  assert.equal(pickVideoFile(files, 1280, 720).id, 2);     // ≥目标且面积最接近
  assert.equal(pickVideoFile([files[0]], 1280, 720).id, 1); // 无≥目标取最大合法
  assert.equal(pickVideoFile([files[3]], 1280, 720), null); // 全非法 null
  assert.equal(pickVideoFile([{id: 5, width: 1280, height: 720, link: 'x.m3u8'}], 1280, 720), null);
});

test('pickLeastUsed: count 升序、排除已用、稳定', () => {
  const cands = [{id: 10}, {id: 20}, {id: 30}];
  const counts = new Map([[10, 2], [20, 0], [30, 0]]);
  assert.equal(pickLeastUsed(cands, counts, new Set()).id, 20);          // 同 0 保持顺序
  assert.equal(pickLeastUsed(cands, counts, new Set([20])).id, 30);      // 排除已用
  assert.equal(pickLeastUsed(cands, counts, new Set([20, 30])).id, 10);
  assert.equal(pickLeastUsed(cands, counts, new Set([10, 20, 30])), null);
});

test('parseKeywords: 去序号/空行/去重/slice 40', () => {
  const kws = parseKeywords('1. Ocean\n- ocean\n\n* waves\nWAVES\n' + Array.from({length: 50}, (_, i) => `k${i}`).join('\n'));
  assert.equal(kws[0], 'ocean');
  assert.equal(kws[1], 'waves');
  assert.equal(new Set(kws).size, kws.length);
  assert.equal(kws.length, 40);
});

test('parseKeywords: 跳过 # 注释/章节标题行', () => {
  assert.ok(!parseKeywords('# Mood:\nocean\n# Scene:\nbeach').includes('mood:'));
  assert.ok(!parseKeywords('# Mood:\nocean\n# Scene:\nbeach').includes('scene:'));
  assert.deepEqual(parseKeywords('# Mood:\nocean\n# Scene:\nbeach'), ['ocean', 'beach']);
});

test('shard 与缓存路径', () => {
  assert.equal(shard(7), '0/7');
  assert.equal(shard(7762128), '2/8');
  assert.ok(photoCachePath('/c', 7762128, 1280, 720).endsWith('/c/pexels/photos/2/8/7762128-1280x720-crop.jpg'));
  assert.ok(videoCachePath('/c', 19955848, 123).endsWith('/c/pexels/videos/4/8/19955848-123.mp4'));
});

test('buildConcatArgs: filter_complex/-t/-an/近无损', () => {
  const args = buildConcatArgs(['/a.mp4', '/b.mp4'], 1280, 720, 24, 30.5, '/out.mp4');
  const s = args.join(' ');
  assert.ok(s.includes('-i /a.mp4') && s.includes('-i /b.mp4'));
  assert.ok(s.includes('concat=n=2:v=1:a=0'));
  assert.ok(s.includes('scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,setsar=1,fps=24'));
  assert.ok(s.includes('-t 30.5') && s.includes('-an'));
  assert.ok(s.includes('-crf 16') && s.includes('-preset veryfast') && s.includes('yuv420p'));
  assert.equal(args[args.length - 1], '/out.mp4');
});

test('renderCreditsMd / renderCreditsLine', () => {
  const credits = [
    {type: 'photo', id: 1, author: 'Jane', authorUrl: 'https://p/jane', pexelsUrl: 'https://pexels.com/photo/1'},
    {type: 'video', id: 2, author: 'Jane', authorUrl: 'https://p/jane', pexelsUrl: 'https://pexels.com/video/2'},
    {type: 'photo', id: 3, author: 'Bob', authorUrl: 'https://p/bob', pexelsUrl: 'https://pexels.com/photo/3'},
  ];
  const md = renderCreditsMd(credits);
  assert.ok(md.includes('https://www.pexels.com'));
  assert.ok(md.includes('Jane') && md.includes('https://pexels.com/photo/1'));
  const line = renderCreditsLine(credits);
  assert.ok(line.includes('Pexels.com'));
  assert.ok(line.includes('Jane') && line.includes('Bob'));
  assert.equal((line.match(/Jane/g) || []).length, 1); // 作者去重
  const many = Array.from({length: 10}, (_, i) => ({type: 'photo', id: i, author: `A${i}`, authorUrl: '', pexelsUrl: ''}));
  assert.ok(renderCreditsLine(many).includes('...')); // 过多截断
});

test('isLastSecond: 最后 1 秒边界', () => {
  assert.ok(!isLastSecond(100 - 24 - 1, 100, 24));
  assert.ok(isLastSecond(100 - 24, 100, 24));
  assert.ok(isLastSecond(99, 100, 24));
});

test('openCacheDb: usage 计数与 attribution 往返', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pexdb-'));
  try {
    const db = openCacheDb(dir);
    assert.deepEqual(db.getCounts('photo', [1, 2]), new Map([[1, 0], [2, 0]])); // 缺失=0
    db.bumpUsage('photo', 1);
    db.bumpUsage('photo', 1);
    assert.equal(db.getCounts('photo', [1]).get(1), 2);
    assert.equal(db.getCounts('video', [1]).get(1), 0); // type 隔离
    db.putAttribution({type: 'photo', id: 1, author: 'J', authorUrl: 'u', pexelsUrl: 'p'});
    assert.deepEqual(db.getAttribution('photo', 1), {type: 'photo', id: 1, author: 'J', authorUrl: 'u', pexelsUrl: 'p'});
    db.close();
  } finally { rmSync(dir, {recursive: true, force: true}); }
});

test('generateKeywords: 正常返回解析为关键词', async () => {
  const fakeFetch = async () => ({
    ok: true, status: 200,
    json: async () => ({choices: [{message: {content: 'ocean\nwaves\nocean'}}]}),
  });
  const kws = await generateKeywords({lyricsText: '词', apiKey: 'k', fetchImpl: fakeFetch});
  assert.deepEqual(kws, ['ocean', 'waves']);
});

test('generateKeywords: 402 抛余额错误', async () => {
  const fakeFetch = async () => ({ok: false, status: 402, text: async () => 'no credit'});
  await assert.rejects(() => generateKeywords({lyricsText: 'x', apiKey: 'k', fetchImpl: fakeFetch}),
    /余额不足|欠费/);
});

test('generateKeywords: 空关键词抛错', async () => {
  const fakeFetch = async () => ({ok: true, status: 200, json: async () => ({choices: [{message: {content: ''}}]})});
  await assert.rejects(() => generateKeywords({lyricsText: 'x', apiKey: 'k', fetchImpl: fakeFetch}));
});

test('generateKeywords: 429 抛速率限制错误', async () => {
  const fakeFetch = async () => ({ok: false, status: 429, text: async () => 'rate limit'});
  await assert.rejects(() => generateKeywords({lyricsText: 'x', apiKey: 'k', fetchImpl: fakeFetch}),
    /速率限制/);
});

test('generateKeywords: 401 抛鉴权失败错误', async () => {
  const fakeFetch = async () => ({ok: false, status: 401, text: async () => 'unauthorized'});
  await assert.rejects(() => generateKeywords({lyricsText: 'x', apiKey: 'k', fetchImpl: fakeFetch}),
    /鉴权失败/);
});

function fakePhoto(id, w = 6000, h = 4000) {
  return {id, width: w, height: h, url: `https://pexels.com/photo/${id}`,
    photographer: `P${id}`, photographer_url: `https://p/${id}`,
    src: {original: `https://images.pexels.com/photos/${id}/x.jpeg`}};
}
function fakeVideo(id, dur = 20) {
  return {id, width: 1920, height: 1080, duration: dur, url: `https://pexels.com/video/${id}`,
    user: {name: `U${id}`, url: `https://u/${id}`},
    video_files: [{id: id * 10, width: 1280, height: 720, link: `https://v/${id}.mp4`, file_type: 'video/mp4'}]};
}
function mkDirs() {
  const root = mkdtempSync(join(tmpdir(), 'pexbg-'));
  const publicDir = join(root, 'public'), cacheDir = join(root, 'cache');
  mkdirSync(publicDir, {recursive: true});
  return {root, publicDir, cacheDir};
}
const fakeDownload = async () => Buffer.from('fakemedia');
const baseOpts = (o) => ({
  lyricsText: '词', durationSec: 12, width: 1280, height: 720, fps: 24,
  locale: 'zh-CN', intvl: 5,
  apiKeys: {pexels: 'pk', openrouter: 'ok'},
  fetchImpl: async () => ({ok: true, status: 200, json: async () => ({choices: [{message: {content: 'ocean\nwaves\nsky'}}]})}),
  downloadImpl: fakeDownload,
  ...o,
});

test('preparePexelsBackground image: 返回 imageUrls+credits，写 cache 与 public', async () => {
  const {root, publicDir, cacheDir} = mkDirs();
  let nextId = 100;
  const pexelsClient = {
    photos: {search: async () => ({photos: [fakePhoto(nextId++), fakePhoto(nextId++), fakePhoto(nextId++)]})},
    videos: {search: async () => ({videos: []})},
  };
  try {
    const r = await preparePexelsBackground(baseOpts({kind: 'image', publicDir, cacheDir, pexelsClient}));
    assert.equal(r.imageUrls.length, Math.ceil(12 / 5)); // 3 slots
    assert.equal(r.credits.length, 3);
    assert.ok(existsSync(join(publicDir, r.imageUrls[0])));
    assert.ok(existsSync(photoCachePath(cacheDir, 100, 1280, 720)));
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test('preparePexelsBackground video: ffmpeg 拼接返回单 videoFile', async () => {
  const {root, publicDir, cacheDir} = mkDirs();
  let nextId = 200;
  const pexelsClient = {
    photos: {search: async () => ({photos: []})},
    videos: {search: async () => ({videos: [fakeVideo(nextId++, 20)]})},
  };
  const execCalls = [];
  const execImpl = (cmd, args) => { execCalls.push(args); writeFileSync(args[args.length - 1], 'mp4'); return {status: 0}; };
  try {
    const r = await preparePexelsBackground(baseOpts({kind: 'video', durationSec: 30, publicDir, cacheDir, pexelsClient, execImpl}));
    assert.equal(r.videoFile, 'pexvid-concat.mp4');
    assert.ok(existsSync(join(publicDir, 'pexvid-concat.mp4')));
    assert.ok(r.credits.length >= 1);
    assert.ok(execCalls[0].join(' ').includes('concat'));
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test('preparePexelsBackground: 全部搜索空 → 抛错', async () => {
  const {root, publicDir, cacheDir} = mkDirs();
  const pexelsClient = {photos: {search: async () => ({photos: []})}, videos: {search: async () => ({videos: []})}};
  try {
    await assert.rejects(() => preparePexelsBackground(baseOpts({kind: 'image', publicDir, cacheDir, pexelsClient})));
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test('preparePexelsBackground video: 时长不足循环填满', async () => {
  const {root, publicDir, cacheDir} = mkDirs();
  let searchCount = 0;
  const pexelsClient = {
    photos: {search: async () => ({photos: []})},
    videos: {search: async () => {
      searchCount++;
      return searchCount === 1 ? {videos: [fakeVideo(300, 5)]} : {videos: []};
    }},
  };
  const inputCounts = [];
  const execImpl = (cmd, args) => {
    inputCounts.push(args.filter((a) => a === '-i').length);
    writeFileSync(args[args.length - 1], 'mp4'); return {status: 0};
  };
  try {
    await preparePexelsBackground(baseOpts({kind: 'video', publicDir, cacheDir, pexelsClient, execImpl}));
    assert.ok(inputCounts[0] >= 3); // 5s clip × 3 = 15s ≥ 12s
  } finally { rmSync(root, {recursive: true, force: true}); }
});
