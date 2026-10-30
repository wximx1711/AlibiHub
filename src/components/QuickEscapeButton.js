import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/colors';

export default function QuickEscapeButton({ onPress, isScheduled, remainingSeconds, onCancelSchedule }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
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
          <Text style={styles.scheduledSub}>Ứng dụng sẽ kích hoạt giao diện cuộc gọi mô phỏng</Text>
        </View>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancelSchedule} activeOpacity={0.8}>
          <Text style={styles.cancelButtonText}>Hủy hẹn giờ</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <TouchableOpacity style={styles.quickButton} onPress={onPress} activeOpacity={0.85}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>⚡</Text>
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.quickTitle}>QUICK ESCAPE (1-CHẠM)</Text>
          <Text style={styles.quickSubtitle}>Kích hoạt cuộc gọi mô phỏng khẩn cấp tức thì</Text>
        </View>
        <Text style={styles.chevron}>→</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  quickButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
  },
  textWrap: {
    flex: 1,
  },
  quickTitle: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.extraBold,
    letterSpacing: 0.5,
  },
  quickSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
  },
  chevron: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: spacing.sm,
  },
  scheduledContainer: {
    backgroundColor: colors.bgCardElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.warning,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scheduledInfo: {
    flex: 1,
  },
  scheduledBadge: {
    color: colors.warning,
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
    color: colors.warning,
    fontSize: typography.fontSizes.xl,
  },
  scheduledSub: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
  },
  cancelButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
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

