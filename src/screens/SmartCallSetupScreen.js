import { phone, delay, text, dialogue as validateDialogue } from '../utils/validation';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/colors';
import Header from '../components/Header';
import AudioPlayerControl from '../components/AudioPlayerControl';
import { AMBIENT_PRESETS, audioService } from '../services/audioService';
import {
  getDynamicRoleDialogue,
  GEMINI_VOICE_PROFILES,
  getGeminiVoiceForCaller,
} from '../services/dialogueService';
import { generateTtsAudio } from '../services/aiService';

export default function SmartCallSetupScreen({
  callers = [],
  initialConfig = null,
  onLaunchCall,
  onScheduleCall,
  onSaveTemplate,
  onBack,
}) {
  // Prepopulate from initialConfig or default
  const defaultCaller = callers[0] || {
    name: 'Mẹ Yêu',
    role: 'Gia đình',
    phoneNumber: '0912 345 678',
  };

  const [selectedCallerId, setSelectedCallerId] = useState(initialConfig?.callerId || defaultCaller.id || 'custom');
  const [callerName, setCallerName] = useState(initialConfig?.callerName || initialConfig?.caller?.name || defaultCaller.name);
  const [callerPhone, setCallerPhone] = useState(initialConfig?.callerPhone || initialConfig?.caller?.phoneNumber || defaultCaller.phoneNumber);
  const [callerRole, setCallerRole] = useState(initialConfig?.callerRole || initialConfig?.caller?.role || defaultCaller.role);

  const [title, setTitle] = useState(initialConfig?.title || 'Cuộc gọi của tôi');
  const [message, setMessage] = useState(initialConfig?.suggestedMessage || '');
  const [avatarUrl, setAvatarUrl] = useState(initialConfig?.callerAvatar || '');
  const [delaySeconds, setDelaySeconds] = useState(initialConfig?.delaySeconds ?? 10);
  const [clockTime, setClockTime] = useState('');
  const [customDelayInput, setCustomDelayInput] = useState('');
  const [isCustomDelay, setIsCustomDelay] = useState(false);

  const [ambientSound, setAmbientSound] = useState(initialConfig?.ambientSound || 'office');
  const [selectedVoiceId, setSelectedVoiceId] = useState(initialConfig?.voiceId || 'auto');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [voiceVolume, setVoiceVolume] = useState(initialConfig?.voiceVolume ?? 1.0);
  const [ambientVolume, setAmbientVolume] = useState(initialConfig?.ambientVolume ?? 0.25);
  const [callAppearance, setCallAppearance] = useState(
    initialConfig?.callAppearance || 'android'
  );

  const appearanceOptions = [
    { id: 'android', label: 'Android', icon: '🤖' },
    { id: 'ios', label: 'iOS', icon: '🍏' },
    { id: 'zalo', label: 'Zalo', icon: '💬' },
    { id: 'messenger', label: 'Messenger', icon: '⚡' },
  ];

  const [dialogue, setDialogue] = useState(
    initialConfig?.dialogue && initialConfig.dialogue.length > 0
      ? initialConfig.dialogue
      : getDynamicRoleDialogue(defaultCaller, initialConfig?.title || 'Cuộc gọi của tôi', defaultCaller.role)
  );
  const [newDialogueLine, setNewDialogueLine] = useState('');

  const scheduleOptions = [
    { label: 'Ngay tức thì', seconds: 0 },
    { label: '10 giây', seconds: 10 },
    { label: '30 giây', seconds: 30 },
    { label: '1 phút', seconds: 60 },
    { label: '5 phút', seconds: 300 },
  ];

  const handleSelectCaller = (c) => {
    setSelectedCallerId(c.id);
    setCallerName(c.name);
    setCallerPhone(c.phoneNumber);
    setCallerRole(c.role);
    setAvatarUrl(c.avatarUrl || '');

    // If dialogue was auto-generated or default, update dialogue to match the selected caller persona
    if (!initialConfig?.dialogue || initialConfig?.dialogue?.length === 0) {
      setDialogue(getDynamicRoleDialogue(c, title, c.role));
    }
  };

  const handleAddDialogueLine = () => {
    if (!newDialogueLine.trim()) return;
    setDialogue([...dialogue, newDialogueLine.trim()]);
    setNewDialogueLine('');
  };

  const handleRemoveDialogueLine = (index) => {
    if (dialogue.length <= 1) {
      Alert.alert('Thông báo', 'Cần giữ ít nhất 1 câu thoại trong kịch bản.');
      return;
    }
    setDialogue(dialogue.filter((_, idx) => idx !== index));
  };

  const validateAndBuildPayload = () => {
    if (!callerName.trim()) {
      Alert.alert('Lỗi dữ liệu', 'Vui lòng nhập tên người gọi.');
      return null;
    }
    if (!callerPhone.trim()) {
      Alert.alert('Lỗi dữ liệu', 'Vui lòng nhập số điện thoại hiển thị.');
      return null;
    }

    let effectiveDelay;
    try {
      effectiveDelay = clockTime.trim() ? 0 : delay(isCustomDelay ? customDelayInput : delaySeconds);
      if (clockTime.trim()) {
        if (!/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(clockTime.trim())) throw new Error('Giờ hẹn cần có dạng HH:mm, ví dụ 21:30.');
        const [h,m] = clockTime.split(':').map(Number), target = new Date(); target.setHours(h,m,0,0);
        if (target.getTime() <= Date.now()) throw new Error('Vui lòng chọn thời điểm còn ở phía trước trong hôm nay.');
        effectiveDelay = delay(Math.ceil((target.getTime()-Date.now())/1000));
      }
      phone(callerPhone); text(callerName, 'Tên người gọi', 1, 80); text(title, 'Tiêu đề', 1, 120); validateDialogue(dialogue);
      if (avatarUrl && !/^https:\/\//.test(avatarUrl)) throw new Error('Ảnh đại diện phải dùng URL HTTPS.');
    } catch (err) { Alert.alert('Dữ liệu chưa hợp lệ', err.message); return null; }

    return {
      ...(initialConfig || {}),
      caller: {
        name: callerName.trim(),
        avatarUrl,
        phoneNumber: callerPhone.trim(),
        role: callerRole.trim() || 'Người gọi',
      },
      delaySeconds: effectiveDelay,
      ambientSound,
      ambientVolume,
      voiceVolume,
      dialogue,
      title: title.trim(),
      suggestedMessage: message.trim(),
      callAppearance,
      voiceId: selectedVoiceId,
      id: initialConfig?.isCustom ? initialConfig.id : undefined,
    };
  };

  const handlePreviewVoice = async () => {
    if (previewLoading) return;
    setPreviewLoading(true);

    try {
      const voiceProfile = getGeminiVoiceForCaller(
        { name: callerName, role: callerRole },
        title,
        callerRole,
        selectedVoiceId
      );
      const targetVoice = voiceProfile?.geminiVoice || 'Kore';
      const sampleText = voiceProfile?.previewText || 'Alo, tôi đang gọi cho bạn đây!';

      const res = await generateTtsAudio({
        text: sampleText,
        voiceName: targetVoice,
        callerRole: callerRole || 'Người quen',
        callerName: callerName || 'Người gọi',
        isPreview: true,
      });

      if (res?.audioBase64) {
        audioService.speakDialogueLine(sampleText, () => setPreviewLoading(false), null, res.audioBase64);
      } else {
        audioService.speakDialogueLine(sampleText, () => setPreviewLoading(false), voiceProfile);
      }
    } catch (_) {
      // Graceful fallback to device speech
      audioService.speakDialogueLine('Alo, tôi đang gọi cho bạn đây!', () => setPreviewLoading(false));
    } finally {
      setTimeout(() => setPreviewLoading(false), 2500);
    }
  };

  const handleLaunch = () => {
    const payload = validateAndBuildPayload();
    if (!payload) return;

    if (payload.delaySeconds === 0) {
      onLaunchCall(payload);
    } else {
      onScheduleCall(payload);
    }
  };

  const handleSaveAsTemplate = async () => {
    const payload = validateAndBuildPayload();
    if (!payload) return;
    try { await onSaveTemplate({
      ...payload,
      title: payload.title,
      category: initialConfig?.category || 'Cá nhân',
    });
    Alert.alert('Thành công', 'Đã lưu mẫu cuộc gọi vào Kho Alibi Vault.');
    } catch (err) { Alert.alert('Không thể lưu', err.message); }
  };

  return (
    <View style={styles.safeArea}>
      <Header
        title="Thiết lập Cuộc gọi"
        subtitle="Mô phỏng cuộc gọi thông minh & Âm thanh bối cảnh"
        rightAction={onBack}
        rightLabel="Đóng"
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Scenario metadata */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TỔNG QUAN KỊCH BẢN</Text>
          <View style={styles.formBox}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Tên kịch bản:</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                maxLength={120}
                placeholder="VD: Cuộc gọi của tôi"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Tin nhắn kết thúc / ghi chú:</Text>
              <TextInput
                style={styles.input}
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={1500}
                placeholder="Lời xin lỗi hoặc tin nhắn gửi sau khi thoát..."
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Ảnh đại diện (URL HTTPS, tùy chọn):</Text>
              <TextInput
                style={styles.input}
                value={avatarUrl}
                onChangeText={setAvatarUrl}
                autoCapitalize="none"
                maxLength={1000}
                placeholder="https://..."
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>
        </View>
        {/* Caller Profile Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. CHỌN HOẶC TẠO NGƯỜI GỌI (CALLER)</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.callersScroll}>
            {callers.map((c) => {
              const isSelected = selectedCallerId === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.callerChip, isSelected && styles.callerChipSelected]}
                  onPress={() => handleSelectCaller(c)}
                >
                  <View style={[styles.chipAvatar, { backgroundColor: c.avatarBg || colors.primary }]}>
                    <Text style={styles.chipAvatarText}>
                      {c.initials || c.name.substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[styles.chipName, isSelected && styles.chipNameSelected]} numberOfLines={1}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Caller Details Input */}
          <View style={styles.formBox}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Tên người gọi:</Text>
              <TextInput
                style={styles.input}
                value={callerName}
                onChangeText={(text) => {
                  setCallerName(text);
                  setSelectedCallerId('custom');
                }}
                placeholder="VD: Sếp Hoàng, Mẹ, Shipper..."
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Số điện thoại:</Text>
              <TextInput
                style={styles.input}
                value={callerPhone}
                onChangeText={(text) => {
                  setCallerPhone(text);
                  setSelectedCallerId('custom');
                }}
                placeholder="VD: 0903 888 999"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Vai trò / Mối quan hệ:</Text>
              <TextInput
                style={styles.input}
                value={callerRole}
                onChangeText={(text) => {
                  setCallerRole(text);
                  setSelectedCallerId('custom');
                }}
                placeholder="VD: Công sở, Việc gấp, Gia đình..."
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>
        </View>

        {/* 2. Call Appearance Style Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. KIỂU GIAO DIỆN CUỘC GỌI (CALL STYLE)</Text>
          <View style={styles.appearanceGrid}>
            {appearanceOptions.map((opt) => {
              const isSelected = callAppearance === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.appearanceTab, isSelected && styles.appearanceTabSelected]}
                  onPress={() => setCallAppearance(opt.id)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.appearanceTabIcon}>{opt.icon}</Text>
                  <Text style={[styles.appearanceTabText, isSelected && styles.appearanceTabTextSelected]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Schedule Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. THỜI GIAN ĐỔ CHUÔNG (SCHEDULE)</Text>
<Text style={styles.fieldLabel}>Hoặc chọn giờ hôm nay (HH:mm, để trống để dùng khoảng chờ)</Text>
          <TextInput style={styles.input} value={clockTime} onChangeText={setClockTime} placeholder="21:30" placeholderTextColor={colors.textMuted} maxLength={5} />
          <View style={styles.scheduleGrid}>
            {scheduleOptions.map((opt) => {
              const isSelected = !isCustomDelay && delaySeconds === opt.seconds;
              return (
                <TouchableOpacity
                  key={`sec_${opt.seconds}`}
                  style={[styles.scheduleBtn, isSelected && styles.scheduleBtnSelected]}
                  onPress={() => {
                    setClockTime('');
                    setIsCustomDelay(false);
                    setDelaySeconds(opt.seconds);
                  }}
                >
                  <Text style={[styles.scheduleBtnText, isSelected && styles.scheduleBtnTextSelected]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={[styles.scheduleBtn, isCustomDelay && styles.scheduleBtnSelected]}
              onPress={() => setIsCustomDelay(true)}
            >
              <Text style={[styles.scheduleBtnText, isCustomDelay && styles.scheduleBtnTextSelected]}>
                Tùy chỉnh giây
              </Text>
            </TouchableOpacity>
          </View>

          {isCustomDelay ? (
            <View style={styles.customDelayBox}>
              <Text style={styles.customDelayLabel}>Nhập số giây muốn hẹn:</Text>
              <TextInput
                style={styles.customDelayInput}
                value={customDelayInput}
                onChangeText={setCustomDelayInput}
                placeholder="VD: 45 (giây)"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </View>
          ) : null}
        </View>

        {/* 4. Ambient Sound Selection (Permanently visible) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. ÂM THANH BỐI CẢNH (AMBIENT SOUND)</Text>
          <View style={styles.ambientList}>
            {AMBIENT_PRESETS.map((preset) => {
              const isSelected = ambientSound === preset.id;
              return (
                <TouchableOpacity
                  key={preset.id}
                  style={[styles.ambientItem, isSelected && styles.ambientItemSelected]}
                  onPress={() => setAmbientSound(preset.id)}
                >
                  <View style={styles.ambientInfo}>
                    <Text style={[styles.ambientLabel, isSelected && styles.ambientLabelSelected]}>
                      {preset.label}
                    </Text>
                    <Text style={styles.ambientDesc}>{preset.description}</Text>
                  </View>
                  <Text style={styles.checkIcon}>{isSelected ? '✓' : '○'}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Audio Volume Mixing (Independent sliders) */}
        <AudioPlayerControl
          voiceVolume={voiceVolume}
          ambientVolume={ambientVolume}
          onVoiceVolumeChange={setVoiceVolume}
          onAmbientVolumeChange={setAmbientVolume}
        />

        {/* 5. Natural Gemini Voice Profiles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. GIỌNG NÓI AI GEMINI (GEMINI AI VOICES)</Text>
          <Text style={styles.sectionSubtitle}>
            Chọn giọng đọc tiếng Việt tự nhiên phát trực tiếp từ máy chủ Gemini:
          </Text>

          <View style={styles.voiceList}>
            {GEMINI_VOICE_PROFILES.map((vp) => {
              const isSelected = selectedVoiceId === vp.id;
              return (
                <TouchableOpacity
                  key={vp.id}
                  style={[styles.voiceItem, isSelected && styles.voiceItemSelected]}
                  onPress={() => setSelectedVoiceId(vp.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.voiceInfo}>
                    <Text style={[styles.voiceLabel, isSelected && styles.voiceLabelSelected]}>
                      {vp.label}
                    </Text>
                    <Text style={styles.voiceDesc}>{vp.description}</Text>
                  </View>
                  <Text style={styles.checkIcon}>{isSelected ? '✓' : '○'}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Voice Preview Button */}
          <TouchableOpacity
            style={styles.voicePreviewBtn}
            onPress={handlePreviewVoice}
            disabled={previewLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.voicePreviewBtnText}>
              {previewLoading ? '⏳ Đang phát giọng mẫu...' : '🔊 Nghe thử giọng nói AI'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 6. Multi-step Voice Dialogue */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. ĐOẠN THOẠI KỊCH BẢN (MULTI-STEP DIALOGUE)</Text>
          <Text style={styles.sectionSubtitle}>
            Lời thoại sẽ phát theo từng câu khi bạn nhận cuộc gọi mô phỏng:
          </Text>

          {dialogue.map((line, idx) => (
            <View key={`line_${idx}`} style={styles.dialogueRow}>
              <View style={styles.stepNumCircle}>
                <Text style={styles.stepNumText}>{idx + 1}</Text>
              </View>
              <TextInput style={[styles.dialogueLineText, { flex: 1 }]} value={line} onChangeText={value => setDialogue(dialogue.map((item, i) => i === idx ? value : item))} multiline maxLength={500} />
              <TouchableOpacity
                style={styles.removeLineBtn}
                onPress={() => handleRemoveDialogueLine(idx)}
              >
                <Text style={styles.removeLineText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Add new line */}
          <View style={styles.addLineBox}>
            <TextInput
              style={styles.addLineInput}
              value={newDialogueLine}
              onChangeText={setNewDialogueLine}
              placeholder="Thêm câu thoại mới..."
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity style={styles.addLineBtn} onPress={handleAddDialogueLine}>
              <Text style={styles.addLineBtnText}>+ Thêm</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.primaryLaunchBtn}
            onPress={handleLaunch}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryLaunchBtnText}>
              {clockTime ? `⏱️ HẸN GIỜ HÔM NAY ${clockTime}` : delaySeconds === 0 && !isCustomDelay
                ? '📞 GỌI MÔ PHỎNG NGAY'
                : `⏱️ HẸN GIỜ ĐỔ CHUÔNG (${isCustomDelay ? customDelayInput || 0 : delaySeconds}s)`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveTemplateBtn}
            onPress={handleSaveAsTemplate}
            activeOpacity={0.8}
          >
            <Text style={styles.saveTemplateBtnText}>💾 Lưu vào Kho Kịch Bản (Vault)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl * 2,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    color: colors.primary,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  advancedToggleBar: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  advancedToggleTextWrap: {
    flex: 1,
  },
  advancedToggleTitle: {
    color: colors.primary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  advancedToggleSub: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs - 1,
    marginTop: 2,
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    marginBottom: spacing.sm,
  },
  callersScroll: {
    marginBottom: spacing.md,
  },
  callerChip: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.pill,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  callerChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '25',
  },
  chipAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  chipAvatarText: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.xs - 2,
    fontWeight: typography.fontWeights.bold,
  },
  chipName: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
  },
  chipNameSelected: {
    color: colors.textPrimary,
    fontWeight: typography.fontWeights.bold,
  },
  appearanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  appearanceTab: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  appearanceTabSelected: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  appearanceTabIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  appearanceTabText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs - 1,
    fontWeight: typography.fontWeights.medium,
  },
  appearanceTabTextSelected: {
    color: colors.textPrimary,
    fontWeight: typography.fontWeights.bold,
  },
  formBox: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  fieldRow: {
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.bgInput,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  scheduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  scheduleBtn: {
    width: '31%',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  scheduleBtnSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  scheduleBtnText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
  },
  scheduleBtnTextSelected: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeights.bold,
  },
  customDelayBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  customDelayLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    marginRight: spacing.md,
  },
  customDelayInput: {
    flex: 1,
    backgroundColor: colors.bgInput,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  ambientList: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  ambientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgCardBorder,
  },
  ambientItemSelected: {
    backgroundColor: colors.primary + '15',
  },
  ambientInfo: {
    flex: 1,
  },
  ambientLabel: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semiBold,
  },
  ambientLabelSelected: {
    color: colors.primary,
  },
  ambientDesc: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs - 1,
    marginTop: 2,
  },
  checkIcon: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: spacing.sm,
  },
  voiceList: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
    overflow: 'hidden',
  },
  voiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgCardBorder,
  },
  voiceItemSelected: {
    backgroundColor: colors.primary + '15',
  },
  voiceInfo: {
    flex: 1,
  },
  voiceLabel: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semiBold,
  },
  voiceLabelSelected: {
    color: colors.primary,
  },
  voiceDesc: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs - 1,
    marginTop: 2,
  },
  voicePreviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 4,
    borderWidth: 1,
    borderColor: colors.primary,
    marginTop: spacing.sm,
  },
  voicePreviewBtnText: {
    color: colors.primary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  dialogueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  stepNumCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  stepNumText: {
    color: colors.primary,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
  },
  dialogueLineText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.fontSizes.xs,
    lineHeight: 18,
  },
  removeLineBtn: {
    padding: 6,
  },
  removeLineText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  addLineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  addLineInput: {
    flex: 1,
    backgroundColor: colors.bgInput,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: typography.fontSizes.xs,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
    marginRight: spacing.sm,
  },
  addLineBtn: {
    backgroundColor: colors.bgCardElevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  addLineBtnText: {
    color: colors.primary,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
  },
  actionButtons: {
    marginTop: spacing.lg,
  },
  primaryLaunchBtn: {
    backgroundColor: colors.callAccept,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.callAccept,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryLaunchBtnText: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 0.5,
  },
  saveTemplateBtn: {
    backgroundColor: colors.bgCardElevated,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  saveTemplateBtnText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
  },
});

