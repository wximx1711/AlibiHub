import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/colors';

export default function QuickEscapeButton({
  onPress,
  isScheduled,
  remainingSeconds,
  onCancelSchedule,
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  if (isScheduled) {
    return (
      <View style={styles.scheduledContainer}>
        <View style={styles.scheduledInfo}>
          <Text style={styles.scheduledBadge}>ĐANG HẸN GIỜ CUỘC GỌI</Text>
          <Text style={styles.countdownText}>
            Đổ chuông sau: <Text style={styles.countdownHighlight}>{remainingSeconds}s</Text>
          </Text>
          <Text style={styles.scheduledSub}>
            Giữ ứng dụng để đổ chuông; ở nền, chạm thông báo để nhận cuộc gọi.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancelSchedule}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelButtonText}>Hủy hẹn giờ</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
    >
      <Animated.View style={[styles.quickButton, { transform: [{ scale: pulseAnim }] }]}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>⚡</Text>
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.quickTitle}>QUICK ESCAPE (1-CHẠM)</Text>
          <Text style={styles.quickSubtitle}>
            Kích hoạt cuộc gọi mô phỏng khẩn cấp tức thì
          </Text>
        </View>
        <Text style={styles.chevron}>→</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  quickButton: {
    backgroundColor: colors.primary, // Terracotta burnt orange
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconText: {
    fontSize: 22,
    color: '#FFFDF8',
  },
  textWrap: {
    flex: 1,
  },
  quickTitle: {
    color: '#FFFDF8',
    fontSize: typography.fontSizes.md + 1,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 0.5,
  },
  quickSubtitle: {
    color: 'rgba(255, 253, 248, 0.9)',
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
  },
  chevron: {
    color: '#FFFDF8',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: spacing.sm,
  },
  scheduledContainer: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.md + 4,
    borderWidth: 1.5,
    borderColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#352A21',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  scheduledInfo: {
    flex: 1,
  },
  scheduledBadge: {
    color: colors.primary,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 0.8,
  },
  countdownText: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    marginTop: 2,
  },
  countdownHighlight: {
    color: colors.primary,
    fontSize: typography.fontSizes.xl,
  },
  scheduledSub: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs - 1,
    marginTop: 2,
  },
  cancelButton: {
    backgroundColor: colors.errorLight,
    borderWidth: 1,
    borderColor: colors.error,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  cancelButtonText: {
    color: colors.error,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
  },
});
