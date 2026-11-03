/**
 * AlibiHub - Minimal Secure Server-Side Proxy for Gemini Requests
 * Uses Node.js built-in HTTP module (Zero-dependency for maximum reliability).
 * Holds GEMINI_API_KEY securely on the server; client never sees the secret.
 */

const http = require('http');
const path = require('path');
const fs = require('fs');

// Try to read .env file manually if present
function loadEnv() {
  const envPaths = [
    path.join(__dirname, '.env'),
    path.join(__dirname, '..', '.env'),
  ];
  for (const p of envPaths) {
    if (fs.existsSync(p)) {
      try {
        const lines = fs.readFileSync(p, 'utf8').split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const [k, ...v] = trimmed.split('=');
            const key = k.trim();
            const val = v.join('=').trim().replace(/^["']|["']$/g, '');
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      } catch (_) {}
    }
  }
}

if (process.env.NODE_ENV !== 'test') loadEnv();

const { generateMessage, generateScenario, generateDialogue, respondToUserCall, generateGeminiTts, PRIMARY_MODEL, TTS_PRIMARY_MODEL } = require('./geminiProxy');

const PORT = process.env.PORT || 3001;
const activeApiKey = process.env.GEMINI_API_KEY || '';

// Rate limiting map
const requestCounts = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 40;
let dailyCount = 0;
let dailyReset = Date.now() + 86400000;
let inFlight = 0;
const DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT) || 200;

function checkRateLimit(ip) {
  const now = Date.now();
  for (const [key, value] of requestCounts) if (value.resetTime < now) requestCounts.delete(key);
  if (requestCounts.size > 10000 && !requestCounts.has(ip)) return false;
  const data = requestCounts.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS };
  if (now > data.resetTime) {
    data.count = 1;
    data.resetTime = now + RATE_LIMIT_WINDOW_MS;
  } else {
    data.count++;
  }
  requestCounts.set(ip, data);
  return data.count <= MAX_REQUESTS_PER_WINDOW;
}

function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const ip = req.socket.remoteAddress || 'unknown';

  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  // Rate limiting check
  if (!checkRateLimit(ip)) {
    return sendJson(res, 429, {
      success: false,
      error: 'Quá nhiều yêu cầu trong thời gian ngắn. Vui lòng thử lại sau 1 phút.',
    });
  }

  const parsedUrl = new URL(req.url, 'http://localhost');
  const pathname = parsedUrl.pathname;

  // 1. GET /api/health
  if (req.method === 'GET' && pathname === '/api/health') {
    return sendJson(res, 200, {
      status: 'online',
      service: 'AlibiHub Gemini Proxy',
      hasKey: !!(activeApiKey && activeApiKey.trim()),
      model: PRIMARY_MODEL,
      timestamp: new Date().toISOString(),
    });
  }

  // Parse Body for POST routes
  if (req.method === 'POST') {
    let tooLarge = false;
    let bodyData = '';
    req.on('data', (chunk) => {
      if (tooLarge) return;
      bodyData += chunk;
      if (Buffer.byteLength(bodyData) > 16384) {
        tooLarge = true;
        sendJson(res, 413, { success: false, error: 'Yêu cầu quá lớn.' });
      }
    });

    req.on('end', async () => {
      if (tooLarge) return;
      let body = {};
      try {
        if (bodyData) body = JSON.parse(bodyData);
      } catch (e) {
        return sendJson(res, 400, { success: false, error: 'Dữ liệu JSON không hợp lệ.' });
      }

      if (!body || typeof body !== 'object' || Array.isArray(body)) return sendJson(res, 400, { success: false, error: 'JSON phải là một đối tượng.' });

      // 2. POST /api/config/key
      if (pathname === '/api/config/key') {
        return sendJson(res, 403, { success: false, error: 'Chỉ cấu hình khóa bằng biến môi trường máy chủ.' });
      }

      if (pathname === '/api/ai/message' || pathname === '/api/ai/scenario' || pathname === '/api/ai/dialogue' || pathname === '/api/ai/call-reply') {
        if (Date.now() > dailyReset) { dailyCount = 0; dailyReset = Date.now() + 86400000; }
        if (inFlight >= 3 || dailyCount >= DAILY_LIMIT) return sendJson(res, 429, { success: false, code: 'RATE_LIMIT', error: 'Máy chủ đã đạt giới hạn sử dụng. Vui lòng thử lại sau.' });
        dailyCount++; inFlight++;
        res.once('close', () => { inFlight--; });
      }

      // 3. POST /api/ai/message (AI1)
      if (pathname === '/api/ai/message') {
        try {
          if (!activeApiKey) {
            return sendJson(res, 401, {
              success: false,
              code: 'MISSING_API_KEY',
              error: 'Chưa cấu hình GEMINI_API_KEY trên máy chủ proxy. Vui lòng thiết lập biến môi trường GEMINI_API_KEY.',
            });
          }
          const { situation, style, recipient } = body;
          const result = await generateMessage(activeApiKey, { situation, style, recipient });
          return sendJson(res, 200, result);
        } catch (error) {
          console.error('[AI1 Error]:', error.message);
          const status = error.code === 'RATE_LIMIT' ? 429 : error.code === 'INVALID_API_KEY' ? 502 : 400;
          return sendJson(res, status, {
            success: false,
            error: error.message,
            code: error.code || 'GENERATION_ERROR',
          });
        }
      }

      // 4. POST /api/ai/scenario (AI2 - HIGH PRIORITY)
      if (pathname === '/api/ai/scenario') {
        try {
          if (!activeApiKey) {
            return sendJson(res, 401, {
              success: false,
              code: 'MISSING_API_KEY',
              error: 'Chưa cấu hình GEMINI_API_KEY trên máy chủ proxy. Vui lòng thiết lập biến môi trường GEMINI_API_KEY.',
            });
          }
          const { situationDescription, preferredCategory } = body;
          const result = await generateScenario(activeApiKey, { situationDescription, preferredCategory });
          return sendJson(res, 200, result);
        } catch (error) {
          console.error('[AI2 Error]:', error.message);
          const status = error.code === 'RATE_LIMIT' ? 429 : error.code === 'INVALID_API_KEY' ? 502 : 400;
          return sendJson(res, status, {
            success: false,
            error: error.message,
            code: error.code || 'GENERATION_ERROR',
          });
        }
      }

      // 5. POST /api/ai/dialogue (AI3 - Dynamic Roleplay Dialogue)
      if (pathname === '/api/ai/dialogue') {
        try {
          if (!activeApiKey) {
            return sendJson(res, 401, {
              success: false,
              code: 'MISSING_API_KEY',
              error: 'Chưa cấu hình GEMINI_API_KEY trên máy chủ proxy. Vui lòng thiết lập biến môi trường GEMINI_API_KEY.',
            });
          }
          const { callerName, callerRole, scenarioTitle, category, context } = body;
          const result = await generateDialogue(activeApiKey, { callerName, callerRole, scenarioTitle, category, context });
          return sendJson(res, 200, result);
        } catch (error) {
          console.error('[AI3 Dialogue Error]:', error.message);
          const status = error.code === 'RATE_LIMIT' ? 429 : error.code === 'INVALID_API_KEY' ? 502 : 400;
          return sendJson(res, status, {
            success: false,
            error: error.message,
            code: error.code || 'GENERATION_ERROR',
          });
        }
      }

      // 6. POST /api/ai/call-reply (AI4 - Real-Time Dynamic Caller Voice Reply)
      if (pathname === '/api/ai/call-reply') {
        try {
          if (!activeApiKey) {
            return sendJson(res, 401, {
              success: false,
              code: 'MISSING_API_KEY',
              error: 'Chưa cấu hình GEMINI_API_KEY trên máy chủ proxy. Vui lòng thiết lập biến môi trường GEMINI_API_KEY.',
            });
          }
          const { callerName, callerRole, scenarioTitle, category, userUtterance, conversationHistory, voiceName } = body;
          const result = await respondToUserCall(activeApiKey, {
            callerName,
            callerRole,
            scenarioTitle,
            category,
            userUtterance,
            conversationHistory,
            voiceName,
          });
          return sendJson(res, 200, result);
        } catch (error) {
          console.error('[AI4 Call Reply Error]:', error.message);
          const status = error.code === 'RATE_LIMIT' ? 429 : error.code === 'INVALID_API_KEY' ? 502 : 400;
          return sendJson(res, status, {
            success: false,
            error: error.message,
            code: error.code || 'GENERATION_ERROR',
          });
        }
      }

      // 7. POST /api/ai/tts (Gemini Backend Natural TTS Engine)
      if (pathname === '/api/ai/tts') {
        try {
          if (!activeApiKey) {
            return sendJson(res, 401, {
              success: false,
              code: 'MISSING_API_KEY',
              error: 'Chưa cấu hình GEMINI_API_KEY trên máy chủ proxy. Vui lòng thiết lập biến môi trường GEMINI_API_KEY.',
            });
          }
          const { text, voiceName, callerRole, callerName, isPreview } = body;
          const result = await generateGeminiTts(activeApiKey, {
            text,
            voiceName,
            callerRole,
            callerName,
            isPreview,
          });
          if (!result.success) {
            const status = result.code === 'MISSING_API_KEY' ? 401 : result.code === 'RATE_LIMIT' ? 429 : 502;
            return sendJson(res, status, result);
          }
          return sendJson(res, 200, result);
        } catch (error) {
          console.error('[Gemini TTS Route Error]:', error.message);
          const status = error.code === 'RATE_LIMIT' ? 429 : error.code === 'INVALID_API_KEY' ? 502 : 400;
          return sendJson(res, status, {
            success: false,
            error: error.message,
            code: error.code || 'TTS_ERROR',
          });
        }
      }

      return sendJson(res, 404, { success: false, error: 'Endpoint không tồn tại.' });
    });
    return;
  }

  sendJson(res, 404, { success: false, error: 'Route không tồn tại.' });
});

// Export server instance
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`[AlibiHub Proxy] Server running on http://localhost:${PORT}`);
    console.log(`[AlibiHub Proxy] API Key Status: ${activeApiKey ? 'Configured ✅' : 'Missing ⚠️'}`);
  });
}

module.exports = server;
