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
  NEIGHBOR: {
    pitch: 0.93,
    rate: 0.95,
    persona: 'Tổ dân phố / Hàng xóm',
    description: 'Giọng trầm, điềm đạm, khẩn trương việc khu phố',
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
  NEIGHBOR: [
    [
      'Alo cháu à, chú Hùng tổ dân phố đây. Nhà cháu hình như đang bị rò nước chảy tràn ra ngoài hành lang này!',
      'Bác tổ trưởng với mấy cô chú đang đứng trước cửa nhà cháu kiểm tra đây, cháu thu xếp chạy về mở cửa gấp giúp chú nhé!',
      'Ừ nhanh cháu nhé, chú khóa tạm van tổng ngoài này rồi, về tới nơi gọi chú ngay!',
    ],
    [
      'Alo cháu ơi, chú gọi báo gấp là khu phố mình đang cắt điện sửa chữa đường dây đột xuất, nhà cháu có cắm thiết bị gì cần ngắt không?',
      'Cháu nhờ người nhà hoặc tranh thủ ghé qua rút điện tủ lạnh với máy tính nhé kẻo chập cháy.',
      'Ừ việc an toàn điện đóm gấp lắm, cháu sắp xếp sớm nhé!',
    ],
  ],
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
 * Priority:
 * 1. Specific relationship keywords in caller.role and caller.name
 * 2. Category / Generic roles
 * 3. Scenario title as supporting info only
 */
export function detectCallerPersona(caller = {}, scenarioTitle = '', category = '') {
  const callerObj = typeof caller === 'string' ? { name: caller } : (caller || {});

  // 0. Explicit caller profile persona priority
  if (callerObj?.persona) {
    const p = String(callerObj.persona).toUpperCase().trim();
    if (ROLE_DIALOGUES[p]) return p;
    if (p === 'NEIGHBOR') return 'NEIGHBOR';
    if (p === 'FRIEND_FEMALE' || p === 'FRIEND_MALE') return 'FRIEND';
  }

  const role = (callerObj.role || '').toLowerCase().trim();
  const name = (callerObj.name || (typeof caller === 'string' ? caller : '')).toLowerCase().trim();
  const title = (scenarioTitle || '').toLowerCase().trim();
  const cat = (category || '').toLowerCase().trim();

  // 1. Neighbor / Community acquaintance / Ward leader (Must NOT inherit Father!)
  if (
    role.includes('tổ dân phố') || role.includes('hàng xóm') || role.includes('khu phố') || role.includes('ban quản lý') ||
    name.includes('tổ dân phố') || name.includes('hàng xóm') || name.includes('chú hùng') || name.includes('tổ trưởng')
  ) {
    return 'NEIGHBOR';
  }

  // 2. Mom / Female elder family (check role and name)
  if (
    role.includes('mẹ') || role.includes('má') || role.includes('mama') || role.includes('mom') || role.includes('mẫu thân') ||
    name.includes('mẹ') || name.includes('má') || name.includes('mama') || name.includes('mom') || name.includes('mẹ yêu')
  ) {
    return 'FAMILY_MOM';
  }

  // 3. Dad / Male elder family (check role and name - ONLY Father keywords, not general uncles/neighbors!)
  if (
    role.includes('bố') || role.includes('ba') || role.includes('cha') || role.includes('phụ thân') ||
    name.includes('bố') || name.includes('ba') || name.includes('cha') || name.includes('bố yêu')
  ) {
    return 'FAMILY_DAD';
  }

  // 3. Boss / Workplace (check role and name)
  if (
    role.includes('sếp') || role.includes('trưởng phòng') || role.includes('giám đốc') || role.includes('lead') || role.includes('quản lý') || role.includes('công sở') || role.includes('boss') ||
    name.includes('sếp') || name.includes('trưởng phòng') || name.includes('giám đốc') || name.includes('lead') || name.includes('quản lý')
  ) {
    return 'BOSS';
  }

  // 4. Shipper / Delivery (check role and name)
  if (
    role.includes('ship') || role.includes('giao hàng') || role.includes('bưu tá') || role.includes('vận chuyển') ||
    name.includes('ship') || name.includes('giao hàng') || name.includes('bưu tá')
  ) {
    return 'SHIPPER';
  }

  // 5. Doctor / Medical (check role and name)
  if (
    role.includes('bác sĩ') || role.includes('y tế') || role.includes('bệnh viện') || role.includes('phòng khám') || role.includes('nha khoa') || role.includes('y tá') ||
    name.includes('bác sĩ') || name.includes('phòng khám') || name.includes('bệnh viện')
  ) {
    return 'DOCTOR';
  }

  // 6. Friend / Colleague (check role and name)
  if (
    role.includes('bạn') || role.includes('đồng nghiệp') || role.includes('bồ') || role.includes('tri kỷ') ||
    name.includes('bạn') || name.includes('thằng') || name.includes('đồng nghiệp') || name.includes('bé yêu')
  ) {
    return 'FRIEND';
  }

  // 7. Generic role / category fallback
  if (role.includes('gia đình') || cat.includes('gia đình')) {
    return 'FAMILY_MOM';
  }
  if (cat.includes('công sở')) return 'BOSS';
  if (cat.includes('bạn')) return 'FRIEND';
  if (cat.includes('y tế')) return 'DOCTOR';

  // 8. Scenario Title as LAST resort only
  if (title) {
    if (title.includes('mẹ')) return 'FAMILY_MOM';
    if (title.includes('bố') || title.includes('ba')) return 'FAMILY_DAD';
    if (title.includes('sếp') || title.includes('server') || title.includes('công ty')) return 'BOSS';
    if (title.includes('ship') || title.includes('giao hàng')) return 'SHIPPER';
    if (title.includes('bác sĩ') || title.includes('phòng khám') || title.includes('bệnh viện')) return 'DOCTOR';
    if (title.includes('bạn') || title.includes('xe hỏng')) return 'FRIEND';
    if (title.includes('gia đình') || title.includes('nhà')) return 'FAMILY_MOM';
  }

  return 'DEFAULT';
}

/**
 * Filter out user responses from a dialogue script so that TTS speaks ONLY caller lines
 */
export function filterCallerOnlyLines(dialogue) {
  if (!Array.isArray(dialogue)) return [];
  return dialogue.filter(line => {
    if (!line || typeof line !== 'string') return false;
    const l = line.toLowerCase().trim();
    if (
      l.startsWith('dạ vâng') ||
      l.startsWith('vâng anh') ||
      l.startsWith('vâng mẹ') ||
      l.startsWith('vâng sếp') ||
      l.startsWith('vâng bố') ||
      l.startsWith('dạ con') ||
      l.startsWith('dạ em') ||
      l.startsWith('con chào mọi người') ||
      l.startsWith('em chào mọi người') ||
      l.startsWith('mày đang ở đoạn nào') ||
      l.startsWith('rồi rồi bình tĩnh')
    ) {
      return false;
    }
    return true;
  });
}

/**
 * Check if a dialogue snippet conflicts with the selected caller persona
 */
export function dialogueMatchesPersona(dialogue, personaKey) {
  if (!dialogue || !dialogue[0]) return false;
  const first = String(dialogue[0]).toLowerCase();
  if (personaKey === 'FAMILY_MOM' || personaKey === 'FAMILY_DAD') {
    if (
      first.includes('server') ||
      first.includes('sếp') ||
      first.includes('khách hàng phản ánh') ||
      first.includes('shipper') ||
      first.includes('bưu phẩm') ||
      first.includes('phòng khám')
    ) {
      return false;
    }
  }
  if (personaKey === 'BOSS') {
    if (
      first.includes('mẹ') ||
      first.includes('con à') ||
      first.includes('bố đây') ||
      first.includes('shipper') ||
      first.includes('bác sĩ') ||
      first.includes('xe tao bị')
    ) {
      return false;
    }
  }
  if (personaKey === 'SHIPPER') {
    if (
      first.includes('server') ||
      first.includes('mẹ') ||
      first.includes('con à') ||
      first.includes('bố đây') ||
      first.includes('bác sĩ')
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Select best Vietnamese voice from device voices matching caller persona
 */
export function selectVietnameseVoice(availableVoices = [], personaKey = 'DEFAULT') {
  if (!Array.isArray(availableVoices) || availableVoices.length === 0) return null;
  const viVoices = availableVoices.filter(v => {
    const lang = (v?.language || '').toLowerCase();
    return lang.includes('vi') || lang.includes('vie');
  });
  if (viVoices.length === 0) return null;

  const isFemale = personaKey === 'FAMILY_MOM';
  const isMale = personaKey === 'FAMILY_DAD' || personaKey === 'BOSS';

  if (isFemale) {
    const femaleVoice = viVoices.find(v => {
      const name = (v?.name || v?.identifier || '').toLowerCase();
      return name.includes('female') || name.includes('linh') || name.includes('mai') || name.includes('vic');
    });
    if (femaleVoice) return femaleVoice.identifier;
  }

  if (isMale) {
    const maleVoice = viVoices.find(v => {
      const name = (v?.name || v?.identifier || '').toLowerCase();
      return name.includes('male') || name.includes('nam') || name.includes('minh') || name.includes('vie');
    });
    if (maleVoice) return maleVoice.identifier;
  }

  return viVoices[0].identifier;
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
  const personaKey = detectCallerPersona(caller, scenarioTitle, category);

  // If existing dialogue is present, clean it and verify it matches the caller persona
  if (
    existingDialogue &&
    Array.isArray(existingDialogue) &&
    existingDialogue.length >= 1 &&
    !isGenericPlaceholderDialogue(existingDialogue) &&
    dialogueMatchesPersona(existingDialogue, personaKey)
  ) {
    const callerOnly = filterCallerOnlyLines(existingDialogue);
    if (callerOnly.length > 0) return callerOnly;
  }

  const variations = ROLE_DIALOGUES[personaKey] || ROLE_DIALOGUES.BOSS;
  const index = Math.floor(Math.random() * variations.length);
  return variations[index] || variations[0];
}

/**
 * Get single opening greeting for caller when call starts
 */
export function getCallerOpeningGreeting({ caller = {}, scenarioTitle = '', category = '', dialogueList = [] }) {
  const personaKey = detectCallerPersona(caller, scenarioTitle, category);
  if (
    Array.isArray(dialogueList) &&
    dialogueList.length > 0 &&
    !isGenericPlaceholderDialogue(dialogueList) &&
    dialogueMatchesPersona(dialogueList, personaKey)
  ) {
    const callerOnly = filterCallerOnlyLines(dialogueList);
    if (callerOnly.length > 0) return callerOnly[0];
  }
  const roleLines = ROLE_DIALOGUES[personaKey] || ROLE_DIALOGUES.BOSS;
  return roleLines[0]?.[0] || 'Alo, có việc gấp cần trao đổi ngay!';
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
  const first = String(dialogue[0]).toLowerCase();
  return (
    first.includes('alo em à, anh có việc gấp') ||
    first.includes('dự án đang có lỗi cần em về mở máy') ||
    first.includes('alo con à, về nhà gấp nhé') ||
    first.includes('có việc gấp cần xử lý ngay bây giờ')
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

  if (persona === 'NEIGHBOR') {
    if (isAgreeingOrLeaving) return 'Ừ cháu về nhanh giúp chú nhé, chú với bà con đang đứng đợi trước cửa nhà cháu đây!';
    if (isBusyOrReluctant) return 'Nước tràn sang nhà bên cạnh rồi đấy cháu ơi, việc gấp lắm, cháu thu xếp về xử lý liền đi!';
    if (isListeningOrAsking) return 'Chú Hùng tổ dân phố đây, nhà cháu có sự cố kỹ thuật cần người nhà về mở cửa kiểm tra gấp nhé!';
    return 'Cháu tranh thủ chạy về mở cửa kiểm tra gấp giúp chú và ban quản lý khu phố nhé!';
  }

  if (persona === 'DOCTOR') {
    return 'Bác sĩ trực tiếp dặn bạn cần có mặt để trao đổi kết quả, bạn di chuyển qua phòng khám ngay nhé.';
  }

  // Fallback to next line in preset dialogue if available and matches caller persona
  if (
    Array.isArray(dialogueList) &&
    dialogueMatchesPersona(dialogueList, persona)
  ) {
    const callerLines = filterCallerOnlyLines(dialogueList);
    if (callerLines.length > stepIndex) {
      return callerLines[stepIndex];
    }
  }

  return 'Có việc khẩn cấp cần giải quyết ngay bây giờ, bạn thu xếp rời khỏi đó rồi qua hỗ trợ liền nhé!';
}

// 5 Dedicated Gemini Voice Profiles for High-Naturalness Vietnamese Roleplay
export const GEMINI_VOICE_PROFILES = [
  {
    id: 'auto',
    name: 'auto',
    geminiVoice: 'Kore',
    label: 'Tự động (Theo vai trò & giới tính)',
    description: 'Tự động chọn giọng chuẩn nhất theo thông tin người gọi',
    previewText: 'AlibiHub sẽ tự động chọn giọng nói chuẩn xác theo vai trò người gọi.',
  },
  {
    id: 'kore',
    name: 'Kore',
    geminiVoice: 'Kore',
    label: 'Kore (Nữ - Ấm áp)',
    description: 'Giọng nữ ấm áp, tình cảm, quen thuộc (Mẹ, Người thân, Chị em)',
    role: 'mother',
    gender: 'female',
    previewText: 'Alo, tôi đang gọi cho bạn đây, có việc gấp cần trao đổi ngay!',
  },
  {
    id: 'aoede',
    name: 'Aoede',
    geminiVoice: 'Aoede',
    label: 'Aoede (Nữ - Năng động)',
    description: 'Giọng nữ trẻ trung, trong trẻo, hoạt bát (Bạn thân Linh, Shipper, Đồng nghiệp nữ)',
    role: 'friend_female',
    gender: 'female',
    previewText: 'Alo, tôi đang gọi cho bạn đây, có việc gấp cần trao đổi ngay!',
  },
  {
    id: 'charon',
    name: 'Charon',
    geminiVoice: 'Charon',
    label: 'Charon (Nam - Trầm ấm)',
    description: 'Giọng nam trưởng thành, điềm đạm, nghiêm nghị (Bố, Chú Hùng, Người lớn tuổi)',
    role: 'father',
    gender: 'male',
    previewText: 'Alo, tôi đang gọi cho bạn đây, có việc gấp cần trao đổi ngay!',
  },
  {
    id: 'fenrir',
    name: 'Fenrir',
    geminiVoice: 'Fenrir',
    label: 'Fenrir (Nam - Quyết đoán)',
    description: 'Giọng nam công sở dứt khoát, chuyên nghiệp (Sếp Hoàng, Quản lý, Đối tác)',
    role: 'boss',
    gender: 'male',
    previewText: 'Alo, tôi đang gọi cho bạn đây, có việc gấp cần trao đổi ngay!',
  },
  {
    id: 'puck',
    name: 'Puck',
    geminiVoice: 'Puck',
    label: 'Puck (Nam - Trẻ trung)',
    description: 'Giọng nam tự nhiên, xuề xòa, thân mật (Bạn bè nam, Đồng nghiệp trẻ)',
    role: 'friend_male',
    gender: 'male',
    previewText: 'Alo, tôi đang gọi cho bạn đây, có việc gấp cần trao đổi ngay!',
  },
];

export function getGeminiVoiceForCaller(caller = {}, scenarioTitle = '', category = '', manualVoiceId = 'auto') {
  // 1. Explicit voiceId saved in caller profile
  if (caller?.voiceId && caller.voiceId !== 'auto') {
    const found = GEMINI_VOICE_PROFILES.find(
      (p) => p.id === caller.voiceId.toLowerCase() || p.name.toLowerCase() === caller.voiceId.toLowerCase()
    );
    if (found && found.id !== 'auto') return found;
  }

  // 2. Manual voice override passed from Setup Screen
  if (manualVoiceId && manualVoiceId !== 'auto') {
    const found = GEMINI_VOICE_PROFILES.find(
      (p) => p.id === manualVoiceId.toLowerCase() || p.name.toLowerCase() === manualVoiceId.toLowerCase()
    );
    if (found && found.id !== 'auto') return found;
  }

  // 3. Gender preference in caller profile
  if (caller?.gender === 'female') {
    const pKey = detectCallerPersona(caller, scenarioTitle, category);
    if (pKey === 'FAMILY_MOM') return GEMINI_VOICE_PROFILES.find((p) => p.id === 'kore');
    return GEMINI_VOICE_PROFILES.find((p) => p.id === 'aoede');
  }
  if (caller?.gender === 'male') {
    const pKey = detectCallerPersona(caller, scenarioTitle, category);
    if (pKey === 'BOSS') return GEMINI_VOICE_PROFILES.find((p) => p.id === 'fenrir');
    if (pKey === 'FRIEND') return GEMINI_VOICE_PROFILES.find((p) => p.id === 'puck');
    return GEMINI_VOICE_PROFILES.find((p) => p.id === 'charon');
  }

  // 4. Persona-driven fallback
  const personaKey = detectCallerPersona(caller, scenarioTitle, category);
  switch (personaKey) {
    case 'FAMILY_MOM':
      return GEMINI_VOICE_PROFILES.find((p) => p.id === 'kore');
    case 'FAMILY_DAD':
    case 'NEIGHBOR':
      return GEMINI_VOICE_PROFILES.find((p) => p.id === 'charon');
    case 'BOSS':
      return GEMINI_VOICE_PROFILES.find((p) => p.id === 'fenrir');
    case 'SHIPPER':
      return GEMINI_VOICE_PROFILES.find((p) => p.id === 'aoede');
    case 'FRIEND': {
      const name = (caller?.name || '').toLowerCase();
      if (/(linh|hoa|mai|nhung|trang|hương|ngọc|hà|thảo|thủy|quỳnh|lan|phương|anh thư|gái|nữ)/i.test(name)) {
        return GEMINI_VOICE_PROFILES.find((p) => p.id === 'aoede');
      }
      return GEMINI_VOICE_PROFILES.find((p) => p.id === 'puck');
    }
    default: {
      const textToScan = `${caller?.role || ''} ${caller?.name || ''}`.toLowerCase();
      if (/(bố|ba|cha|chú|bác trai|ông|nam)/i.test(textToScan)) {
        return GEMINI_VOICE_PROFILES.find((p) => p.id === 'charon');
      }
      return GEMINI_VOICE_PROFILES.find((p) => p.id === 'kore');
    }
  }
}


