const fs = require('fs');
const path = require('path');

// Read API key
let apiKey = process.env.GEMINI_API_KEY || '';
if (!apiKey && fs.existsSync('server/.env')) {
  const envContent = fs.readFileSync('server/.env', 'utf8');
  const m = envContent.match(/GEMINI_API_KEY=(.*)/);
  if (m) apiKey = m[1].trim();
}

const { generateGeminiTts } = require('../server/geminiProxy');

const OUT_DIR = path.join(__dirname, '..', 'assets', 'audio', 'voices');
fs.mkdirSync(OUT_DIR, { recursive: true });

const SAME_SENTENCE = 'Alo, tôi đang gọi cho bạn đây, có việc gấp cần trao đổi ngay!';

const SAMPLES = [
  { file: 'sample_mother.wav', voice: 'Kore', text: SAME_SENTENCE, role: 'Mẹ' },
  { file: 'sample_father.wav', voice: 'Charon', text: SAME_SENTENCE, role: 'Bố' },
  { file: 'sample_boss.wav', voice: 'Fenrir', text: SAME_SENTENCE, role: 'Sếp' },
  { file: 'sample_friend.wav', voice: 'Puck', text: SAME_SENTENCE, role: 'Bạn bè' },
  { file: 'sample_shipper.wav', voice: 'Aoede', text: SAME_SENTENCE, role: 'Shipper' },
];

const ROLE_CLIPS = [
  // Mother
  { file: 'mother_1.wav', voice: 'Kore', text: 'Con à, mẹ đang đợi cơm con ở nhà này, về sớm đi nhé!' },
  { file: 'mother_2.wav', voice: 'Kore', text: 'Alo con ơi, nhà mình có chút việc gấp, con thu xếp về ngay giúp mẹ với!' },
  { file: 'mother_3.wav', voice: 'Kore', text: 'Con đang ở đâu đấy? Nhớ ghé mua thuốc mang về cho bà rồi ăn cơm luôn nhé.' },

  // Father
  { file: 'father_1.wav', voice: 'Charon', text: 'Bố nghe đây con, có việc gì gấp không?' },
  { file: 'father_2.wav', voice: 'Charon', text: 'Alo con à, bố bảo này, lát xong việc con ghé qua nhà bố có việc cần bàn một chút.' },
  { file: 'father_3.wav', voice: 'Charon', text: 'Ừ, bố đang ở nhà rồi, con cứ lo việc cho cẩn thận rồi về nhé.' },

  // Boss
  { file: 'boss_1.wav', voice: 'Fenrir', text: 'Cậu quay lại văn phòng ngay để họp xử lý hợp đồng nhé.' },
  { file: 'boss_2.wav', voice: 'Fenrir', text: 'Alo, khách hàng đang phản ánh gấp về hệ thống, cậu kiểm tra lại toàn bộ tiến độ ngay giúp tôi.' },
  { file: 'boss_3.wav', voice: 'Fenrir', text: 'Tình hình tài liệu đã hoàn tất chưa? Cậu gửi lại bản tóm tắt ngay cho tôi trước khi kết thúc ca làm việc.' },

  // Friend
  { file: 'friend_1.wav', voice: 'Puck', text: 'Ê mày, đang ở đâu đấy, qua tao cà phê tí đi!' },
  { file: 'friend_2.wav', voice: 'Puck', text: 'Alo, xe tao tự nhiên chết máy ở đường rồi, mày chạy qua đón tao một đoạn được không?' },
  { file: 'friend_3.wav', voice: 'Puck', text: 'Tao đang đợi ở quán quen này, mày tranh thủ qua lẹ đi có chuyện vui lắm!' },

  // Shipper
  { file: 'shipper_1.wav', voice: 'Aoede', text: 'Alo anh ơi, em giao hàng tới chân chung cư rồi, anh xuống lấy giúp em nhé.' },
  { file: 'shipper_2.wav', voice: 'Aoede', text: 'Dạ em shipper đây ạ, kiện hàng của mình cần ký nhận gấp, anh ra cổng nhận giúp em với.' },
  { file: 'shipper_3.wav', voice: 'Aoede', text: 'Em đứng đợi ở sảnh chung cư 5 phút rồi ạ, anh xuống lấy luôn không em phải chạy đơn tiếp theo.' },
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateWithRetry(item, maxRetries = 4) {
  const filePath = path.join(OUT_DIR, item.file);
  if (fs.existsSync(filePath) && fs.statSync(filePath).size > 1000) {
    console.log(`[SKIP] Already exists: ${item.file} (${fs.statSync(filePath).size} bytes)`);
    return;
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Generating [${item.voice}] ${item.file}: "${item.text.slice(0, 35)}..." (attempt ${attempt})`);
      const res = await generateGeminiTts(apiKey, {
        text: item.text,
        voiceName: item.voice,
        isPreview: false,
      });

      if (res && res.success && res.audioBase64) {
        const buf = Buffer.from(res.audioBase64, 'base64');
        fs.writeFileSync(filePath, buf);
        console.log(`[OK] Saved ${item.file} (${buf.length} bytes, model: ${res.model})`);
        return;
      }
      throw new Error(res?.error || 'No audio returned');
    } catch (err) {
      console.warn(`[WARN] Attempt ${attempt} failed for ${item.file}: ${err.message}`);
      if (attempt < maxRetries) {
        const waitMs = (err.message.includes('429') || err.message.includes('Hạn ngạch')) ? 30000 : attempt * 3000;
        console.log(`Waiting ${waitMs}ms for Gemini rate limit to reset...`);
        await sleep(waitMs);
      } else {
        throw err;
      }
    }
  }
}

async function main() {
  console.log('=== 1. GENERATING 5 COMPARISON VOICE SAMPLES ===');
  for (const sample of SAMPLES) {
    await generateWithRetry(sample);
    await sleep(1500);
  }

  console.log('\n=== 2. GENERATING PRERECORDED CALLER CLIPS (3 PER ROLE) ===');
  for (const clip of ROLE_CLIPS) {
    await generateWithRetry(clip);
    await sleep(1500);
  }

  console.log('\n=== 3. VERIFYING GENERATED ASSETS ===');
  const allFiles = [...SAMPLES, ...ROLE_CLIPS].map(i => i.file);
  let totalBytes = 0;
  for (const f of allFiles) {
    const p = path.join(OUT_DIR, f);
    if (!fs.existsSync(p)) {
      console.error(`[FAIL] Missing file: ${f}`);
    } else {
      const sz = fs.statSync(p).size;
      totalBytes += sz;
      const header = Buffer.alloc(12);
      const fd = fs.openSync(p, 'r');
      fs.readSync(fd, header, 0, 12, 0);
      fs.closeSync(fd);
      const isRiffWav = header.subarray(0, 4).toString() === 'RIFF' && header.subarray(8, 12).toString() === 'WAVE';
      console.log(`Verified ${f}: ${sz} bytes | RIFF/WAVE: ${isRiffWav ? 'YES ✅' : 'NO ❌'}`);
    }
  }
  console.log(`\nAll voice assets generated successfully! Total size: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
}

main().catch(err => {
  console.error('[FATAL]:', err);
  process.exit(1);
});

