const AMBIENTS = ['none', 'office', 'cafe', 'street', 'hospital'];
const STYLES = ['Professional', 'Friendly', 'Funny', 'Short & Direct', 'Polite Refusal'];
const CATEGORIES = ['Công sở', 'Gia đình', 'Bạn bè', 'Hẹn hò / Tiệc tùng', 'Khẩn cấp', 'Cá nhân'];
function text(value, label, min = 1, max = 200) {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) throw new Error(`${label}: cần từ ${min} đến ${max} ký tự.`);
  return value.trim();
}
function phone(value) {
  const result = text(value, 'Số điện thoại', 8, 24);
  if (!/^\+?[0-9 () .-]+$/.test(result) || result.replace(/\D/g, '').length < 8) throw new Error('Số điện thoại không hợp lệ.');
  return result;
}
function delay(value) {
  if (value === '' || value === null || typeof value === 'boolean' || !Number.isInteger(Number(value)) || Number(value) < 0 || Number(value) > 86400) throw new Error('Hẹn giờ phải là số nguyên từ 0 đến 86400 giây.');
  return Number(value);
}
function dialogue(value) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 20) throw new Error('Kịch bản cần từ 1 đến 20 câu thoại.');
  return value.map(line => text(line, 'Câu thoại', 1, 500));
}
function validateAiScenario(sc) {
  if (!sc || typeof sc !== 'object') throw new Error('Kịch bản AI không hợp lệ.');
  if (!AMBIENTS.includes(sc.ambientSound) || !CATEGORIES.includes(sc.category)) throw new Error('AI trả về thể loại hoặc âm nền không hợp lệ.');
  return { ...sc, scenarioTitle: text(sc.scenarioTitle, 'Tiêu đề', 1, 120),
    caller: { name: text(sc.caller?.name, 'Người gọi', 1, 80), role: text(sc.caller?.role, 'Vai trò', 1, 80), phoneNumber: phone(sc.caller?.phoneNumber), avatarUrl: '' },
    delaySeconds: delay(sc.delaySeconds), dialogue: dialogue(sc.dialogue), suggestedMessage: text(sc.suggestedMessage, 'Tin nhắn', 1, 1500) };
}
function proxyUrl(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error('Vui lòng nhập URL máy chủ HTTPS hợp lệ.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || /^(localhost|127\.|10\.|192\.168\.|\[::1\])/.test(url.hostname)) throw new Error('Máy chủ phải dùng HTTPS công khai, không chứa khóa hoặc mật khẩu.');
  return value.trim().replace(/\/+$/, '');
}
module.exports = { AMBIENTS, STYLES, CATEGORIES, text, phone, delay, dialogue, validateAiScenario, proxyUrl };
