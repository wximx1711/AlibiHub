const { test } = require('node:test');
const assert = require('node:assert/strict');
const { resolveVoiceName, generateGeminiTts } = require('../server/geminiProxy');
const server = require('../server/index');

test('resolveVoiceName maps caller roles to correct Gemini prebuilt voices', () => {
  assert.equal(resolveVoiceName('auto', 'Mẹ ruột', 'Mẹ Yêu'), 'Kore');
  assert.equal(resolveVoiceName('auto', 'Bố', 'Bố'), 'Charon');
  assert.equal(resolveVoiceName('auto', 'Sếp / Giám đốc', 'Sếp Hoàng'), 'Fenrir');
  assert.equal(resolveVoiceName('auto', 'Bạn thân', 'Tuấn Anh'), 'Puck');
  assert.equal(resolveVoiceName('auto', 'Shipper giao hàng', 'Shipper'), 'Aoede');

  // Manual selection overrides role
  assert.equal(resolveVoiceName('fenrir', 'Gia đình', 'Mẹ'), 'Fenrir');
  assert.equal(resolveVoiceName('charon', 'Bạn bè', 'Linh'), 'Charon');
});

test('generateGeminiTts serves pre-cached high-quality audio for preview and role greetings with zero latency', async () => {
  for (const voice of ['Kore', 'Charon', 'Fenrir', 'Puck', 'Aoede']) {
    const res = await generateGeminiTts('', {
      text: 'preview',
      voiceName: voice,
      isPreview: true,
    });
    assert.equal(res.success, true);
    assert.equal(res.cached, true);
    assert.equal(res.voice, voice);
    assert.equal(res.audioMimeType, 'audio/wav');
    assert.ok(typeof res.audioBase64 === 'string' && res.audioBase64.length > 1000);

    // Verify WAV RIFF header in base64
    const buf = Buffer.from(res.audioBase64, 'base64');
    assert.equal(buf.subarray(0, 4).toString(), 'RIFF');
    assert.equal(buf.subarray(8, 12).toString(), 'WAVE');
  }
});

test('HTTP server /api/ai/tts endpoint generates and returns playable WAV audio', async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    const res = await fetch(`${base}/api/ai/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Con à, mẹ đang đợi cơm con ở nhà này, về sớm đi nhé!',
        voiceName: 'Kore',
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.audioMimeType, 'audio/wav');
    assert.ok(typeof data.audioBase64 === 'string' && data.audioBase64.length > 1000);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
