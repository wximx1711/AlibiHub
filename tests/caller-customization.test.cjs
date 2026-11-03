const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  detectCallerPersona,
  getGeminiVoiceForCaller,
  VOICE_PROFILES,
} = require('../src/services/dialogueService.js');
const { avatar } = require('../src/utils/validation.js');

test('avatar validator supports https, http, data URI, file, and content URIs', () => {
  assert.equal(avatar('https://example.com/avatar.jpg'), 'https://example.com/avatar.jpg');
  assert.equal(avatar('http://example.com/avatar.jpg'), 'http://example.com/avatar.jpg');
  assert.equal(avatar('data:image/jpeg;base64,/9j/4AAQSkZJRg=='), 'data:image/jpeg;base64,/9j/4AAQSkZJRg==');
  assert.equal(avatar('file:///var/mobile/Containers/Data/avatar.jpg'), 'file:///var/mobile/Containers/Data/avatar.jpg');
  assert.equal(avatar('content://media/external/images/media/1234'), 'content://media/external/images/media/1234');
  assert.equal(avatar(''), '');
  assert.equal(avatar(null), '');
  assert.equal(avatar(undefined), '');

  assert.throws(() => avatar('invalid-uri-without-scheme'), /Ảnh đại diện không hợp lệ/);
  assert.throws(() => avatar('javascript:alert(1)'), /Ảnh đại diện không hợp lệ/);
});

test('detectCallerPersona accurately separates NEIGHBOR (Chú Hùng) from FAMILY_DAD', () => {
  assert.equal(detectCallerPersona({ name: 'Chú Hùng', role: 'Tổ dân phố / Hàng xóm' }), 'NEIGHBOR');
  assert.equal(detectCallerPersona({ name: 'Bác Nam', role: 'Khu phố / Trưởng ban quản trị' }), 'NEIGHBOR');
  assert.equal(detectCallerPersona({ name: 'Hàng xóm', role: 'Sự cố vỡ ống nước' }), 'NEIGHBOR');
  assert.equal(detectCallerPersona('Chú Hùng'), 'NEIGHBOR');

  // Father persona is preserved for explicit father roles/names
  assert.equal(detectCallerPersona({ name: 'Bố', role: 'Gia đình' }), 'FAMILY_DAD');
  assert.equal(detectCallerPersona({ name: 'Ba yêu', role: 'Gia đình' }), 'FAMILY_DAD');
  assert.equal(detectCallerPersona({ name: 'Bố Nam', role: 'Việc nhà' }), 'FAMILY_DAD');
});

test('getGeminiVoiceForCaller assigns natural female voice Aoede to Bạn thân Linh', () => {
  const linhCaller = {
    name: 'Bạn thân Linh',
    role: 'Bạn bè',
    gender: 'female',
    voiceId: 'aoede',
  };
  const voice = getGeminiVoiceForCaller(linhCaller, 'Cà phê', 'Bạn bè');
  assert.equal(voice.geminiVoice, 'Aoede');

  // Even without explicit voiceId, female friend maps to Aoede, NOT male Puck
  const femaleFriend = {
    name: 'Linh',
    role: 'Bạn bè',
    gender: 'female',
  };
  const voice2 = getGeminiVoiceForCaller(femaleFriend, 'Tán gẫu', 'Bạn bè');
  assert.equal(voice2.geminiVoice, 'Aoede');
});

test('getGeminiVoiceForCaller assigns Charon and neighbor persona to Chú Hùng', () => {
  const chuHungCaller = {
    name: 'Chú Hùng',
    role: 'Tổ dân phố / Hàng xóm',
    gender: 'male',
    voiceId: 'charon',
    persona: 'NEIGHBOR',
  };
  const voice = getGeminiVoiceForCaller(chuHungCaller, 'Sự cố khu phố', chuHungCaller.role);
  assert.equal(voice.geminiVoice, 'Charon');
  assert.equal(detectCallerPersona(chuHungCaller), 'NEIGHBOR');
});

test('getGeminiVoiceForCaller preserves Mother (Kore), Boss (Fenrir), and Shipper (Aoede)', () => {
  const mom = { name: 'Mẹ Yêu', role: 'Gia đình', gender: 'female', voiceId: 'kore' };
  assert.equal(getGeminiVoiceForCaller(mom, 'Cơm tối', mom.role).geminiVoice, 'Kore');

  const boss = { name: 'Sếp Hoàng', role: 'Công sở', gender: 'male', voiceId: 'fenrir' };
  assert.equal(getGeminiVoiceForCaller(boss, 'Họp gấp', boss.role).geminiVoice, 'Fenrir');

  const shipper = { name: 'Shipper Giao Hàng', role: 'Bưu phẩm', gender: 'female', voiceId: 'aoede' };
  assert.equal(getGeminiVoiceForCaller(shipper, 'Giao hàng', shipper.role).geminiVoice, 'Aoede');
});
