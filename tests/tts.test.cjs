const { test } = require('node:test');
const assert = require('node:assert/strict');
const { resolveVoiceName, generateGeminiTts, pcmToWav } = require('../server/geminiProxy');

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

test('pcmToWav creates valid RIFF WAVE headers from raw PCM data', () => {
  const dummyPcm = Buffer.alloc(4800, 0); // 100ms at 24kHz 16-bit
  const wav = pcmToWav(dummyPcm, 24000, 1, 16);
  assert.equal(wav.length, 44 + 4800);
  assert.equal(wav.subarray(0, 4).toString(), 'RIFF');
  assert.equal(wav.subarray(8, 12).toString(), 'WAVE');
  assert.equal(wav.subarray(12, 16).toString(), 'fmt ');
  assert.equal(wav.readUInt32LE(24), 24000); // sampleRate
  assert.equal(wav.readUInt16LE(22), 1); // numChannels
  assert.equal(wav.subarray(36, 40).toString(), 'data');
  assert.equal(wav.readUInt32LE(40), 4800); // dataSize
});
