import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/colors';
import { audioService } from '../services/audioService';

export default function IncomingCallScreen({
  callPayload,
  onAccept,
  onDecline,
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const caller = callPayload?.caller || {
    name: callPayload?.callerName || 'Người gọi ẩn danh',
    phoneNumber: callPayload?.callerPhone || '0901 234 567',
    role: callPayload?.callerRole || 'Cuộc gọi quan trọng',
  };

  useEffect(() => {
    // Start ringtone and vibration
    audioService.startIncomingCallAlert(callPayload?.ringtoneType || 'classic', callPayload?.vibrationEnabled ?? true);

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => {
      pulse.stop();
      audioService.stopIncomingCallAlert();
    };
  }, [pulseAnim]);

  const handleAccept = () => {
    audioService.stopIncomingCallAlert();
    if (onAccept) onAccept(callPayload);
  };

  const handleDecline = () => {
    audioService.stopIncomingCallAlert();
    if (onDecline) onDecline(callPayload);
  };

  const initials = caller.initials || caller.name?.substring(0, 2)?.toUpperCase() || 'AL';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />

      {/* Top Header info */}
      <View style={styles.topInfo}>
        <View style={styles.simulatedBadge}>
          <Text style={styles.simulatedBadgeText}>● CUỘC GỌI MÔ PHỎNG ALIBIHUB</Text>
        </View>
        <Text style={styles.callStatus}>Cuộc gọi đến...</Text>
      </View>

      {/* Center Caller Avatar & Identity */}
      <View style={styles.centerCaller}>
        <Animated.View style={[styles.avatarGlow, { transform: [{ scale: pulseAnim }] }]}>
          <View style={[styles.avatarCircle, { backgroundColor: caller.avatarBg || colors.primary }]}>
            {caller.avatarUrl ? <Image source={{ uri: caller.avatarUrl }} style={{ width: '100%', height: '100%', borderRadius: 100 }} /> : <Text style={styles.avatarInitials}>{initials}</Text>}
          </View>
        </Animated.View>

        <Text style={styles.callerName}>{caller.name}</Text>
        <Text style={styles.callerPhone}>{caller.phoneNumber}</Text>
        <Text style={styles.callerRole}>{caller.role}</Text>
      </View>

      {/* Action Buttons: Accept / Decline */}
      <View style={styles.actionsContainer}>
        <View style={styles.buttonCol}>
          <TouchableOpacity
            style={[styles.callBtn, styles.declineBtn]}
            onPress={handleDecline}
            activeOpacity={0.8}
          >
            <Text style={styles.btnIcon}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.btnLabel} onPress={handleDecline}>Từ chối</Text>
        </View>

        <View style={styles.buttonCol}>
          <TouchableOpacity
            style={[styles.callBtn, styles.acceptBtn]}
            onPress={handleAccept}
            activeOpacity={0.8}
          >
            <Text style={styles.btnIcon}>📞</Text>
          </TouchableOpacity>
          <Text style={styles.btnLabel} onPress={handleAccept}>Trả lời</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070A12',
    justifyContent: 'space-between',
    paddingVertical: spacing.xxl,
  },
  topInfo: {
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  simulatedBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: spacing.sm,
  },
  simulatedBadgeText: {
    color: colors.accentLight,
    fontSize: typography.fontSizes.xs - 1,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 0.8,
  },
  callStatus: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.sm,
    letterSpacing: 0.5,
  },
  centerCaller: {
    alignItems: 'center',
  },
  avatarGlow: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  avatarCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: typography.fontWeights.bold,
  },
  callerName: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    textAlign: 'center',
    marginBottom: 4,
  },
  callerPhone: {
    color: colors.accentLight,
    fontSize: typography.fontSizes.md,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  callerRole: {
    color: colors.textMuted,
    fontSize: typography.fontSizes.sm,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  buttonCol: {
    alignItems: 'center',
  },
  callBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  declineBtn: {
    backgroundColor: colors.callDecline,
    shadowColor: colors.callDecline,
  },
  acceptBtn: {
    backgroundColor: colors.callAccept,
    shadowColor: colors.callAccept,
  },
  btnIcon: {
    fontSize: 30,
    color: '#FFFFFF',
  },
  btnLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
  },
});

