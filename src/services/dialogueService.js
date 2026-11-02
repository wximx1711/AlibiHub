/**
 * AlibiHub - Dynamic Roleplay Dialogue & Voice Profiling Service
 * Provides context-aware, highly natural Vietnamese caller dialogues
 * and role-specific acoustic parameters (pitch, rate) for realistic call simulation.
 */

// Acoustic voice profiles tuned by persona/relationship
export const VOICE_PROFILES = {
  FAMILY_MOM: {
    pitch: 1.08,
    rate: 0.94,
    persona: 'Mẹ/Người thân lớn tuổi',
    description: 'Giọng ấm áp, dặn dò, gấp việc gia đình',
  },
  FAMILY_DAD: {
    pitch: 0.88,
    rate: 0.90,
    persona: 'Bố/Phụ huynh',
    description: 'Giọng trầm, nghiêm nghị, dứt khoát',
  },
  BOSS: {
    pitch: 0.97,
    rate: 1.06,
    persona: 'Sếp/Cấp trên công sở',
    description: 'Giọng nghiêm túc, khẩn trương, yêu cầu xử lý ngay',
  },
  FRIEND: {
    pitch: 1.08,
    rate: 1.02,
    persona: 'Bạn thân/Đồng nghiệp',
    description: 'Giọng tự nhiên, xuề xòa, cần hỗ trợ gấp',
  },
  SHIPPER: {
    pitch: 0.96,
    rate: 1.05,
    persona: 'Shipper/Giao nhận',
    description: 'Giọng hối hả, nhanh, nghiệp vụ giao hàng',
  },
  DOCTOR: {
    pitch: 0.95,
    rate: 0.92,
    persona: 'Bác sĩ/Y tế',
    description: 'Giọng điềm đạm, chuẩn mực, thông báo sức khỏe',
  },
  DEFAULT: {
    pitch: 1.00,
    rate: 0.96,
    persona: 'Cuộc gọi thông thường',
    description: 'Giọng trung tính, tự nhiên',
  },
};

// Rich roleplay dialogue collections with multiple natural variations
export const ROLE_DIALOGUES = {
  FAMILY_MOM: [
    [
      'Alo con à? Con đang ở đâu đấy, về nhà gấp giúp mẹ với, họ hàng ở quê vừa lên tới nhà đột xuất đây này!',
      'Có mấy thùng đồ gửi xe khách cần con ra bến xe chở về liền kẻo nhà xe họ dọn bến nhé!',
      'Mẹ với mấy bác đang đợi ở nhà, con chào mọi người rồi phi về ngay nha, cẩn thận đường sá con nhé!',
    ],
    [
      'Alo con ơi, con chưa về à? Nhà mình đang có việc gấp cần con về mở cửa và ký giấy tờ điện nước này!',
      'Mẹ để quên chìa khóa mà thợ họ đang đứng đợi ngoài cổng, con tranh thủ về liền nhé!',
      'Ừ nhanh con nhé, mẹ đang đợi ở cổng đây, về tới gọi mẹ ngay!',
    ],
    [
      'Alo con, con nghe mẹ dặn này, sắp xếp về sớm đi nhé, tối nay nhà mình có việc đại gia đình cần con có mặt!',
      'Mọi người đang hỏi con suốt từ nãy đến giờ đấy, về ngay trong 20 phút nữa nha con!',
    ],
  ],
  FAMILY_DAD: [
    [
      'Alo, bố đây. Con đang ở đâu thế, có việc gia đình đột xuất cần con về nhà xử lý giấy tờ ngay.',
      'Xe ở nhà cũng đang gặp chút trục trặc, con tranh thủ về phụ bố một tay nhé.',
      'Ừ, cẩn thận đường sá rồi về luôn nhé, bố đợi ở nhà.',
    ],
    [
      'Alo con à, bên phường họ vừa gọi thông báo việc xác nhận giấy tờ nhà đất, cần con về ký tên liền bây giờ.',
      'Bố đang ở ủy ban đây, con chạy về qua ủy ban gặp bố ngay nhé!',
    ],
  ],
  BOSS: [
    [
      'Alo em à, hệ thống server bên mình đang gặp sự cố nghiêm trọng, khách hàng phản ánh dữ dội từ nãy đến giờ!',
      'Em có đang cầm laptop ở đó không, mở máy kiểm tra log và khởi động lại dịch vụ ngay giúp anh!',
      'Việc này cực kỳ khẩn cấp ảnh hưởng trực tiếp đến hợp đồng, em tập trung xử lý ngay nhé!',
    ],
    [
      'Alo em ơi, anh gọi gấp vì bản báo cáo dự án chiều nay bên đối tác yêu cầu điều chỉnh gấp trước 30 phút!',
      'Em mở mail xem yêu cầu mới rồi cập nhật lại số liệu gửi anh duyệt ngay nhé!',
      'Rất gấp đấy em, anh chờ file của em trên Slack trong 15 phút tới nhé.',
    ],
    [
      'Alo em, ban giám đốc vừa triệu tập cuộc họp bất thường để chốt phương án thầu cho khách.',
      'Cần em vào Google Meet ngay để phụ trách giải trình phần kỹ thuật, online gấp giúp anh!',
    ],
  ],
  FRIEND: [
    [
      'Ê mày ơi! Xe tao tự dưng bị thủng xăm giữa đường vắng tanh, dắt bộ cả cây số rồi mệt quá!',
      'Mày có đang rảnh không chạy qua ngã tư đón tao hoặc mang đồ qua cứu tao với!',
      'Nhanh nhé bạn hiền ơi, đứng đây một mình sốt ruột quá, tao gửi định vị qua Zalo rồi đấy!',
    ],
    [
      'Alo mày hả, tao để quên mất cái ví với chùm chìa khóa phòng chỗ mày lúc nãy rồi!',
      'Giờ tao không vào nhà được, mày chạy qua đưa tao gấp được không cứu tao với!',
      'Cứu tao phát nha, tao đang đứng đợi dưới sảnh chung cư đây!',
    ],
    [
      'Ê bồ ơi, có biến lớn rồi! Tao đang cần mày tư vấn gấp chuyện này, mày té khỏi chỗ đó qua quán trà sữa gặp tao liền được không?',
      'Gấp lắm đấy, nhanh nhé tao tới quán rồi!',
    ],
  ],
  SHIPPER: [
    [
      'Dạ alo anh chị ơi, em là shipper bên giao hàng hỏa tốc đây ạ. Đơn hàng của anh chị em đã mang tới nơi rồi!',
      'Em đang đứng trước cổng tòa nhà mà bảo vệ không cho gửi, anh chị xuống nhận liền giúp em với ạ!',
      'Hàng này là đồ ăn nóng bảo quản ngắn, anh chị xuống nhanh giùm em nha, em cảm ơn nhiều!',
    ],
    [
      'Alo em bên bưu tá chuyển phát nhanh đây ạ, có bưu phẩm tài liệu ký nhận gấp cần anh chị trực tiếp ra ký tên.',
      'Em chờ ở dưới sảnh được tầm 5 phút nữa thôi vì còn nhiều đơn, anh chị tranh thủ ra nhận nhé!',
    ],
  ],
  DOCTOR: [
    [
      'Alo chào bạn, tôi gọi từ phòng khám về kết quả xét nghiệm của người nhà bạn sáng nay.',
      'Bác sĩ trưởng khoa yêu cầu bạn quay lại phòng khám ngay để được tư vấn và nhận đơn điều chỉnh trực tiếp.',
      'Bạn sắp xếp qua sớm trước giờ giao ca lúc 5 giờ chiều nhé.',
    ],
    [
      'Alo, phòng khám nha khoa xin thông báo lịch hẹn kiểm tra gấp của bạn đã được dời lên ngay bây giờ.',
      'Bác sĩ đang có mặt tại phòng khám và đợi bạn, bạn di chuyển qua ngay nhé.',
    ],
  ],
};

/**
 * Detect caller persona key from caller info, category, and scenario title
 */
export function detectCallerPersona(caller = {}, scenarioTitle = '', category = '') {
  const name = (caller.name || '').toLowerCase();
  const role = (caller.role || '').toLowerCase();
  const title = (scenarioTitle || '').toLowerCase();
  const cat = (category || '').toLowerCase();

  // 1. Mom / Female elder family
  if (
    name.includes('mẹ') ||
    name.includes('mama') ||
    name.includes('mom') ||
    name.includes('má') ||
    name.includes('mẹ yêu') ||
    role.includes('mẹ') ||
    title.includes('mẹ gọi')
  ) {
    return 'FAMILY_MOM';
  }

  // 2. Dad / Male elder family
  if (
    name.includes('bố') ||
    name.includes('ba') ||
    name.includes('bố yêu') ||
    name.includes('cha') ||
    name.includes('bác') ||
    name.includes('chú') ||
    role.includes('bố') ||
    role.includes('ba') ||
    title.includes('bố gọi')
  ) {
    return 'FAMILY_DAD';
  }

  // 3. Boss / Urgent workplace
  if (
    name.includes('sếp') ||
    name.includes('trưởng phòng') ||
    name.includes('giám đốc') ||
    name.includes('lead') ||
    name.includes('quản lý') ||
    role.includes('sếp') ||
    role.includes('trưởng phòng') ||
    role.includes('công sở') ||
    title.includes('sếp') ||
    title.includes('server') ||
    title.includes('công ty') ||
    cat.includes('công sở')
  ) {
    return 'BOSS';
  }

  // 4. Shipper / Delivery
  if (
    name.includes('ship') ||
    name.includes('giao hàng') ||
    role.includes('ship') ||
    role.includes('giao hàng') ||
    title.includes('ship') ||
    title.includes('giao hàng')
  ) {
    return 'SHIPPER';
  }

  // 5. Doctor / Medical
  if (
    name.includes('bác sĩ') ||
    name.includes('phòng khám') ||
    name.includes('bệnh viện') ||
    role.includes('bác sĩ') ||
    role.includes('y tế') ||
    title.includes('bác sĩ') ||
    title.includes('bệnh viện')
  ) {
    return 'DOCTOR';
  }

  // 6. Friend / Colleague
  if (
    name.includes('bạn') ||
    name.includes('thằng') ||
    name.includes('con') ||
    name.includes('đồng nghiệp') ||
    role.includes('bạn') ||
    cat.includes('bạn') ||
    title.includes('bạn') ||
    title.includes('xe hỏng')
  ) {
    return 'FRIEND';
  }

  // 7. General family category
  if (cat.includes('gia đình') || role.includes('gia đình')) {
    return 'FAMILY_MOM';
  }

  return 'DEFAULT';
}

/**
 * Get acoustic voice profile (pitch, rate) for a given caller
 */
export function getVoiceProfile(caller = {}, scenarioTitle = '', category = '') {
  const personaKey = detectCallerPersona(caller, scenarioTitle, category);
  return VOICE_PROFILES[personaKey] || VOICE_PROFILES.DEFAULT;
}

/**
 * Get a dynamic multi-turn dialogue matching caller persona
 * Avoids rigid repetitive templates by picking randomized variations.
 */
export function getDynamicRoleDialogue(caller = {}, scenarioTitle = '', category = '', existingDialogue = null) {
  // If the scenario already has custom detailed authored dialogue, preserve it
  if (
    existingDialogue &&
    Array.isArray(existingDialogue) &&
    existingDialogue.length >= 2 &&
    !isGenericPlaceholderDialogue(existingDialogue)
  ) {
    return existingDialogue;
  }

  const personaKey = detectCallerPersona(caller, scenarioTitle, category);
  const variations = ROLE_DIALOGUES[personaKey] || ROLE_DIALOGUES.BOSS;
  // Pick variation pseudo-randomly or deterministically based on timestamp/name
  const index = Math.floor(Math.random() * variations.length);
  return variations[index] || variations[0];
}

import { generateCallerDialogue } from './aiService';

/**
 * Fetch real Gemini AI roleplay dialogue if online, otherwise smoothly fallback
 * to rich persona variation matrix.
 */
export async function fetchAiOrFallbackDialogue({ caller = {}, scenarioTitle = '', category = '', existingDialogue = null }) {
  if (
    existingDialogue &&
    Array.isArray(existingDialogue) &&
    existingDialogue.length >= 2 &&
    !isGenericPlaceholderDialogue(existingDialogue)
  ) {
    return existingDialogue;
  }

  try {
    const res = await generateCallerDialogue({
      callerName: caller.name,
      callerRole: caller.role,
      scenarioTitle,
      category,
    });
    if (res?.dialogue && res.dialogue.length > 0) {
      return res.dialogue;
    }
  } catch (_) {
    // Offline, rate limit, or proxy timeout - fall back to dynamic role matrix
  }

  return getDynamicRoleDialogue(caller, scenarioTitle, category, existingDialogue);
}
function isGenericPlaceholderDialogue(dialogue) {
  if (!dialogue || !dialogue[0]) return true;
  const first = dialogue[0].toLowerCase();
  return (
    first.includes('alo em à, anh có việc gấp') ||
    first.includes('dự án đang có lỗi cần em về mở máy') ||
    first.includes('alo con à, về nhà gấp nhé')
  );
}

