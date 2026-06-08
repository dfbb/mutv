import {test} from 'node:test';
import assert from 'node:assert/strict';
import {renderShellHtml, buildManifestEntries} from './gen_winamp.mjs';

test('renderShellHtml: 含 PRESET key、引用 vendor 壳', () => {
  const html = renderShellHtml('$$$ Royal - Mashup (197)');
  assert.ok(html.includes('../vendor/butterchurn.min.js'));
  assert.ok(html.includes('../vendor/butterchurnPresets.min.js'));
  assert.ok(html.includes('../vendor/bc-player.js'));
  assert.ok(html.includes('<canvas id="bc"'));
  assert.ok(html.includes(JSON.stringify('$$$ Royal - Mashup (197)')));
});

test('renderShellHtml: 含 </script> 的 key 不破坏壳', () => {
  const html = renderShellHtml('evil</script>x');
  // < 被转义为 \\u003c,不会出现裸的 </script>x 提前闭合
  assert.ok(html.includes('\\u003c/script>x') || !html.includes('evil</script>x'));
});

test('buildManifestEntries: 每条 category=WINAMP tech=webgl', () => {
  const map = {'royal-mashup': '$$$ Royal - Mashup (197)', 'aderrasi-wanderer': '_Aderrasi - Wanderer'};
  const entries = buildManifestEntries(map);
  assert.equal(entries.length, 2);
  for (const e of entries) {
    assert.equal(e.category, 'WINAMP');
    assert.equal(e.tech, 'webgl');
    assert.ok(e.label && e.name && e.presetKey);
  }
  const byLabel = Object.fromEntries(entries.map((e) => [e.label, e]));
  assert.equal(byLabel['royal-mashup'].presetKey, '$$$ Royal - Mashup (197)');
});
