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

import { generateCallerDialogue } from './aiService.js';

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

/**
 * Robust offline conversational reply generator matching caller persona and user utterance
 */
export function generateOfflineCallReply({
  caller = {},
  scenarioTitle = '',
  category = '',
  userUtterance = '',
  dialogueList = [],
  stepIndex = 1,
}) {
  const persona = detectCallerPersona(caller, scenarioTitle, category);
  const u = (userUtterance || '').toLowerCase().trim();

  const isListeningOrAsking =
    u.includes('nghe') ||
    u.includes('vâng') ||
    u.includes('dạ') ||
    u.includes('sao thế') ||
    u.includes('việc gì') ||
    u.includes('gì đấy') ||
    u.includes('alo');
  const isBusyOrReluctant =
    u.includes('bận') ||
    u.includes('không được') ||
    u.includes('chưa') ||
    u.includes('đang ở') ||
    u.includes('họp');
  const isAgreeingOrLeaving =
    u.includes('về ngay') ||
    u.includes('qua ngay') ||
    u.includes('ok') ||
    u.includes('được rồi') ||
    u.includes('tới liền') ||
    u.includes('đang chạy');

  if (persona === 'FAMILY_MOM') {
    if (isAgreeingOrLeaving) return 'Ừ nhanh con nhé, mẹ đang đợi ở nhà, đi đường cẩn thận nha con!';
    if (isBusyOrReluctant) return 'Việc gấp của gia đình mà con, không để muộn được đâu, con xin phép về liền đi!';
    if (isListeningOrAsking) return 'Ở nhà vừa phát sinh việc đột xuất gấp lắm, con thu xếp về ngay mở cửa giúp mẹ nhé!';
    return 'Con chào mọi người một câu rồi chạy về gấp giúp mẹ nha, mẹ đợi ở nhà!';
  }

  if (persona === 'FAMILY_DAD') {
    if (isAgreeingOrLeaving) return 'Ừ, đi cẩn thận nhé, về tới nơi gọi bố ngay.';
    if (isBusyOrReluctant) return 'Việc gia đình quan trọng đấy con, con sắp xếp về xử lý sớm giúp bố.';
    if (isListeningOrAsking) return 'Bố đây, việc giấy tờ gia đình cần giải quyết gấp ngay bây giờ, con chạy về nhà nhé.';
    return 'Bố đang đợi ở nhà, con sắp xếp rồi chạy về ngay nhé.';
  }

  if (persona === 'BOSS') {
    if (isAgreeingOrLeaving) return 'Xử lý khẩn trương nhé em, xong việc báo lại anh trên Slack trong 15 phút tới!';
    if (isBusyOrReluctant) return 'Việc này ảnh hưởng trực tiếp đến hợp đồng lớn đấy, em tìm chỗ mở máy hoặc về công ty gấp!';
    if (isListeningOrAsking) return 'Hệ thống server đang phát sinh lỗi nghiêm trọng, khách giục gấp, em mở máy kiểm tra ngay!';
    return 'Rất gấp đấy em, tập trung giải quyết dứt điểm sự cố này giúp anh ngay nhé!';
  }

  if (persona === 'FRIEND') {
    if (isAgreeingOrLeaving) return 'Nhanh nhé bạn hiền ơi, tao gửi định vị rồi đấy, tới nơi ới tao liền nha!';
    if (isBusyOrReluctant) return 'Tao đứng ở đoạn đường vắng này sốt ruột quá, mày té ra đón tao một lát thôi mà!';
    if (isListeningOrAsking) return 'Xe tao bị hỏng giữa đường rồi, dắt bộ mệt quá, mày chạy qua cứu tao với!';
    return 'Cứu tao phát nha bồ ơi, đến đón tao nhanh kẻo muộn mất!';
  }

  if (persona === 'SHIPPER') {
    if (isAgreeingOrLeaving) return 'Dạ vâng em đang đứng ngay cửa chính đây, anh chị xuống gọi em nhé!';
    if (isBusyOrReluctant) return 'Bảo vệ họ không nhận đồ này đâu ạ, anh chị tranh thủ xuống 2 phút lấy giùm em với nha!';
    if (isListeningOrAsking) return 'Dạ em shipper đây ạ, em đang đứng dưới sảnh, anh chị xuống nhận hàng giúp em với!';
    return 'Anh chị tranh thủ xuống nhận sớm giúp em để em kịp giao các đơn tiếp theo nha!';
  }

  if (persona === 'DOCTOR') {
    return 'Bác sĩ trực tiếp dặn bạn cần có mặt để trao đổi kết quả, bạn di chuyển qua phòng khám ngay nhé.';
  }

  // Fallback to next line in preset dialogue if available
  if (Array.isArray(dialogueList) && dialogueList.length > stepIndex) {
    return dialogueList[stepIndex];
  }

  return 'Có việc khẩn cấp cần giải quyết ngay bây giờ, bạn thu xếp rời khỏi đó rồi qua hỗ trợ liền nhé!';
}

