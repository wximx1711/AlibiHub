import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  Platform,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/colors';
import { audioService } from '../services/audioService';
import CallIcon from '../components/CallIcon';

export default function IncomingCallScreen({
  callPayload,
  onAccept,
  onDecline,
}) {
  // Appearance is configured before call: 'android' | 'ios' | 'zalo' | 'messenger'
  const appearance = callPayload?.callAppearance || 'android';

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const caller = callPayload?.caller || {
    name: callPayload?.callerName || 'Người gọi ẩn danh',
    phoneNumber: callPayload?.callerPhone || '0901 234 567',
    role: callPayload?.callerRole || 'Cuộc gọi quan trọng',
  };

  useEffect(() => {
    // Start ringtone and vibration
    audioService.startIncomingCallAlert(
      callPayload?.ringtoneType || 'classic',
      callPayload?.vibrationEnabled ?? true
    );

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
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

    return () => {
      pulse.stop();
      audioService.stopIncomingCallAlert();
    };
  }, [pulseAnim]);

  const handleAccept = () => {
    audioService.stopIncomingCallAlert();
    if (onAccept) onAccept({ ...callPayload, callAppearance: appearance });
  };

  const handleDecline = () => {
    audioService.stopIncomingCallAlert();
    if (onDecline) onDecline({ ...callPayload, callAppearance: appearance });
  };

  const initials =
    caller.initials || caller.name?.substring(0, 2)?.toUpperCase() || 'AL';

  // ----------------------------------------------------
  // 1. ZALO STYLE (Reference Image 4)
  // ----------------------------------------------------
  if (appearance === 'zalo') {
    return (
      <View style={[styles.container, styles.zaloContainer]}>
        <StatusBar barStyle="light-content" backgroundColor="#0068FF" />

        {/* Top Header */}
        <View style={styles.zaloTopHeader}>
          <Text style={styles.zaloHeaderText}>Zalo</Text>
        </View>

        {/* Center Section: Avatar & Caller Info */}
        <View style={styles.zaloCenter}>
          <Animated.View
            style={[
              styles.zaloAvatarHalo,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <View style={styles.zaloAvatarCircle}>
              {caller.avatarUrl ? (
                <Image
                  source={{ uri: caller.avatarUrl }}
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.zaloAvatarInitials}>{initials}</Text>
              )}
            </View>
          </Animated.View>

          <Text style={styles.zaloCallerName} numberOfLines={1}>
            {caller.name}
          </Text>
          <Text style={styles.zaloSubtitle}>Zalo: Cuộc gọi thoại đến</Text>
        </View>

        {/* Bottom Actions: Decline & Accept */}
        <View style={styles.zaloBottomActions}>
          <View style={styles.actionCol}>
            <TouchableOpacity
              style={[styles.callCircleBtn, styles.declineCircleBtn]}
              onPress={handleDecline}
              activeOpacity={0.8}
            >
              <Text style={styles.phoneIconRotate}>📞</Text>
              <CallIcon name="phone_hangup" size={32} />
            </TouchableOpacity>
            <Text style={styles.zaloActionLabel} onPress={handleDecline}>
              Từ chối
            </Text>
          </View>

          <View style={styles.actionCol}>
            <TouchableOpacity
              style={[styles.callCircleBtn, styles.acceptCircleBtn]}
              onPress={handleAccept}
              activeOpacity={0.8}
            >
              <Text style={styles.phoneIconNormal}>📞</Text>
              <CallIcon name="phone_accept" size={32} />
            </TouchableOpacity>
            <Text style={styles.zaloActionLabel} onPress={handleAccept}>
              Trả lời
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // ----------------------------------------------------
  // 2. MESSENGER STYLE (Reference Image 5)
  // ----------------------------------------------------
  if (appearance === 'messenger') {
    return (
      <View style={[styles.container, styles.messengerContainer]}>
        <StatusBar barStyle="light-content" backgroundColor="#1A1829" />

        {/* Top Spacer / Status Bar Area */}
        <View style={styles.messengerTopSpacer}>
          <Text style={styles.messengerStatusTime}>9:41</Text>
        </View>

        {/* Center Section: Identity */}
        <View style={styles.messengerCenter}>
          <Text style={styles.messengerCallerName} numberOfLines={1}>
            {caller.name}
          </Text>

          <View style={styles.messengerTagRow}>
            <View style={styles.messengerLogoDot}>
              <Text style={styles.messengerLogoIcon}>⚡</Text>
            </View>
            <Text style={styles.messengerSubtitle}>Messenger Audio...</Text>
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={styles.messengerBottom}>
          {/* Secondary Action: Remind me */}
          <View style={styles.secondaryActionRow}>
            <View style={styles.secondaryActionItem}>
              <Text style={styles.secondaryActionIcon}>⏰</Text>
              <Text style={styles.secondaryActionText}>Nhắc tôi</Text>
            </View>
          </View>

          {/* Decline & Accept Row */}
          <View style={styles.messengerButtonsRow}>
            <View style={styles.actionCol}>
              <TouchableOpacity
                style={[styles.callCircleBtn, styles.declineCircleBtn]}
                onPress={handleDecline}
                activeOpacity={0.8}
              >
                <Text style={styles.btnIconX}>✕</Text>
                <CallIcon name="phone_hangup" size={32} />
              </TouchableOpacity>
              <Text style={styles.actionLabelText} onPress={handleDecline}>
                Từ chối
              </Text>
            </View>

            <View style={styles.actionCol}>
              <TouchableOpacity
                style={[styles.callCircleBtn, styles.messengerAcceptBtn]}
                onPress={handleAccept}
                activeOpacity={0.8}
              >
                <Text style={styles.btnIconCheck}>✓</Text>
                <CallIcon name="phone_accept" size={32} />
              </TouchableOpacity>
              <Text style={styles.actionLabelText} onPress={handleAccept}>
                Trả lời
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // ----------------------------------------------------
  // 3. IOS STYLE (Reference Image 3 Right)
  // ----------------------------------------------------
  if (appearance === 'ios') {
    return (
      <View style={[styles.container, styles.iosContainer]}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />

        {/* Top Section */}
        <View style={styles.iosTop}>
          <Text style={styles.iosCallerName} numberOfLines={1}>
            {caller.name}
          </Text>
          <Text style={styles.iosSubtext}>
            {caller.phoneNumber || caller.role || 'di động'}
          </Text>
        </View>

        {/* Secondary Actions: Remind Me & Message */}
        <View style={styles.iosSecondaryRow}>
          <View style={styles.iosSecondaryItem}>
            <Text style={styles.iosSecondaryIcon}>⏰</Text>
            <Text style={styles.iosSecondaryText}>Nhắc tôi</Text>
          </View>
          <View style={styles.iosSecondaryItem}>
            <Text style={styles.iosSecondaryIcon}>💬</Text>
            <Text style={styles.iosSecondaryText}>Tin nhắn</Text>
          </View>
        </View>

        {/* Bottom Action Buttons */}
        <View style={styles.iosBottomActions}>
          <View style={styles.actionCol}>
            <TouchableOpacity
              style={[styles.callCircleBtn, styles.declineCircleBtn]}
              onPress={handleDecline}
              activeOpacity={0.8}
            >
              <Text style={styles.phoneIconRotate}>📞</Text>
              <CallIcon name="phone_hangup" size={32} />
            </TouchableOpacity>
            <Text style={styles.actionLabelText} onPress={handleDecline}>
              Từ chối
            </Text>
          </View>

          <View style={styles.actionCol}>
            <TouchableOpacity
              style={[styles.callCircleBtn, styles.acceptCircleBtn]}
              onPress={handleAccept}
              activeOpacity={0.8}
            >
              <Text style={styles.phoneIconNormal}>📞</Text>
              <CallIcon name="phone_accept" size={32} />
            </TouchableOpacity>
            <Text style={styles.actionLabelText} onPress={handleAccept}>
              Trả lời
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // ----------------------------------------------------
  // 4. ANDROID STYLE (Reference Image 1 - Default)
  // ----------------------------------------------------
  return (
    <View style={[styles.container, styles.androidContainer]}>
      <StatusBar barStyle="light-content" backgroundColor="#1A2228" />

      {/* Top Header / Status Time */}
      <View style={styles.androidTop}>
        <Text style={styles.androidTimeText}>14:32</Text>
      </View>

      {/* Center Section: Large Avatar with Phone Badge */}
      <View style={styles.androidCenter}>
        <View style={styles.androidAvatarWrap}>
          <View style={styles.androidAvatarCircle}>
            {caller.avatarUrl ? (
              <Image
                source={{ uri: caller.avatarUrl }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.androidAvatarInitials}>{initials}</Text>
            )}
          </View>
          {/* Small Green Phone Badge (Image 1) */}
          <View style={styles.androidPhoneBadge}>
            <Text style={styles.androidBadgePhoneIcon}>📞</Text>
            <CallIcon name="phone_accept" size={14} />
          </View>
        </View>

        <Text style={styles.androidCallerName} numberOfLines={1}>
          {caller.name}
        </Text>
        <Text style={styles.androidCallingStatus}>Đang gọi đến...</Text>

        {/* Green pill tag: Mobile / Caller Role */}
        <View style={styles.androidMobilePill}>
          <Text style={styles.androidPillIcon}>📞</Text>
          <CallIcon name="phone_accept" size={12} style={{ marginRight: 6 }} />
          <Text style={styles.androidPillText}>
            {caller.role || caller.phoneNumber || 'Mobile'}
          </Text>
        </View>
      </View>

      {/* Bottom Action Buttons: Decline (Red) & Accept (Green) */}
      <View style={styles.androidBottom}>
        <View style={styles.actionCol}>
          <TouchableOpacity
            style={[styles.callCircleBtn, styles.declineCircleBtn]}
            onPress={handleDecline}
            activeOpacity={0.8}
          >
            <Text style={styles.phoneIconRotate}>📞</Text>
            <CallIcon name="phone_hangup" size={32} />
          </TouchableOpacity>
          <Text style={styles.actionLabelText} onPress={handleDecline}>
            Từ chối
          </Text>
        </View>

        {/* Center Ripple Prompt (Image 1) */}
        <Animated.View
          style={[
            styles.androidRippleCenter,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <Text style={styles.androidRippleText}>Vuốt lên để trả lời</Text>
        </Animated.View>

        <View style={styles.actionCol}>
          <TouchableOpacity
            style={[styles.callCircleBtn, styles.acceptCircleBtn]}
            onPress={handleAccept}
            activeOpacity={0.8}
          >
            <Text style={styles.phoneIconNormal}>📞</Text>
            <CallIcon name="phone_accept" size={32} />
          </TouchableOpacity>
          <Text style={styles.actionLabelText} onPress={handleAccept}>
            Trả lời
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: Platform.OS === 'ios' ? 44 : spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
  },
  actionCol: {
    alignItems: 'center',
  },
  callCircleBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  declineCircleBtn: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  acceptCircleBtn: {
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
  },
  phoneIconImg: {
    width: 32,
    height: 32,
  },
  androidBadgePhoneImg: {
    width: 14,
    height: 14,
  },
  androidPillIconImg: {
    width: 13,
    height: 13,
    marginRight: 6,
  },
  phoneIconNormal: {
    color: '#FFFFFF',
    fontSize: 26,
  },
  phoneIconRotate: {
    color: '#FFFFFF',
    fontSize: 26,
    transform: [{ rotate: '135deg' }],
  },
  actionLabelText: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
  },

  // ----------------------------------------------------
  // ZALO STYLES
  // ----------------------------------------------------
  zaloContainer: {
    backgroundColor: '#0068FF',
  },
  zaloTopHeader: {
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  zaloHeaderText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 0.5,
  },
  zaloCenter: {
    alignItems: 'center',
  },
  zaloAvatarHalo: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  zaloAvatarCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  zaloAvatarInitials: {
    color: '#0068FF',
    fontSize: 40,
    fontWeight: typography.fontWeights.bold,
  },
  zaloCallerName: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    marginBottom: 4,
  },
  zaloSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: typography.fontSizes.sm,
  },
  zaloBottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  zaloActionLabel: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    marginTop: 2,
  },

  // ----------------------------------------------------
  // MESSENGER STYLES
  // ----------------------------------------------------
  messengerContainer: {
    backgroundColor: '#171520',
  },
  messengerTopSpacer: {
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  messengerStatusTime: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: typography.fontWeights.bold,
  },
  messengerCenter: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  messengerCallerName: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.xxl + 2,
    fontWeight: typography.fontWeights.bold,
    marginBottom: spacing.xs,
  },
  messengerTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messengerLogoDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#A855F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  messengerLogoIcon: {
    fontSize: 9,
    color: '#FFFFFF',
  },
  messengerSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: typography.fontSizes.sm,
  },
  messengerBottom: {
    paddingBottom: spacing.xl,
  },
  secondaryActionRow: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  secondaryActionItem: {
    alignItems: 'center',
  },
  secondaryActionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  secondaryActionText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: typography.fontSizes.xs,
  },
  messengerButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.xl,
  },
  messengerAcceptBtn: {
    backgroundColor: '#0084FF',
    shadowColor: '#0084FF',
  },
  btnIconX: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  btnIconCheck: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: 'bold',
  },

  // ----------------------------------------------------
  // IOS STYLES
  // ----------------------------------------------------
  iosContainer: {
    backgroundColor: '#000000',
  },
  iosTop: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
  },
  iosCallerName: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.xxl + 4,
    fontWeight: typography.fontWeights.semiBold,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  iosSubtext: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: typography.fontSizes.md,
  },
  iosSecondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.xl,
  },
  iosSecondaryItem: {
    alignItems: 'center',
  },
  iosSecondaryIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  iosSecondaryText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: typography.fontSizes.xs,
  },
  iosBottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },

  // ----------------------------------------------------
  // ANDROID STYLES (Default)
  // ----------------------------------------------------
  androidContainer: {
    backgroundColor: '#192229',
  },
  androidTop: {
    alignItems: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
  },
  androidTimeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: typography.fontWeights.medium,
  },
  androidCenter: {
    alignItems: 'center',
  },
  androidAvatarWrap: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  androidAvatarCircle: {
    width: 106,
    height: 106,
    borderRadius: 53,
    backgroundColor: '#2A364F',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  androidAvatarInitials: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: typography.fontWeights.bold,
  },
  androidPhoneBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#192229',
  },
  androidBadgePhoneIcon: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  androidCallerName: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.xxl + 2,
    fontWeight: typography.fontWeights.bold,
    marginBottom: 2,
  },
  androidCallingStatus: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: typography.fontSizes.sm,
    marginBottom: spacing.sm,
  },
  androidMobilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.5)',
  },
  androidPillIcon: {
    color: '#4ADE80',
    fontSize: 12,
    marginRight: 4,
  },
  androidPillText: {
    color: '#4ADE80',
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semiBold,
  },
  androidBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.md,
  },
  androidRippleCenter: {
    alignItems: 'center',
  },
  androidRippleText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: typography.fontSizes.xs - 1,
  },
});
