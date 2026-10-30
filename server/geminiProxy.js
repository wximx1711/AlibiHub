/**
 * AlibiHub - Gemini API Integration Proxy Core
 * Securely handles calls to Gemini models with structured JSON output,
 * timeout protection, safety guardrails, and Vietnamese error formatting.
 */

const { validateAiScenario, text, STYLES, CATEGORIES } = require('../src/utils/validation');
const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
const FALLBACK_MODELS = [];

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

        if (errorStatus === 429) {
          const rateErr = new Error('Hạn ngạch API Gemini đã tạm thời hết lượt (Quota exceeded / Rate limit). Vui lòng thử lại sau ít phút.');
          rateErr.code = 'RATE_LIMIT';
          throw rateErr;
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

module.exports = {
  callGemini,
  generateMessage,
  generateScenario,
  PRIMARY_MODEL,
};

