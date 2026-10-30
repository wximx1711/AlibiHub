import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/colors';
import Header from '../components/Header';

export default function ScenarioDetailScreen({
  scenario,
  onLaunch,
  onCustomize,
  onDelete,
  onBack,
}) {
  const [copiedNotice, setCopiedNotice] = useState(false);

  if (!scenario) return null;

  const handleShareMessage = async () => {
    if (!scenario.suggestedMessage) return;
    try {
      await Share.share({
        message: scenario.suggestedMessage,
        title: 'Lời từ chối AlibiHub',
      });
    } catch (err) {
      console.warn('Share error:', err.message);
    }
  };

  const handleCopyMessage = async () => {
    if (!scenario.suggestedMessage) return;
    // For web / native clipboard
    try { await Clipboard.setStringAsync(scenario.suggestedMessage); } catch (err) { Alert.alert('Không thể sao chép', err.message); return; }
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2500);
  };

  const getAmbientLabel = (amb) => {
    switch (amb) {
      case 'office':
        return '🏢 Văn phòng làm việc (Bàn phím, trao đổi nhẹ)';
      case 'cafe':
        return '☕ Quán cà phê (Tiếng thìa tách, râm ran)';
      case 'street':
        return '🚗 Đường phố (Tiếng xe cộ, còi xe từ xa)';
      case 'hospital':
        return '🏥 Bệnh viện / Phòng khám (Tiếng bíp máy đo)';
      default:
        return '🔇 Yên tĩnh (Không âm nền)';
    }
  };

  return (
    <View style={styles.safeArea}>
      <Header
        title="Chi tiết Kịch bản"
        subtitle={scenario.category || 'Tình huống thoát hiểm'}
        rightAction={onBack}
        rightLabel="Quay lại"
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Title & Badge */}
        <View style={styles.headerCard}>
          <Text style={styles.title}>{scenario.title}</Text>
          {scenario.description ? (
            <Text style={styles.description}>{scenario.description}</Text>
          ) : null}
        </View>

        {/* Configuration Meta */}
        <View style={styles.metaCard}>
          <Text style={styles.sectionHeading}>CẤU HÌNH CUỘC GỌI MÔ PHỎNG</Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>👤 Người gọi:</Text>
            <Text style={styles.metaValue}>{scenario.callerName || 'Người gọi'}</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>📞 Số điện thoại:</Text>
            <Text style={styles.metaValue}>{scenario.callerPhone || '0901 234 567'}</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>⏱️ Thời gian đổ chuông:</Text>
            <Text style={styles.metaValue}>
              {scenario.delaySeconds ? `Sau ${scenario.delaySeconds} giây` : 'Ngay lập tức'}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>🔊 Âm nền:</Text>
            <Text style={styles.metaValue}>{getAmbientLabel(scenario.ambientSound)}</Text>
          </View>
        </View>

        {/* Dialogue Script */}
        <View style={styles.dialogueCard}>
          <Text style={styles.sectionHeading}>
            KỊCH BẢN THOẠI ({scenario.dialogue?.length || 0} CÂU)
          </Text>

          {scenario.dialogue && scenario.dialogue.length > 0 ? (
            scenario.dialogue.map((line, idx) => (
              <View key={`line_${idx}`} style={styles.dialogueItem}>
                <View style={styles.dialogueNum}>
                  <Text style={styles.dialogueNumText}>{idx + 1}</Text>
                </View>
                <Text style={styles.dialogueLineText}>"{line}"</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noDialogueText}>Chưa có đoạn thoại nào.</Text>
          )}
        </View>

        {/* Suggested Exit Message */}
        {scenario.suggestedMessage ? (
          <View style={styles.messageCard}>
            <Text style={styles.sectionHeading}>MẪU LỜI TỪ CHỐI / TIN NHẮN ĐỀ XUẤT</Text>
            <Text style={styles.messageText}>"{scenario.suggestedMessage}"</Text>

            <View style={styles.messageActions}>
              <TouchableOpacity
                style={styles.messageBtn}
                onPress={handleCopyMessage}
                activeOpacity={0.7}
              >
                <Text style={styles.messageBtnText}>
                  {copiedNotice ? '✓ Đã chép' : '📋 Sao chép'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.messageBtn}
                onPress={handleShareMessage}
                activeOpacity={0.7}
              >
                <Text style={styles.messageBtnText}>↗ Chia sẻ</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Primary Launch & Customize Actions */}
        <View style={styles.actionsWrap}>
          <TouchableOpacity
            style={styles.launchBtn}
            onPress={() => onLaunch(scenario)}
            activeOpacity={0.85}
          >
            <Text style={styles.launchBtnText}>📞 KHỞI CHẠY CUỘC GỌI NÀY</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.customizeBtn}
            onPress={() => onCustomize(scenario)}
            activeOpacity={0.8}
          >
            <Text style={styles.customizeBtnText}>✏️ Tùy chỉnh trong Simulator</Text>
          </TouchableOpacity>

          {scenario.isCustom && onDelete ? (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => onDelete(scenario.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.deleteBtnText}>🗑️ Xóa kịch bản này khỏi Vault</Text>
            </TouchableOpacity>
          ) : null}
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
  headerCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    lineHeight: 26,
    marginBottom: spacing.xs,
  },
  description: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.sm,
    lineHeight: 20,
  },
  metaCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  sectionHeading: {
    color: colors.accentLight,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 0.8,
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  metaLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    width: 140,
  },
  metaValue: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semiBold,
  },
  dialogueCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  dialogueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    backgroundColor: colors.bgCardElevated,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  dialogueNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  dialogueNumText: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.xs - 2,
    fontWeight: typography.fontWeights.bold,
  },
  dialogueLineText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.fontSizes.xs,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  noDialogueText: {
    color: colors.textMuted,
    fontSize: typography.fontSizes.xs,
  },
  messageCard: {
    backgroundColor: colors.bgCardElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  messageText: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  messageActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  messageBtn: {
    backgroundColor: colors.bgCard,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  messageBtnText: {
    color: colors.accentLight,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semiBold,
  },
  actionsWrap: {
    marginTop: spacing.sm,
  },
  launchBtn: {
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
  launchBtnText: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 0.5,
  },
  customizeBtn: {
    backgroundColor: colors.bgCardElevated,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
    marginBottom: spacing.sm,
  },
  customizeBtnText: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semiBold,
  },
  deleteBtn: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: colors.error,
    fontSize: typography.fontSizes.xs,
  },
});

