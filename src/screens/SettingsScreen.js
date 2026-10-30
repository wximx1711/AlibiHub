import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/colors';
import Header from '../components/Header';
import ConfirmModal from '../components/ConfirmModal';
import { proxyUrl as validateProxyUrl } from '../utils/validation';
import { checkServerHealth } from '../services/aiService';

export default function SettingsScreen({
  settings = {},
  onSaveSettings,
  onResetFactoryData,
  onBack,
}) {
  const [proxyUrl, setProxyUrl] = useState(process.env.EXPO_PUBLIC_AI_PROXY_URL || settings.proxyUrl || '');
  const [vibrationEnabled, setVibrationEnabled] = useState(settings.vibrationEnabled ?? true);
  const [ringtoneType, setRingtoneType] = useState(settings.ringtoneType || 'classic');

  // Server health test state
  const [isCheckingServer, setIsCheckingServer] = useState(false);
  const [serverStatus, setServerStatus] = useState(null);

  // Factory reset modal
  const [resetModalVisible, setResetModalVisible] = useState(false);

  useEffect(() => {
    handleCheckServer();
  }, []);

  const handleCheckServer = async () => {
    setIsCheckingServer(true);
    const status = await checkServerHealth();
    setServerStatus(status);
    setIsCheckingServer(false);
  };

  const handleSaveProxyUrl = async () => {
    try { await onSaveSettings({ proxyUrl: validateProxyUrl(proxyUrl) }); await handleCheckServer(); Alert.alert('Đã lưu', 'Đã cập nhật máy chủ AI.'); }
    catch (err) { Alert.alert('Không thể lưu', err.message); }
  };

  const handleToggleVibration = (val) => {
    setVibrationEnabled(val);
    onSaveSettings({ vibrationEnabled: val });
  };

  const handleChangeRingtone = (type) => {
    setRingtoneType(type);
    onSaveSettings({ ringtoneType: type });
  };

  const handleConfirmReset = async () => {
    await onResetFactoryData();
    setResetModalVisible(false);
    Alert.alert('Thành công', 'Đã khôi phục toàn bộ dữ liệu mẫu ban đầu.');
  };

  return (
    <View style={styles.safeArea}>
      <Header
        title="Cài đặt & Riêng tư"
        subtitle="Cấu hình hệ thống, AI Proxy & Quản lý dữ liệu"
        rightAction={onBack}
        rightLabel="Đóng"
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* ======================================================== */}
        {/* 1. AI PROXY & GEMINI CONFIGURATION */}
        {/* ======================================================== */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>MÁY CHỦ PROXY GEMINI AI (BẢO MẬT)</Text>
          <Text style={styles.sectionSub}>
            Theo nguyên tắc an toàn, API Key được lưu tại máy chủ trung gian, ứng dụng di động không nhúng trực tiếp API Key bí mật.
          </Text>

          {/* Status Box */}
          <View style={styles.serverStatusBox}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Trạng thái máy chủ:</Text>
              <View style={styles.statusIndicator}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: serverStatus?.online ? colors.success : colors.error },
                  ]}
                />
                <Text style={styles.statusText}>
                  {serverStatus?.online ? 'Đang hoạt động (Online)' : 'Chưa kết nối (Offline)'}
                </Text>
              </View>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Khóa Gemini API:</Text>
              <Text
                style={[
                  styles.statusValue,
                  { color: serverStatus?.hasKey ? colors.success : colors.warning },
                ]}
              >
                {serverStatus?.hasKey ? '✓ Đã cấu hình' : '⚠️ Chưa thiết lập'}
              </Text>
            </View>

            {serverStatus?.model ? (
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Mô hình AI:</Text>
                <Text style={styles.statusValue}>{serverStatus.model}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.checkServerBtn}
              onPress={handleCheckServer}
              disabled={isCheckingServer}
            >
              {isCheckingServer ? (
                <ActivityIndicator color={colors.accentLight} size="small" />
              ) : (
                <Text style={styles.checkServerText}>Kiểm tra lại kết nối máy chủ</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Proxy URL configuration */}
          <Text style={styles.fieldLabel}>URL Máy chủ Proxy:</Text>
          <View style={styles.inputActionRow}>
            <TextInput
              style={styles.inputFlex}
              value={proxyUrl}
              onChangeText={setProxyUrl}
              placeholder="https://your-backend.example"
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProxyUrl}>
              <Text style={styles.saveBtnText}>Lưu URL</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hintText}>
            Máy chủ HTTPS dùng được trên điện thoại ngoài mạng Wi-Fi. Khóa Gemini chỉ được cấu hình trên máy chủ.
          </Text>


        </View>

        {/* ======================================================== */}
        {/* 2. AUDIO & SIMULATION PREFERENCES */}
        {/* ======================================================== */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>CÀI ĐẶT ÂM THANH & RUNG</Text>

          <View style={styles.settingItemRow}>
            <View style={styles.settingTextWrap}>
              <Text style={styles.settingTitle}>Rung khi có cuộc gọi đến</Text>
              <Text style={styles.settingDesc}>Mô phỏng nhịp rung thực tế của điện thoại</Text>
            </View>
            <Switch
              value={vibrationEnabled}
              onValueChange={handleToggleVibration}
              trackColor={{ false: colors.bgCardBorder, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>Kiểu chuông mô phỏng:</Text>
          <View style={styles.ringtoneOptions}>
            {[
              { id: 'classic', label: 'Cổ điển (440Hz/480Hz)' },
              { id: 'digital', label: 'Hiện đại (Digital Pulse)' },
            ].map((rt) => (
              <TouchableOpacity
                key={rt.id}
                style={[
                  styles.ringtoneBtn,
                  ringtoneType === rt.id && styles.ringtoneBtnActive,
                ]}
                onPress={() => handleChangeRingtone(rt.id)}
              >
                <Text
                  style={[
                    styles.ringtoneBtnText,
                    ringtoneType === rt.id && styles.ringtoneBtnTextActive,
                  ]}
                >
                  {rt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ======================================================== */}
        {/* 3. DATA MANAGEMENT */}
        {/* ======================================================== */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>QUẢN LÝ DỮ LIỆU CỤC BỘ</Text>
          <Text style={styles.sectionSub}>
            Tất cả hồ sơ người gọi, kịch bản tùy chỉnh và lịch sử cuộc gọi được lưu an toàn trên thiết bị của bạn.
          </Text>

          <TouchableOpacity
            style={styles.dangerBtn}
            onPress={() => setResetModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.dangerBtnText}>⚠️ Khôi phục dữ liệu gốc ban đầu</Text>
          </TouchableOpacity>
        </View>

        {/* ======================================================== */}
        {/* 4. ABOUT & ETHICAL STATEMENT */}
        {/* ======================================================== */}
        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>AlibiHub v1.0 — Social Escape Assistant</Text>
          <Text style={styles.aboutText}>
            Dự án xây dựng dựa trên Tài liệu Đề xuất Ý tưởng Sản phẩm AlibiHub (MMA301).
          </Text>
          <Text style={styles.aboutSub}>
            Mục đích hỗ trợ giải thoát lịch sự, bảo vệ ranh giới cá nhân và nâng cao kỹ năng giao tiếp. Ứng dụng cam kết không hỗ trợ giả mạo pháp lý, gian lận hoặc mạo danh người khác.
          </Text>
        </View>
      </ScrollView>

      {/* Factory Reset Modal */}
      <ConfirmModal
        visible={resetModalVisible}
        title="Khôi phục dữ liệu gốc?"
        message="Hành động này sẽ xóa các hồ sơ người gọi và kịch bản bạn đã thêm và tải lại dữ liệu mặc định. Bạn có chắc chắn không?"
        confirmText="Khôi phục lại"
        isDestructive
        onConfirm={handleConfirmReset}
        onCancel={() => setResetModalVisible(false)}
      />
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
  sectionCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  sectionHeader: {
    color: colors.accentLight,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  sectionSub: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  serverStatusBox: {
    backgroundColor: colors.bgDark,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statusLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
  },
  statusValue: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semiBold,
  },
  checkServerBtn: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs + 2,
    alignItems: 'center',
    backgroundColor: colors.bgCardElevated,
    borderRadius: borderRadius.sm,
  },
  checkServerText: {
    color: colors.accentLight,
    fontSize: typography.fontSizes.xs - 1,
    fontWeight: typography.fontWeights.bold,
  },
  fieldLabel: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semiBold,
    marginBottom: 4,
  },
  inputActionRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  inputFlex: {
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
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
  },
  hintText: {
    color: colors.textMuted,
    fontSize: typography.fontSizes.xs - 2,
    lineHeight: 14,
  },
  settingItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgCardBorder,
  },
  settingTextWrap: {
    flex: 1,
  },
  settingTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
  },
  settingDesc: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs - 1,
    marginTop: 2,
  },
  ringtoneOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ringtoneBtn: {
    flex: 1,
    backgroundColor: colors.bgCardElevated,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  ringtoneBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  ringtoneBtnText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
  },
  ringtoneBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeights.bold,
  },
  dangerBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  dangerBtnText: {
    color: colors.error,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
  },
  aboutCard: {
    padding: spacing.md,
    alignItems: 'center',
  },
  aboutTitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    marginBottom: 4,
  },
  aboutText: {
    color: colors.textMuted,
    fontSize: typography.fontSizes.xs,
    textAlign: 'center',
    marginBottom: 4,
  },
  aboutSub: {
    color: colors.textMuted,
    fontSize: typography.fontSizes.xs - 1,
    textAlign: 'center',
    lineHeight: 16,
  },
});

