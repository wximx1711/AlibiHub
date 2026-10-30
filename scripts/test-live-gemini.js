/**
 * AlibiHub - Live Gemini API End-to-End Verification Script
 * Tests real AI1 and AI2 requests against Gemini API.
 * Never prints the raw API key to logs.
 */

const path = require('path');
const fs = require('fs');

// Load environment from server/.env or root .env
function loadEnv() {
  const envPaths = [
    path.join(__dirname, '..', 'server', '.env'),
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

loadEnv();

const { generateMessage, generateScenario, PRIMARY_MODEL } = require('../server/geminiProxy');

async function main() {
  console.log('========================================================');
  console.log('🤖 ALIBIHUB - LIVE GEMINI AI VERIFICATION TEST');
  console.log('========================================================');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    console.error('\n❌ LỖI: Chưa tìm thấy biến môi trường GEMINI_API_KEY!');
    console.error('Vui lòng thiết lập GEMINI_API_KEY trong file server/.env hoặc biến môi trường hệ thống.');
    process.exit(1);
  }

  console.log('Đã tìm thấy cấu hình khóa; đang xác thực bằng yêu cầu thật.');
  console.log(`Mô hình sử dụng: ${PRIMARY_MODEL}\n`);

  try {
    // 1. Test AI1 - Message & Excuse Assistant
    console.log('--- Đang kiểm tra AI1 (Message & Excuse Assistant) ---');
    const msgResult = await generateMessage(apiKey, {
      situation: 'Đang tham gia buổi tiệc liên hoan công ty, bị sếp và đồng nghiệp ép uống rượu',
      style: 'Polite Refusal',
      recipient: 'Sếp và đồng nghiệp',
    });
    console.log('✓ Kết nối AI1 thành công!');
    console.log(`- Phong cách: ${msgResult.style}`);
    console.log(`- Mô hình: ${msgResult.model}`);
    console.log(`- Nội dung AI sinh: "${msgResult.text}"\n`);

    // 2. Test AI2 - Scenario Generator (Structured JSON)
    console.log('--- Đang kiểm tra AI2 (Scenario Generator - HIGH PRIORITY) ---');
    const scResult = await generateScenario(apiKey, {
      situationDescription: 'Buổi gặp mặt bạn bè lâu ngày nhưng tôi cảm thấy mệt mỏi và muốn có lý do chính đáng về sớm trong 10 phút nữa',
      preferredCategory: 'Gia đình',
    });
    console.log('✓ Kết nối AI2 thành công!');
    console.log(`- Tiêu đề kịch bản: "${scResult.scenario.scenarioTitle}"`);
    console.log(`- Thể loại: ${scResult.scenario.category}`);
    console.log(`- Người gọi: ${scResult.scenario.caller.name} (${scResult.scenario.caller.phoneNumber}) - ${scResult.scenario.caller.role}`);
    console.log(`- Âm thanh bối cảnh: ${scResult.scenario.ambientSound}`);
    console.log(`- Hẹn giờ đổ chuông: ${scResult.scenario.delaySeconds}s`);
    console.log(`- Số câu thoại sinh: ${scResult.scenario.dialogue.length} câu`);
    console.log(`- Câu thoại 1: "${scResult.scenario.dialogue[0]}"`);
    console.log(`- Lời từ chối đề xuất: "${scResult.scenario.suggestedMessage}"\n`);

    console.log('========================================================');
    console.log('🎉 XÁC THỰC THÀNH CÔNG: GEMINI AI HOẠT ĐỘNG HOÀN HẢO!');
    console.log('========================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ LỖI TRONG QUÁ TRÌNH GỌI GEMINI API:', err.message);
    if (err.code) console.error(`Mã lỗi: ${err.code}`);
    process.exit(1);
  }
}

main();

