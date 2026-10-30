import { getSettings } from './storageService';
import { text, STYLES, validateAiScenario, proxyUrl } from '../utils/validation';
let isInFlight = false;
async function baseUrl() {
  const settings = await getSettings();
  return proxyUrl(process.env.EXPO_PUBLIC_AI_PROXY_URL || settings.proxyUrl || '');
}
async function request(path, body) {
  const url = await baseUrl();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), body ? 95000 : 6000);
  try {
    const response = await fetch(`${url}${path}`, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, signal: controller.signal });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Máy chủ trả về lỗi ${response.status}.`);
    return data;
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('Máy chủ AI phản hồi quá lâu. Vui lòng thử lại.');
    if (err.name === 'TypeError') throw new Error('Không thể kết nối AI. Kiểm tra Internet; thư viện và cuộc gọi vẫn dùng được offline.');
    throw err;
  } finally { clearTimeout(timer); }
}
export async function checkServerHealth() {
  try {
    const data = await request('/api/health');
    return { online: true, hasKey: !!data.hasKey, model: data.model, message: data.hasKey ? 'Máy chủ đã cấu hình khóa. Hãy tạo nội dung để kiểm tra Gemini.' : 'Máy chủ chưa cấu hình khóa Gemini.' };
  } catch (err) { return { online: false, hasKey: false, message: err.message }; }
}
async function generate(path, body) {
  if (isInFlight) throw new Error('Đang xử lý yêu cầu AI. Vui lòng chờ.');
  isInFlight = true;
  try { return await request(path, body); } finally { isInFlight = false; }
}
export async function generateExitMessage(situation, style = 'Polite Refusal', recipient = '') {
  situation = text(situation, 'Tình huống', 1, 600);
  if (!STYLES.includes(style) || typeof recipient !== 'string' || recipient.length > 100) throw new Error('Phong cách hoặc người nhận không hợp lệ.');
  const data = await generate('/api/ai/message', { situation, style, recipient });
  return { ...data, text: text(data.text, 'Phản hồi AI', 1, 3000) };
}
export function scenarioFromResponse(raw, situationDescription) {
  const sc = validateAiScenario(raw);
  return { id: `sc_ai_${Date.now()}`, title: sc.scenarioTitle, description: situationDescription,
    category: sc.category, categoryTag: ({ 'Công sở': 'tagWork', 'Gia đình': 'tagFamily', 'Bạn bè': 'tagFriends', 'Hẹn hò / Tiệc tùng': 'tagParty' })[sc.category] || 'tagEmergency',
    callerName: sc.caller.name, callerRole: sc.caller.role, callerPhone: sc.caller.phoneNumber, callerAvatar: '',
    delaySeconds: sc.delaySeconds, ambientSound: sc.ambientSound, dialogue: sc.dialogue, suggestedMessage: sc.suggestedMessage,
    isFavorite: false, isPinned: false, isAiGenerated: true, createdAt: new Date().toISOString() };
}
export async function generateStructuredScenario(situationDescription, preferredCategory = '') {
  situationDescription = text(situationDescription, 'Tình huống', 8, 800);
  const data = await generate('/api/ai/scenario', { situationDescription, preferredCategory });
  return { success: true, scenario: scenarioFromResponse(data.scenario, situationDescription) };
}
