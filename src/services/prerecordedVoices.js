/**
 * Pre-recorded high-quality AI caller voice clips bundled directly with AlibiHub.
 * Generated using Google Gemini AI TTS across 5 distinct persona voice profiles.
 * Provides 100% offline, zero-latency, reliable speech playback when network is offline
 * or Gemini API rate limit is reached, avoiding robotic single-voice device TTS.
 */

export const PRERECORDED_CLIPS = {
  mother: [
    {
      source: require('../../assets/audio/voices/mother_1.wav'),
      text: 'Con à, mẹ đang đợi cơm con ở nhà này, về sớm đi nhé!',
    },
    {
      source: require('../../assets/audio/voices/mother_2.wav'),
      text: 'Alo con ơi, nhà mình có chút việc gấp, con thu xếp về ngay giúp mẹ với!',
    },
    {
      source: require('../../assets/audio/voices/mother_3.wav'),
      text: 'Con đang ở đâu đấy? Nhớ ghé mua thuốc mang về cho bà rồi ăn cơm luôn nhé.',
    },
  ],
  father: [
    {
      source: require('../../assets/audio/voices/father_1.wav'),
      text: 'Bố nghe đây con, có việc gì gấp không?',
    },
    {
      source: require('../../assets/audio/voices/father_2.wav'),
      text: 'Alo con à, bố bảo này, lát xong việc con ghé qua nhà bố có việc cần bàn một chút.',
    },
    {
      source: require('../../assets/audio/voices/father_3.wav'),
      text: 'Ừ, bố đang ở nhà rồi, con cứ lo việc cho cẩn thận rồi về nhé.',
    },
  ],
  boss: [
    {
      source: require('../../assets/audio/voices/boss_1.wav'),
      text: 'Cậu quay lại văn phòng ngay để họp xử lý hợp đồng nhé.',
    },
    {
      source: require('../../assets/audio/voices/boss_2.wav'),
      text: 'Alo, khách hàng đang phản ánh gấp về hệ thống, cậu kiểm tra lại toàn bộ tiến độ ngay giúp tôi.',
    },
    {
      source: require('../../assets/audio/voices/boss_3.wav'),
      text: 'Tình hình tài liệu đã hoàn tất chưa? Cậu gửi lại bản tóm tắt ngay cho tôi trước khi kết thúc ca làm việc.',
    },
  ],
  friend: [
    {
      source: require('../../assets/audio/voices/friend_1.wav'),
      text: 'Ê mày, đang ở đâu đấy, qua tao cà phê tí đi!',
    },
    {
      source: require('../../assets/audio/voices/friend_2.wav'),
      text: 'Alo, xe tao tự nhiên chết máy ở đường rồi, mày chạy qua đón tao một đoạn được không?',
    },
    {
      source: require('../../assets/audio/voices/friend_3.wav'),
      text: 'Tao đang đợi ở quán quen này, mày tranh thủ qua lẹ đi có chuyện vui lắm!',
    },
  ],
  shipper: [
    {
      source: require('../../assets/audio/voices/shipper_1.wav'),
      text: 'Alo anh ơi, em giao hàng tới chân chung cư rồi, anh xuống lấy giúp em nhé.',
    },
    {
      source: require('../../assets/audio/voices/shipper_2.wav'),
      text: 'Dạ em shipper đây ạ, kiện hàng của mình cần ký nhận gấp, anh ra cổng nhận giúp em với.',
    },
    {
      source: require('../../assets/audio/voices/shipper_3.wav'),
      text: 'Em đứng đợi ở sảnh chung cư 5 phút rồi ạ, anh xuống lấy luôn không em phải chạy đơn tiếp theo.',
    },
  ],
};

export const PRERECORDED_SAMPLES = {
  mother: {
    source: require('../../assets/audio/voices/sample_mother.wav'),
    voice: 'Kore (Nữ - Ấm áp)',
    text: 'Alo, tôi đang gọi cho bạn đây, có việc gấp cần trao đổi ngay!',
  },
  father: {
    source: require('../../assets/audio/voices/sample_father.wav'),
    voice: 'Charon (Nam - Trầm ấm)',
    text: 'Alo, tôi đang gọi cho bạn đây, có việc gấp cần trao đổi ngay!',
  },
  boss: {
    source: require('../../assets/audio/voices/sample_boss.wav'),
    voice: 'Fenrir (Nam - Quyết đoán)',
    text: 'Alo, tôi đang gọi cho bạn đây, có việc gấp cần trao đổi ngay!',
  },
  friend: {
    source: require('../../assets/audio/voices/sample_friend.wav'),
    voice: 'Puck (Nam - Trẻ trung)',
    text: 'Alo, tôi đang gọi cho bạn đây, có việc gấp cần trao đổi ngay!',
  },
  shipper: {
    source: require('../../assets/audio/voices/sample_shipper.wav'),
    voice: 'Aoede (Nữ - Năng động)',
    text: 'Alo, tôi đang gọi cho bạn đây, có việc gấp cần trao đổi ngay!',
  },
};

/**
 * Match a caller / persona key to the role bucket for audio assets
 */
export function resolveRoleKey(personaKey = '', caller = {}) {
  // 1. Explicit voiceId saved in caller profile takes precedence
  const v = (caller?.voiceId || '').toLowerCase();
  if (v === 'kore') return 'mother';
  if (v === 'aoede') return 'shipper'; // Aoede female audio
  if (v === 'charon') return 'father'; // Charon male audio
  if (v === 'fenrir') return 'boss';   // Fenrir male audio
  if (v === 'puck') return 'friend';   // Puck male audio

  // 2. Explicit female gender NEVER returns male audio assets
  if (caller?.gender === 'female') {
    if (String(personaKey).toUpperCase() === 'FAMILY_MOM') return 'mother';
    return 'shipper'; // Aoede female voice
  }

  // 3. Explicit male gender
  if (caller?.gender === 'male') {
    if (String(personaKey).toUpperCase() === 'BOSS') return 'boss';
    if (String(personaKey).toUpperCase() === 'FRIEND') return 'friend';
    return 'father';
  }

  // 4. Persona-driven mapping
  const p = String(personaKey).toUpperCase();
  if (p === 'FAMILY_MOM') return 'mother';
  if (p === 'FAMILY_DAD') return 'father';
  if (p === 'NEIGHBOR') return 'father'; // Charon older male voice
  if (p === 'BOSS') return 'boss';
  if (p === 'SHIPPER') return 'shipper';
  if (p === 'FRIEND') {
    const name = (caller?.name || '').toLowerCase();
    if (/(linh|hoa|mai|nhung|trang|hương|nữ|gái)/i.test(name)) {
      return 'shipper'; // Female voice for female friend Linh
    }
    return 'friend';
  }

  const textToScan = `${caller?.role || ''} ${caller?.name || ''}`.toLowerCase();
  if (/(mẹ|má|u|bà|chị|em gái|nữ)/i.test(textToScan)) return 'mother';
  if (/(bố|ba|cha|chú|bác|ông|nam)/i.test(textToScan)) return 'father';
  if (/(sếp|giám đốc|trưởng phòng|công ty|đối tác)/i.test(textToScan)) return 'boss';
  if (/(ship|giao hàng|bưu tá)/i.test(textToScan)) return 'shipper';
  if (/(linh|hoa|mai|nhung)/i.test(textToScan)) return 'shipper';
  if (/(bạn|thằng|đồng nghiệp|cạ cứng)/i.test(textToScan)) return 'friend';

  return 'mother';
}

/**
 * Get pre-recorded audio clip for a caller persona at a given dialogue step
 */
export function getPrerecordedClip(personaKey, caller = {}, stepIndex = 0) {
  const roleKey = resolveRoleKey(personaKey, caller);
  const clips = PRERECORDED_CLIPS[roleKey] || PRERECORDED_CLIPS.mother;
  const idx = Math.abs(stepIndex) % clips.length;
  return clips[idx];
}

/**
 * Get pre-recorded comparison sample for voice preview in setup screen
 */
export function getPrerecordedSample(voiceId = 'kore') {
  const id = String(voiceId).toLowerCase();
  if (id.includes('kore') || id.includes('mother') || id.includes('mẹ')) return PRERECORDED_SAMPLES.mother;
  if (id.includes('charon') || id.includes('father') || id.includes('bố')) return PRERECORDED_SAMPLES.father;
  if (id.includes('fenrir') || id.includes('boss') || id.includes('sếp')) return PRERECORDED_SAMPLES.boss;
  if (id.includes('puck') || id.includes('friend') || id.includes('bạn')) return PRERECORDED_SAMPLES.friend;
  if (id.includes('aoede') || id.includes('shipper')) return PRERECORDED_SAMPLES.shipper;
  return PRERECORDED_SAMPLES.mother;
}
