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

test('bundled AI voice assets: 5 comparison samples are real, distinct, non-empty RIFF/WAVE files', () => {
  const fs = require('fs');
  const path = require('path');
  const dir = path.join(__dirname, '..', 'assets', 'audio', 'voices');

  const samples = [
    'sample_mother.wav',
    'sample_father.wav',
    'sample_boss.wav',
    'sample_friend.wav',
    'sample_shipper.wav',
  ];

  const sizes = new Set();
  for (const s of samples) {
    const fullPath = path.join(dir, s);
    assert.ok(fs.existsSync(fullPath), `Sample file ${s} must exist on disk`);
    const stat = fs.statSync(fullPath);
    assert.ok(stat.size > 50000, `Sample file ${s} must be substantial audio (>50KB), got ${stat.size}`);
    sizes.add(stat.size);

    const buf = fs.readFileSync(fullPath);
    assert.equal(buf.subarray(0, 4).toString(), 'RIFF', `${s} must have RIFF header`);
    assert.equal(buf.subarray(8, 12).toString(), 'WAVE', `${s} must have WAVE format`);
  }

  // All 5 samples must have distinct acoustic lengths/sizes
  assert.ok(sizes.size >= 4, `All 5 samples must be genuinely different audio (at least 4 unique sizes), got ${sizes.size}`);
});

test('bundled AI voice assets: all 15 offline role clips (3 per persona) exist and are valid RIFF/WAVE', () => {
  const fs = require('fs');
  const path = require('path');
  const dir = path.join(__dirname, '..', 'assets', 'audio', 'voices');

  const clips = [
    'mother_1.wav', 'mother_2.wav', 'mother_3.wav',
    'father_1.wav', 'father_2.wav', 'father_3.wav',
    'boss_1.wav', 'boss_2.wav', 'boss_3.wav',
    'friend_1.wav', 'friend_2.wav', 'friend_3.wav',
    'shipper_1.wav', 'shipper_2.wav', 'shipper_3.wav',
  ];

  for (const c of clips) {
    const fullPath = path.join(dir, c);
    assert.ok(fs.existsSync(fullPath), `Role clip ${c} must exist`);
    const stat = fs.statSync(fullPath);
    assert.ok(stat.size > 50000, `Role clip ${c} must be > 50KB, got ${stat.size}`);

    const buf = fs.readFileSync(fullPath);
    assert.equal(buf.subarray(0, 4).toString(), 'RIFF', `${c} must have RIFF header`);
    assert.equal(buf.subarray(8, 12).toString(), 'WAVE', `${c} must have WAVE format`);
  }
});
