/**
 * AlibiHub - Gemini API Integration Proxy Core
 * Securely handles calls to Gemini models with structured JSON output,
 * timeout protection, safety guardrails, and Vietnamese error formatting.
 */

const { validateAiScenario, text, STYLES, CATEGORIES } = require('../src/utils/validation');
const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
const FALLBACK_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
];

const SYSTEM_GUARDRAIL = `
Bạn là AlibiHub AI - Trợ lý thông minh hỗ trợ người dùng xử lý các tình huống xã hội khó xử, rời cuộc gặp một cách lịch sự, tế nhị và bảo vệ ranh giới cá nhân (Personal Boundaries).
NGUYÊN TẮC ĐẠO ĐỨC BẮT BUỘC (SAFETY GUARDRAILS):
1. KHÔNG BAO GIỜ tạo tài liệu pháp lý giả mạo, giấy tờ cơ quan nhà nước, lệnh bắt giữ, giấy triệu tập công an hoặc chứng cứ gian lận vi phạm pháp luật.
2. KHÔNG giả mạo danh tính cá nhân cụ thể ngoài đời thực để bôi nhọ hoặc lừa đảo tài chính.
3. Luôn hướng đến các lý do đời sống thường nhật hợp lý, tôn trọng người khác: việc gia đình đột xuất, việc công ty gấp ngoài giờ, shipper giao hàng, xe cộ sự cố, chăm sóc sức khỏe.
4. Mọi nội dung xuất ra bằng TIẾNG VIỆT tự nhiên, chân thực, văn phong phù hợp với ngữ cảnh Việt Nam.
`;

/**
 * Call Gemini API with automatic fallback models
 */
async function callGemini(apiKey, payload, model = PRIMARY_MODEL) {
  if (!apiKey || !apiKey.trim()) {
    const error = new Error('GEMINI_API_KEY chưa được cấu hình. Vui lòng cung cấp Gemini API Key hợp lệ.');
    error.code = 'MISSING_API_KEY';
    throw error;
  }

  const modelsToTry = [model, ...FALLBACK_MODELS.filter((m) => m !== model)];
  let lastError = null;

  for (const currentModel of modelsToTry) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey.trim() },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const data = await response.json();
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorMsg = data?.error?.message || `Lỗi HTTP ${response.status}`;
        const errorStatus = response.status;
        console.warn(`[Gemini Proxy] Upstream HTTP ${errorStatus}`);

        if (errorStatus === 429 || errorStatus === 503) {
          console.warn(`[Gemini Proxy] Model ${currentModel} returned HTTP ${errorStatus}, trying next fallback model...`);
          lastError = new Error(
            errorStatus === 429
              ? 'Hạn ngạch API Gemini đã tạm thời hết lượt (Quota exceeded / Rate limit). Vui lòng thử lại sau ít phút.'
              : `Mô hình ${currentModel} đang bận (HTTP 503). Đang thử mô hình dự phòng...`
          );
          if (errorStatus === 429) lastError.code = 'RATE_LIMIT';
          continue; // Try next fallback model
        }

        if (errorStatus === 401 || errorStatus === 403 || (errorStatus === 400 && /key/i.test(errorMsg))) {
          const authErr = new Error('Gemini API Key không hợp lệ. Vui lòng kiểm tra lại cấu hình.');
          authErr.code = 'INVALID_API_KEY';
          throw authErr;
        }

        lastError = new Error(`Gemini trả về HTTP ${errorStatus}. Vui lòng kiểm tra cấu hình máy chủ.`);
        continue; // Try next fallback model
      }

      const candidate = data?.candidates?.[0];
      if (candidate?.finishReason && candidate.finishReason !== 'STOP') throw new Error('Gemini chưa hoàn tất nội dung hoặc đã chặn yêu cầu. Vui lòng thử mô tả khác.');
      const text = candidate?.content?.parts?.filter(p => !p.thought).map(p => p.text || '').join('');
      if (!text) {
        throw new Error('Gemini không trả về nội dung phù hợp.');
      }

      return {
        text: text.trim(),
        model: currentModel,
      };
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        lastError = new Error('Yêu cầu tới Gemini bị quá thời gian chờ (90 giây).');
      } else {
        lastError = err;
      }
      if (err.code === 'RATE_LIMIT' || err.code === 'INVALID_API_KEY') {
        throw err;
      }
    }
  }

  throw lastError || new Error('Không thể kết nối tới mô hình AI Gemini.');
}

/**
 * AI1 — Message & Excuse Assistant
 */
async function generateMessage(apiKey, { situation, style = 'Polite Refusal', recipient = '' }) {
  if (!situation || !situation.trim()) {
    throw new Error('Vui lòng nhập mô tả tình huống cần tạo tin nhắn.');
  }

  const stylePrompts = {
    'Professional': 'Phong cách Chuyên nghiệp, trang trọng, tôn trọng đối tác/công việc, dùng từ ngữ chuẩn mực.',
    'Friendly': 'Phong cách Thân thiện, ấm áp, cởi mở, dùng từ ngữ gần gũi với bạn bè hoặc người quen.',
    'Funny': 'Phong cách Hài hước, duyên dáng, hóm hỉnh, biến lý do từ chối thành một câu đùa nhẹ nhàng không gây tự ái.',
    'Short & Direct': 'Phong cách Ngắn gọn & Trực tiếp, súc tích trong 1-2 câu ngắn, đi thẳng vào vấn đề không vòng vo.',
    'Polite Refusal': 'Phong cách Từ chối lịch sự, khéo léo bày tỏ sự tiếc nuối và đưa ra lời hẹn bù dịp khác.',
  };

  situation = text(situation, 'Tình huống', 1, 600);
  if (typeof recipient !== 'string' || recipient.length > 100 || !STYLES.includes(style)) throw new Error('Phong cách hoặc người nhận không hợp lệ.');
  const selectedStyleDesc = stylePrompts[style] || stylePrompts['Polite Refusal'];

  const prompt = `
${SYSTEM_GUARDRAIL}

Yêu cầu: Hãy tạo 1 tin nhắn hoặc lời từ chối bằng tiếng Việt giúp người dùng xử lý tình huống sau.
Tình huống: "${situation.trim()}"
Đối tượng nhận (nếu có): "${recipient.trim() || 'Người đối diện / Nhóm bạn / Đồng nghiệp'}"
Yêu cầu phong cách: ${selectedStyleDesc}

Quy định:
- Chỉ trả về duy nhất nội dung tin nhắn hoàn chỉnh, không thêm lời chào mở đầu hay giải thích của AI.
- Độ dài vừa phải (1 - 3 câu), tự nhiên, dễ gửi qua Zalo/SMS hoặc nói trực tiếp.
`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  };

  const result = await callGemini(apiKey, payload);
  return {
    success: true,
    text: result.text.replace(/^["']|["']$/g, ''), // Strip surrounding quotes
    style,
    model: result.model,
  };
}

/**
 * AI2 — Scenario Generator (HIGH PRIORITY)
 * Generates strict structured JSON
 */
async function generateScenario(apiKey, { situationDescription, preferredCategory = '' }) {
  if (!situationDescription || !situationDescription.trim()) {
    throw new Error('Vui lòng mô tả tình huống bạn muốn thoát ra.');
  }

  situationDescription = text(situationDescription, 'Tình huống', 8, 800);
  if (preferredCategory && !CATEGORIES.includes(preferredCategory)) throw new Error('Thể loại không hợp lệ.');
  const prompt = `
${SYSTEM_GUARDRAIL}

Nhiệm vụ: Người dùng đang ở trong tình huống sau và cần một kịch bản hoàn chỉnh để tạo cớ rời đi một cách thuyết phục và tự nhiên.
Mô tả tình huống: "${situationDescription.trim()}"
${preferredCategory ? `Thể loại ưu tiên: ${preferredCategory}` : ''}

Hãy xuất ra DUY NHẤT một chuỗi JSON hợp lệ (không kèm markdown ngoài JSON, không bọc trong \`\`\`json) theo đúng cấu trúc sau:
{
  "scenarioTitle": "Tiêu đề kịch bản ngắn gọn dưới 50 ký tự (Ví dụ: Mẹ gọi có việc gia đình đột xuất)",
  "category": "Công sở" | "Gia đình" | "Bạn bè" | "Hẹn hò / Tiệc tùng" | "Khẩn cấp",
  "caller": {
    "name": "Tên người gọi thuyết phục (Ví dụ: Sếp Hoàng, Mẹ, Bác sĩ Hùng)",
    "role": "Vai trò ngắn (Ví dụ: Trưởng phòng, Gia đình, Shipper)",
    "phoneNumber": "Số điện thoại giả định Việt Nam (Ví dụ: 0903 888 999)",
    "avatarUrl": ""
  },
  "delaySeconds": 0, 10, 30 hoặc 60,
  "ambientSound": "office" | "cafe" | "street" | "hospital" | "none",
  "dialogue": [
    "Câu thoại 1 của người gọi khi bắt máy (gấp gáp, tự nhiên)...",
    "Câu thoại 2 người dùng phản hồi...",
    "Câu thoại 3 người gọi chốt lý do cần về ngay...",
    "Câu thoại 4 người dùng xác nhận cúp máy..."
  ],
  "suggestedMessage": "Một câu tin nhắn hoặc lời chào từ chối lịch sự đề xuất gửi trước hoặc sau khi rời đi"
}

Quy định chặt chẽ:
- "ambientSound" BẮT BUỘC phải là một trong 5 giá trị: "office", "cafe", "street", "hospital", "none".
- "dialogue" là mảng từ 3 đến 5 câu thoại ngắn bằng tiếng Việt.
- "category" là một trong 5 giá trị tiếng Việt: "Công sở", "Gia đình", "Bạn bè", "Hẹn hò / Tiệc tùng", "Khẩn cấp".
`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.6,
      responseMimeType: 'application/json',
      maxOutputTokens: 2048,
      responseJsonSchema: require('./scenarioSchema.json'),
    },
  };

  const result = await callGemini(apiKey, payload);

  // Validate and parse JSON
  let parsed;
  try {
    let cleanJson = result.text.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```/, '').replace(/```$/, '').trim();
    }
    parsed = JSON.parse(cleanJson);
  } catch (err) {
    console.error('Invalid Gemini JSON response');
    throw new Error('Dữ liệu kịch bản từ AI không đúng định dạng JSON chuẩn. Vui lòng thử lại.');
  }

  const sanitized = { ...validateAiScenario(parsed), isAiGenerated: true, model: result.model };

  return {
    success: true,
    scenario: sanitized,
  };
}

/**
 * AI3 - Roleplay Dynamic Dialogue Generator
 * Generates context-aware, highly natural multi-turn caller dialogue lines
 */
async function generateDialogue(apiKey, { callerName = 'Người gọi', callerRole = 'Người quen', scenarioTitle = 'Việc gấp', category = 'Khẩn cấp', context = '' }) {
  const prompt = `
${SYSTEM_GUARDRAIL}

Nhiệm vụ: Tạo lời thoại cuộc gọi mô phỏng thực tế, tự nhiên bằng tiếng Việt cho người gọi đến trong tình huống sau:
- Tên người gọi: "${callerName}"
- Vai trò / Quan hệ: "${callerRole}"
- Tình huống cuộc gọi: "${scenarioTitle}"
- Thể loại: "${category}"
${context ? `- Ghi chú ngữ cảnh: "${context}"` : ''}

Yêu cầu:
1. Xuất ra DUY NHẤT một chuỗi JSON hợp lệ (không kèm markdown ngoài JSON, không bọc trong \`\`\`json) theo đúng cấu trúc:
{
  "dialogue": [
    "Câu thoại 1 mở đầu khi bắt máy (gấp gáp, tự nhiên, xưng hô phù hợp)...",
    "Câu thoại 2 nêu chi tiết tình huống hoặc yêu cầu giải quyết...",
    "Câu thoại 3 giục giã hoặc chốt người nghe cần về/rời đi ngay..."
  ]
}
2. "dialogue" là một mảng từ 2 đến 4 câu thoại bằng tiếng Việt đời thường, tự nhiên, không sáo rỗng.
`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json',
    },
  };

  const result = await callGemini(apiKey, payload);
  let parsed;
  try {
    let clean = result.text.trim();
    if (clean.startsWith('```json')) clean = clean.replace(/^```json/, '').replace(/```$/, '').trim();
    else if (clean.startsWith('```')) clean = clean.replace(/^```/, '').replace(/```$/, '').trim();
    parsed = JSON.parse(clean);
  } catch (err) {
    throw new Error('Dữ liệu đối thoại từ AI không đúng định dạng JSON.');
  }

  if (!parsed || !Array.isArray(parsed.dialogue) || parsed.dialogue.length === 0) {
    throw new Error('AI không trả về danh sách câu thoại hợp lệ.');
  }

  return {
    success: true,
    dialogue: parsed.dialogue.map(s => String(s).trim()).filter(Boolean),
    model: result.model,
  };
}

/**
 * AI4 - Dynamic Two-Way Voice Call Responder
 * Generates immediate, role-consistent spoken reply to user's real-time spoken utterance
 */
async function respondToUserCall(apiKey, {
  callerName = 'Người gọi',
  callerRole = 'Người quen',
  scenarioTitle = 'Cuộc gọi mô phỏng',
  category = 'Khẩn cấp',
  userUtterance = '',
  conversationHistory = [],
}) {
  if (!userUtterance || !userUtterance.trim()) {
    throw new Error('Lời thoại người dùng không được để trống.');
  }

  const historyFormatted = Array.isArray(conversationHistory) && conversationHistory.length > 0
    ? conversationHistory.slice(-6).map((turn) => {
        const speaker = turn.role === 'user' ? 'Tôi (Người nghe)' : `${callerName} (Người gọi)`;
        return `${speaker}: "${turn.text}"`;
      }).join('\n')
    : '(Bắt đầu cuộc gọi)';

  const prompt = `
${SYSTEM_GUARDRAIL}

BẠN ĐANG NHẬP VAI TRONG CUỘC GỌI ĐIỆN THOẠI TRỰC TIẾP:
- Tên người gọi (Bạn): "${callerName}"
- Vai trò / Quan hệ với người nghe: "${callerRole}"
- Tình huống cuộc gọi: "${scenarioTitle}"
- Thể loại: "${category}"

QUY TẮC BẮT BUỘC VỀ VAI TRÒ (ROLE DOMINANCE):
1. Danh tính và vai trò người gọi (callerName: "${callerName}", callerRole: "${callerRole}") là QUAN TRỌNG NHẤT VÀ CHI PHỐI TOÀN BỘ cuộc gọi.
   - Nếu tên hoặc vai trò là người thân/gia đình (như "Mẹ", "Mẹ Yêu", "Bố", "Gia đình"): Bạn TUYỆT ĐỐI là người thân trong gia đình giục việc nhà, KHÔNG ĐƯỢC đóng vai sếp công sở hay nhắc đến server/máy chủ/công việc dù cho tiêu đề tình huống có từ khóa đó.
   - Nếu vai trò là Sếp / Trưởng phòng / Công sở: Bạn đóng vai sếp yêu cầu xử lý công việc gấp.
   - Nếu vai trò là Shipper / Giao hàng: Bạn đóng vai shipper đang chờ giao hàng gấp.
   - Nếu vai trò là Bạn bè: Bạn đóng vai bạn bè thân thiết nhờ giúp đỡ.
2. Xưng hô chuẩn mực 100% theo vai trò:
   - Mẹ xưng "mẹ - con"
   - Bố xưng "bố - con"
   - Sếp xưng "anh/chị - em"
   - Bạn bè xưng "tao - mày" hoặc "mình - bạn"
   - Shipper xưng "em - anh/chị"

QUY TẮC ĐỐI THOẠI (STRICT SINGLE TURN):
- Bạn CHỈ NÓI PHẦN CỦA NGƯỜI GỌI ("${callerName}").
- TUYỆT ĐỐI KHÔNG tự nói thay người nghe, KHÔNG tự đặt câu hỏi rồi tự trả lời, KHÔNG xuất ra cả hai bên đối thoại.
- Độ dài: Đúng 1 đến 2 câu ngắn (tối đa 25-30 từ), khẩn trương, tự nhiên như nghe qua điện thoại thật.
- TUYỆT ĐỐI KHÔNG ghi tiền tố (như "Mẹ:", "Sếp:"), KHÔNG có ngoặc đơn mô tả hành động (như "(thở dài)"), KHÔNG có lời giải thích. Chỉ xuất ra duy nhất câu thoại bạn nói.

Lịch sử cuộc gọi gần nhất:
${historyFormatted}

Người nghe vừa nói vào micro: "${userUtterance.trim()}"
`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 120,
    },
  };

  const result = await callGemini(apiKey, payload);
  let cleanText = (result.text || '').trim()
    .replace(/^["']|["']$/g, '')
    .replace(/^\([^)]*\)\s*/g, '')
    .replace(/^\[[^\]]*\]\s*/g, '')
    .replace(/^[^:]*:\s*/, '')
    .trim();

  // Attempt to generate spoken audio concurrently or gracefully fallback
  let ttsResult = null;
  try {
    ttsResult = await generateGeminiTts(apiKey, {
      text: cleanText,
      voiceName,
      callerRole,
      callerName,
    });
  } catch (_) {}

  return {
    success: true,
    reply: cleanText,
    audioBase64: ttsResult?.success ? ttsResult.audioBase64 : null,
    audioMimeType: ttsResult?.success ? ttsResult.audioMimeType : null,
    voice: ttsResult?.voice || resolveVoiceName(voiceName, callerRole, callerName),
    model: result.model,
    ttsModel: ttsResult?.model || null,
  };
}

let preloadedCache = {};
try {
  preloadedCache = require('./preloadedVoiceCache');
} catch (_) {}

const ttsCache = new Map(Object.entries(preloadedCache));
const MAX_TTS_CACHE = 150;

function pcmToWav(pcmBuffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16) {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

const TTS_PRIMARY_MODEL = 'gemini-3.8-flash-lite-tts';
const TTS_FALLBACK_MODELS = [
  'gemini-3.8-flash-tts',
  'gemini-3.1-flash-tts-preview',
];

const GEMINI_VOICES = {
  mother: 'Kore',
  kore: 'Kore',
  father: 'Charon',
  charon: 'Charon',
  boss: 'Fenrir',
  fenrir: 'Fenrir',
  friend: 'Puck',
  puck: 'Puck',
  shipper: 'Aoede',
  aoede: 'Aoede',
};

function resolveVoiceName(voiceName, callerRole = '', callerName = '') {
  if (voiceName && voiceName !== 'auto') {
    const key = voiceName.toLowerCase();
    if (GEMINI_VOICES[key]) return GEMINI_VOICES[key];
    return voiceName;
  }

  const textToScan = ` ${callerRole} ${callerName} `.toLowerCase();
  if (/(^|[\s,._-])(mẹ|má|u|bà|chị|dì|cô|bác gái|nữ)([\s,._-]|$)/i.test(textToScan)) return 'Kore';
  if (/(^|[\s,._-])(bố|ba|cha|chú|bác trai|ông)([\s,._-]|$)/i.test(textToScan)) return 'Charon';
  if (/(sếp|giám đốc|trưởng phòng|quản lý|đối tác|công ty|văn phòng)/i.test(textToScan)) return 'Fenrir';
  if (/(shipper|giao hàng|tài xế|bưu tá|xe ôm)/i.test(textToScan)) return 'Aoede';
  if (/(bạn|bồ|người yêu|đồng nghiệp|em)/i.test(textToScan)) return 'Puck';

  return 'Kore';
}

async function generateGeminiTts(apiKey, {
  text: rawText,
  voiceName = 'Kore',
  callerRole = '',
  callerName = '',
  isPreview = false,
}) {
  if (!rawText || !rawText.trim()) {
    throw new Error('Văn bản cần đọc không được để trống.');
  }

  const cleanText = rawText.trim()
    .replace(/^["']|["']$/g, '')
    .replace(/^\([^)]*\)\s*/g, '')
    .replace(/^\[[^\]]*\]\s*/g, '')
    .trim();

  const selectedVoice = resolveVoiceName(voiceName, callerRole, callerName);
  const cacheKey = isPreview
    ? `preview:${selectedVoice.toLowerCase()}`
    : `${selectedVoice.toLowerCase()}:${cleanText.toLowerCase()}`;

  if (ttsCache.has(cacheKey)) {
    const cached = ttsCache.get(cacheKey);
    return {
      success: true,
      audioBase64: cached.base64,
      audioMimeType: cached.mimeType || 'audio/wav',
      voice: selectedVoice,
      cached: true,
    };
  }

  if (!apiKey || !apiKey.trim()) {
    const error = new Error('GEMINI_API_KEY chưa được cấu hình.');
    error.code = 'MISSING_API_KEY';
    throw error;
  }

  const modelsToTry = [TTS_PRIMARY_MODEL, ...TTS_FALLBACK_MODELS];
  let lastError = null;

  for (const model of modelsToTry) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey.trim(),
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: cleanText }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: selectedVoice,
                },
              },
            },
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        const errorStatus = response.status;
        console.warn(`[Gemini TTS] Upstream HTTP ${errorStatus} on model ${model}`);
        if (errorStatus === 429) {
          lastError = new Error('Hạn ngạch Gemini TTS tạm thời hết lượt.');
          lastError.code = 'RATE_LIMIT';
          continue;
        }
        lastError = new Error(data?.error?.message || `Lỗi HTTP ${errorStatus}`);
        continue;
      }

      const parts = data?.candidates?.[0]?.content?.parts || [];
      const audioPart = parts.find((p) => p.inlineData && p.inlineData.data);
      if (!audioPart) {
        lastError = new Error(`Mô hình ${model} không trả về dữ liệu âm thanh.`);
        continue;
      }

      let audioBase64 = audioPart.inlineData.data;
      let mimeType = audioPart.inlineData.mimeType || 'audio/wav';

      if (mimeType.includes('L16') || mimeType.includes('pcm')) {
        const pcmBuf = Buffer.from(audioBase64, 'base64');
        const wavBuf = pcmToWav(pcmBuf, 24000, 1, 16);
        audioBase64 = wavBuf.toString('base64');
        mimeType = 'audio/wav';
      }

      if (ttsCache.size >= MAX_TTS_CACHE) {
        const firstKey = ttsCache.keys().next().value;
        if (!firstKey.startsWith('preview:')) {
          ttsCache.delete(firstKey);
        }
      }
      ttsCache.set(cacheKey, { base64: audioBase64, mimeType, voice: selectedVoice });

      return {
        success: true,
        audioBase64,
        audioMimeType: 'audio/wav',
        voice: selectedVoice,
        model,
        cached: false,
      };
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err;
    }
  }

  return {
    success: false,
    fallback: true,
    error: lastError?.message || 'Không thể tạo âm thanh Gemini TTS lúc này.',
    code: lastError?.code || 'TTS_ERROR',
    voice: selectedVoice,
  };
}

module.exports = {
  callGemini,
  generateMessage,
  generateScenario,
  generateDialogue,
  respondToUserCall,
  generateGeminiTts,
  resolveVoiceName,
  PRIMARY_MODEL,
  TTS_PRIMARY_MODEL,
  GEMINI_VOICES,
};

