import { getSettings } from './storageService.js';
import { text, STYLES, validateAiScenario, proxyUrl } from '../utils/validation.js';
let isInFlight = false;
async function baseUrl() {
  const settings = await getSettings();
  return proxyUrl(process.env.EXPO_PUBLIC_AI_PROXY_URL || settings.proxyUrl || '');
}
async function request(path, body, customTimeout = null) {
  const url = await baseUrl();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), customTimeout || (body ? 95000 : 6000));
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

export async function generateCallerDialogue({ callerName, callerRole, scenarioTitle, category, context = '' }) {
  try {
    const data = await generate('/api/ai/dialogue', {
      callerName: text(callerName || 'Người gọi', 'Tên người gọi', 1, 100),
      callerRole: typeof callerRole === 'string' ? callerRole.slice(0, 100) : '',
      scenarioTitle: typeof scenarioTitle === 'string' ? scenarioTitle.slice(0, 150) : '',
      category: typeof category === 'string' ? category.slice(0, 50) : '',
      context: typeof context === 'string' ? context.slice(0, 200) : '',
    });
    if (data && Array.isArray(data.dialogue) && data.dialogue.length > 0) {
      return { success: true, dialogue: data.dialogue, isAiGenerated: true, model: data.model };
    }
  } catch (err) {
    // Fallback attempt via /api/ai/scenario if /api/ai/dialogue returns 404 on older proxy instances
    try {
      const description = `Cuộc gọi từ ${callerName || 'Người gọi'} (${callerRole || 'Gấp'}): ${scenarioTitle || 'Cần hỗ trợ gấp'}`;
      const scData = await generate('/api/ai/scenario', {
        situationDescription: description,
        preferredCategory: ['Công sở', 'Gia đình', 'Bạn bè', 'Hẹn hò / Tiệc tùng', 'Khẩn cấp'].includes(category) ? category : '',
      });
      if (scData?.scenario?.dialogue && scData.scenario.dialogue.length > 0) {
        return { success: true, dialogue: scData.scenario.dialogue, isAiGenerated: true, model: scData.scenario.model };
      }
    } catch (_) {}
    throw err;
  }
}

export async function generateCallReply({
  callerName,
  callerRole,
  scenarioTitle,
  category,
  userUtterance,
  conversationHistory = [],
  voiceName = 'auto',
  gender = 'auto',
}) {
  const sanitizedUtterance = text(userUtterance || '', 'Lời thoại người dùng', 1, 300);
  const data = await request(
    '/api/ai/call-reply',
    {
      callerName: text(callerName || 'Người gọi', 'Tên người gọi', 1, 100),
      callerRole: typeof callerRole === 'string' ? callerRole.slice(0, 100) : '',
      scenarioTitle: typeof scenarioTitle === 'string' ? scenarioTitle.slice(0, 150) : '',
      category: typeof category === 'string' ? category.slice(0, 50) : '',
      userUtterance: sanitizedUtterance,
      conversationHistory: Array.isArray(conversationHistory) ? conversationHistory.slice(-6) : [],
      voiceName,
      gender,
    },
    14000
  );
  if (data && data.reply) {
    return {
      success: true,
      reply: data.reply,
      audioBase64: data.audioBase64 || null,
      audioMimeType: data.audioMimeType || null,
      voice: data.voice || voiceName,
      model: data.model,
    };
  }
  throw new Error('AI không trả về câu phản hồi hợp lệ.');
}

export async function generateTtsAudio({
  text: ttsText,
  voiceName = 'Kore',
  callerRole = '',
  callerName = '',
  gender = 'auto',
  isPreview = false,
}) {
  const sanitizedText = text(ttsText || '', 'Văn bản đọc', 1, 500);
  const data = await request(
    '/api/ai/tts',
    {
      text: sanitizedText,
      voiceName,
      callerRole,
      callerName,
      gender,
      isPreview,
    },
    15000
  );
  if (data && data.audioBase64) {
    return {
      success: true,
      audioBase64: data.audioBase64,
      audioMimeType: data.audioMimeType || 'audio/wav',
      voice: data.voice || voiceName,
      cached: !!data.cached,
    };
  }
  throw new Error(data?.error || 'Không thể tạo âm thanh giọng nói.');
}
