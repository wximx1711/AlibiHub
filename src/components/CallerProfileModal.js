import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography, spacing, borderRadius } from '../theme/colors';
import { GEMINI_VOICE_PROFILES, getGeminiVoiceForCaller } from '../services/dialogueService';
import { getPrerecordedSample } from '../services/prerecordedVoices';
import { audioService } from '../services/audioService';
import { generateTtsAudio } from '../services/aiService';

export default function CallerProfileModal({
  visible,
  caller = null,
  onSave,
  onDelete,
  onDuplicate,
  onClose,
}) {
  const isEditing = !!caller?.id;

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [gender, setGender] = useState('auto'); // 'female' | 'male' | 'auto'
  const [voiceId, setVoiceId] = useState('auto'); // 'auto' | 'kore' | 'aoede' | 'charon' | 'fenrir' | 'puck'
  const [persona, setPersona] = useState('DEFAULT');
  const [speakingStyle, setSpeakingStyle] = useState('');
  const [preferredUi, setPreferredUi] = useState('android');
  const [greeting, setGreeting] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const [showUrlInput, setShowUrlInput] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (caller) {
      setName(caller.name || '');
      setPhoneNumber(caller.phoneNumber || '');
      setRole(caller.role || '');
      setAvatarUrl(caller.avatarUrl || '');
      setGender(caller.gender || 'auto');
      setVoiceId(caller.voiceId || 'auto');
      setPersona(caller.persona || 'DEFAULT');
      setSpeakingStyle(caller.speakingStyle || '');
      setPreferredUi(caller.preferredUi || 'android');
      setGreeting(caller.greeting || '');
      setIsDefault(!!caller.isDefault);
    } else {
      setName('');
      setPhoneNumber('');
      setRole('Người quen');
      setAvatarUrl('');
      setGender('auto');
      setVoiceId('auto');
      setPersona('DEFAULT');
      setSpeakingStyle('');
      setPreferredUi('android');
      setGreeting('');
      setIsDefault(false);
    }
    setShowUrlInput(false);
  }, [caller, visible]);

  // Handle picking image from device gallery
  const handlePickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Yêu cầu quyền truy cập',
          'Vui lòng cấp quyền truy cập thư viện ảnh trong Cài đặt để chọn ảnh đại diện.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        // Use base64 data URI for 100% persistent cross-session storage
        if (asset.base64) {
          setAvatarUrl(`data:image/jpeg;base64,${asset.base64}`);
        } else if (asset.uri) {
          setAvatarUrl(asset.uri);
        }
      }
    } catch (err) {
      Alert.alert('Không thể mở thư viện ảnh', err.message);
    }
  };

  // Handle taking photo with camera
  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Yêu cầu quyền Camera',
          'Vui lòng cấp quyền truy cập máy ảnh trong Cài đặt để chụp ảnh đại diện.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.base64) {
          setAvatarUrl(`data:image/jpeg;base64,${asset.base64}`);
        } else if (asset.uri) {
          setAvatarUrl(asset.uri);
        }
      }
    } catch (err) {
      Alert.alert('Không thể mở máy ảnh', err.message);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl('');
  };

  // Voice Preview Button
  const handlePreviewVoice = async (targetVoiceId = voiceId) => {
    if (previewLoading) return;
    setPreviewLoading(true);

    const resolved = getGeminiVoiceForCaller(
      { name, role, gender, voiceId: targetVoiceId, persona },
      '',
      role,
      targetVoiceId
    );
    const resolvedVoiceName = resolved?.geminiVoice || 'Kore';
    const sample = getPrerecordedSample(resolvedVoiceName);

    try {
      if (sample?.source) {
        audioService.speakDialogueLine(
          sample.text,
          () => setPreviewLoading(false),
          null,
          null,
          sample.source
        );
      } else {
        const res = await generateTtsAudio({
          text: 'Alo, tôi đang gọi cho bạn đây, có việc gấp cần trao đổi ngay!',
          voiceName: resolvedVoiceName,
          callerRole: role,
          callerName: name,
          gender,
          isPreview: true,
        });

        if (res?.audioBase64) {
          audioService.speakDialogueLine(
            'Alo, tôi đang gọi cho bạn đây, có việc gấp cần trao đổi ngay!',
            () => setPreviewLoading(false),
            null,
            res.audioBase64
          );
        } else {
          audioService.speakDialogueLine(
            'Alo, tôi đang gọi cho bạn đây!',
            () => setPreviewLoading(false)
          );
        }
      }
    } catch (_) {
      setPreviewLoading(false);
    } finally {
      setTimeout(() => setPreviewLoading(false), 3000);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên người gọi.');
      return;
    }
    if (!phoneNumber.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập số điện thoại người gọi.');
      return;
    }

    const payload = {
      ...(caller || {}),
      name: name.trim(),
      phoneNumber: phoneNumber.trim(),
      role: role.trim() || 'Người quen',
      avatarUrl: avatarUrl.trim(),
      gender,
      voiceId,
      persona,
      speakingStyle: speakingStyle.trim(),
      preferredUi,
      greeting: greeting.trim(),
      isDefault,
    };

    onSave?.(payload);
    onClose?.();
  };

  const handleDelete = () => {
    if (!caller?.id) return;
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa hồ sơ người gọi "${caller.name}" không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa vĩnh viễn',
          style: 'destructive',
          onPress: () => {
            onDelete?.(caller.id);
            onClose?.();
          },
        },
      ]
    );
  };

  const handleDuplicate = () => {
    if (!caller?.id) return;
    onDuplicate?.(caller.id);
    onClose?.();
  };

  const initials = name?.trim() ? name.trim().substring(0, 2).toUpperCase() : 'NG';

  const PERSONA_OPTIONS = [
    { id: 'DEFAULT', label: 'Tự nhiên / Thông thường' },
    { id: 'FAMILY_MOM', label: 'Mẹ / Gia đình nữ (Ấm áp, giục về)' },
    { id: 'FAMILY_DAD', label: 'Bố / Gia đình nam (Trầm, giấy tờ)' },
    { id: 'NEIGHBOR', label: 'Tổ dân phố / Hàng xóm (Sự cố khu phố)' },
    { id: 'BOSS', label: 'Sếp / Công sở (Khẩn cấp, họp)' },
    { id: 'FRIEND', label: 'Bạn thân (Cầu cứu, xe hỏng, gặp)' },
    { id: 'SHIPPER', label: 'Shipper (Giao hàng, sảnh tòa nhà)' },
    { id: 'DOCTOR', label: 'Bác sĩ / Y tế (Lịch hẹn, phòng khám)' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEditing ? 'Chỉnh sửa hồ sơ người gọi' : 'Thêm người gọi mới'}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarPreviewCircle}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarInitials}>{initials}</Text>
                )}
              </View>

              <View style={styles.avatarActionButtons}>
                <TouchableOpacity
                  style={styles.avatarPickBtn}
                  onPress={handlePickFromGallery}
                  activeOpacity={0.7}
                >
                  <Text style={styles.avatarPickBtnText}>🖼️ Thư viện ảnh</Text>
                </TouchableOpacity>

                {Platform.OS !== 'web' && (
                  <TouchableOpacity
                    style={styles.avatarPickBtn}
                    onPress={handleTakePhoto}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.avatarPickBtnText}>📷 Chụp ảnh</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.avatarPickBtn}
                  onPress={() => setShowUrlInput(!showUrlInput)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.avatarPickBtnText}>🔗 Nhập URL</Text>
                </TouchableOpacity>

                {avatarUrl ? (
                  <TouchableOpacity
                    style={[styles.avatarPickBtn, styles.avatarRemoveBtn]}
                    onPress={handleRemoveAvatar}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.avatarPickBtnText, styles.avatarRemoveBtnText]}>❌ Xóa ảnh</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {showUrlInput && (
                <View style={styles.urlInputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="https://example.com/avatar.jpg"
                    placeholderTextColor={colors.textMuted}
                    value={avatarUrl}
                    onChangeText={setAvatarUrl}
                    autoCapitalize="none"
                  />
                </View>
              )}
            </View>

            {/* Basic Info */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Tên người gọi hiển thị *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: Bạn thân Linh, Chú Hùng, Sếp Hoàng..."
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Số điện thoại hiển thị *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: 0912 345 678"
                placeholderTextColor={colors.textMuted}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Vai trò / Mối quan hệ</Text>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: Bạn thân, Hàng xóm, Đồng nghiệp, Gia đình..."
                placeholderTextColor={colors.textMuted}
                value={role}
                onChangeText={setRole}
              />
            </View>

            {/* Gender Selector */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Giới tính người gọi (Voice Gender)</Text>
              <View style={styles.chipRow}>
                {[
                  { id: 'female', label: '👩 Nữ (Female)' },
                  { id: 'male', label: '👨 Nam (Male)' },
                  { id: 'auto', label: '⚡ Tự động (Auto)' },
                ].map((g) => (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.chip, gender === g.id && styles.chipActive]}
                    onPress={() => setGender(g.id)}
                  >
                    <Text style={[styles.chipText, gender === g.id && styles.chipTextActive]}>
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Voice Selection */}
            <View style={styles.fieldGroup}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.label}>Giọng nói AI tiếng Việt (Gemini TTS)</Text>
                <TouchableOpacity
                  style={styles.previewVoiceBtn}
                  onPress={() => handlePreviewVoice()}
                  disabled={previewLoading}
                >
                  {previewLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text style={styles.previewVoiceBtnText}>🔊 Nghe thử</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.voiceOptionsContainer}>
                {GEMINI_VOICE_PROFILES.map((vp) => (
                  <TouchableOpacity
                    key={vp.id}
                    style={[styles.voiceCard, voiceId === vp.id && styles.voiceCardActive]}
                    onPress={() => {
                      setVoiceId(vp.id);
                      if (vp.id !== 'auto') handlePreviewVoice(vp.id);
                    }}
                  >
                    <View style={styles.voiceCardHeader}>
                      <Text style={[styles.voiceCardTitle, voiceId === vp.id && styles.voiceCardTitleActive]}>
                        {vp.label}
                      </Text>
                      {voiceId === vp.id && <Text style={styles.voiceCardCheck}>✓ Đang chọn</Text>}
                    </View>
                    <Text style={styles.voiceCardDesc}>{vp.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Persona Selector */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Hình tượng hội thoại AI (Roleplay Persona)</Text>
              <View style={styles.personaContainer}>
                {PERSONA_OPTIONS.map((po) => (
                  <TouchableOpacity
                    key={po.id}
                    style={[styles.personaItem, persona === po.id && styles.personaItemActive]}
                    onPress={() => setPersona(po.id)}
                  >
                    <Text style={[styles.personaItemText, persona === po.id && styles.personaItemTextActive]}>
                      {po.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Speaking Style */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Phong cách nói chuyện (Tùy chọn)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: Giọng hối hả, lo lắng, hoặc nghiêm túc..."
                placeholderTextColor={colors.textMuted}
                value={speakingStyle}
                onChangeText={setSpeakingStyle}
              />
            </View>

            {/* Preferred Call UI */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Giao diện cuộc gọi ưa thích</Text>
              <View style={styles.chipRow}>
                {[
                  { id: 'android', label: '🤖 Android' },
                  { id: 'ios', label: '🍏 iOS' },
                  { id: 'zalo', label: '💬 Zalo' },
                  { id: 'messenger', label: '⚡ Messenger' },
                ].map((ui) => (
                  <TouchableOpacity
                    key={ui.id}
                    style={[styles.chip, preferredUi === ui.id && styles.chipActive]}
                    onPress={() => setPreferredUi(ui.id)}
                  >
                    <Text style={[styles.chipText, preferredUi === ui.id && styles.chipTextActive]}>
                      {ui.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Personalized Greeting */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Câu thoại mở đầu riêng biệt (Tùy chọn)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Ví dụ: Alo cháu à, chú Hùng tổ dân phố đây! (Để trống để AI tự sinh lời chào)"
                placeholderTextColor={colors.textMuted}
                value={greeting}
                onChangeText={setGreeting}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Set Default */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setIsDefault(!isDefault)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, isDefault && styles.checkboxActive]}>
                {isDefault && <Text style={styles.checkboxCheck}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Đặt làm người gọi mặc định khi mở ứng dụng</Text>
            </TouchableOpacity>

            {/* Bottom Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
                <Text style={styles.saveBtnText}>💾 Lưu hồ sơ</Text>
              </TouchableOpacity>

              {isEditing && (
                <View style={styles.secondaryActionsRow}>
                  <TouchableOpacity style={styles.duplicateBtn} onPress={handleDuplicate} activeOpacity={0.8}>
                    <Text style={styles.duplicateBtnText}>📑 Nhân bản</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
                    <Text style={styles.deleteBtnText}>🗑️ Xóa người gọi</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '92%',
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  closeBtnText: {
    fontSize: 22,
    color: colors.textMuted,
    fontWeight: '700',
  },
  modalBody: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  avatarPreviewCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    ...typography.h2,
    color: colors.primary,
  },
  avatarActionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  avatarPickBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.bgInput,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarPickBtnText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  avatarRemoveBtn: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  avatarRemoveBtnText: {
    color: '#DC2626',
  },
  urlInputContainer: {
    width: '100%',
    marginTop: spacing.sm,
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    ...typography.body,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  previewVoiceBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primaryLight,
  },
  previewVoiceBtnText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  voiceOptionsContainer: {
    gap: spacing.xs,
  },
  voiceCard: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
  },
  voiceCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  voiceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  voiceCardTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  voiceCardTitleActive: {
    color: colors.primary,
  },
  voiceCardCheck: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  voiceCardDesc: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  personaContainer: {
    gap: spacing.xs,
  },
  personaItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
  },
  personaItemActive: {
    borderColor: colors.secondary,
    backgroundColor: '#F0F3E8',
  },
  personaItemText: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  personaItemTextActive: {
    fontWeight: '700',
    color: colors.secondary,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bgInput,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxCheck: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
  },
  checkboxLabel: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  modalActions: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  saveBtnText: {
    ...typography.button,
    color: '#FFF',
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  duplicateBtn: {
    flex: 1,
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  duplicateBtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  deleteBtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: '#DC2626',
  },
});
