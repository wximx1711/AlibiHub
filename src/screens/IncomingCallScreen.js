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
import { generateTtsAudio } from '../services/aiService';
import { getGeminiVoiceForCaller, getCallerOpeningGreeting } from '../services/dialogueService';

export default function IncomingCallScreen({
  callPayload,
  onAccept,
  onDecline,
}) {
  // Appearance is configured before call: 'android' | 'ios' | 'zalo' | 'messenger'
  const appearance = callPayload?.callAppearance || 'android';

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const prefetchedAudioRef = useRef(null);
  const caller = callPayload?.caller || {
    name: callPayload?.callerName || 'Người gọi ẩn danh',
    phoneNumber: callPayload?.callerPhone || '0901 234 567',
    role: callPayload?.callerRole || 'Cuộc gọi quan trọng',
  };

  useEffect(() => {
    // Background pre-fetch opening greeting audio while ringing so call starts instantly
    try {
      const voiceProfile = getGeminiVoiceForCaller(
        caller,
        callPayload?.title,
        caller.role,
        callPayload?.voiceId || caller?.voiceId
      );
      const greeting = getCallerOpeningGreeting({
        caller,
        scenarioTitle: callPayload?.title,
        category: caller.role,
        dialogueList: callPayload?.dialogue,
      });
      generateTtsAudio({
        text: greeting,
        voiceName: voiceProfile?.geminiVoice || 'Kore',
        callerRole: caller.role,
        callerName: caller.name,
        gender: caller.gender || 'auto',
      })
        .then((res) => {
          if (res?.audioBase64) {
            prefetchedAudioRef.current = res.audioBase64;
          }
        })
        .catch(() => {});
    } catch (_) {}

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
    if (onAccept) onAccept({
      ...callPayload,
      callAppearance: appearance,
      openingAudioBase64: prefetchedAudioRef.current,
    });
  };

  const handleDecline = () => {
    audioService.stopIncomingCallAlert();
    if (onDecline) onDecline({ ...callPayload, callAppearance: appearance });
  };

  const initials =
    caller.initials || caller.name?.substring(0, 2)?.toUpperCase() || 'AL';

  // ----------------------------------------------------
  // 1. ZALO STYLE
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
              <CallIcon name="phone_hangup" size={30} />
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
              <CallIcon name="phone_accept" size={30} />
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
  // 2. MESSENGER STYLE (Target Image 2 Palette & Header)
  // ----------------------------------------------------
  if (appearance === 'messenger') {
    return (
      <View style={[styles.container, styles.messengerContainer]}>
        <StatusBar barStyle="dark-content" backgroundColor="#DAD8C3" />

        {/* Floating Top Bar (Matching Image 2) */}
        <View style={styles.messengerTopBar}>
          <View style={styles.messengerTopLeft}>
            <CallIcon name="ic_minimize" size={20} tintColor="#3A3B35" />
          </View>
          <View style={styles.messengerTopRight}>
            <CallIcon name="ic_add_user" size={22} tintColor="#3A3B35" style={{ marginRight: 16 }} />
            <CallIcon name="ic_more_vert" size={22} tintColor="#3A3B35" />
          </View>
        </View>

        {/* Center Section: Rounded Avatar & Caller Info */}
        <View style={styles.messengerCenter}>
          <Animated.View
            style={[
              styles.messengerAvatarWrap,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <View style={styles.messengerAvatarCircle}>
              {caller.avatarUrl ? (
                <Image
                  source={{ uri: caller.avatarUrl }}
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.messengerAvatarInitials}>{initials}</Text>
              )}
            </View>
          </Animated.View>

          <Text style={styles.messengerCallerName} numberOfLines={1}>
            {caller.name}
          </Text>
          <Text style={styles.messengerSubtitle}>Messenger: Cuộc gọi đến...</Text>
        </View>

        {/* Bottom Actions: Decline (Red) & Accept (Green) */}
        <View style={styles.messengerBottomRow}>
          <View style={styles.actionCol}>
            <TouchableOpacity
              style={[styles.callCircleBtn, styles.messengerDeclineBtn]}
              onPress={handleDecline}
              activeOpacity={0.8}
            >
              <CallIcon name="phone_hangup" size={30} />
            </TouchableOpacity>
            <Text style={styles.messengerActionLabel} onPress={handleDecline}>
              Từ chối
            </Text>
          </View>

          <View style={styles.actionCol}>
            <TouchableOpacity
              style={[styles.callCircleBtn, styles.messengerAcceptBtn]}
              onPress={handleAccept}
              activeOpacity={0.8}
            >
              <CallIcon name="phone_accept" size={30} />
            </TouchableOpacity>
            <Text style={styles.messengerActionLabel} onPress={handleAccept}>
              Trả lời
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // ----------------------------------------------------
  // 3. IOS STYLE (Target Image 3)
  // ----------------------------------------------------
  if (appearance === 'ios') {
    return (
      <View style={[styles.container, styles.iosContainer]}>
        <StatusBar barStyle="light-content" backgroundColor="#141414" />

        {/* Top Header / Status Time */}
        <View style={styles.iosTopStatus}>
          <Text style={styles.iosTimeText}>17:04</Text>
        </View>

        {/* Caller Info: Bold White Title & Subtitle */}
        <View style={styles.iosTop}>
          <Text style={styles.iosCallerName} numberOfLines={1}>
            {caller.phoneNumber || caller.name}
          </Text>
          <Text style={styles.iosSubtext}>
            {caller.phoneNumber ? caller.name : (caller.role || 'di động')}
          </Text>
        </View>

        {/* Secondary Actions: Alarm Clock & Message */}
        <View style={styles.iosSecondaryRow}>
          <View style={styles.iosSecondaryItem}>
            <CallIcon name="ic_reminder" size={26} tintColor="#FFFFFF" />
            <Text style={styles.iosSecondaryText}>Nhắc tôi</Text>
          </View>
          <View style={styles.iosSecondaryItem}>
            <CallIcon name="ic_message" size={26} tintColor="#FFFFFF" />
            <Text style={styles.iosSecondaryText}>Tin nhắn</Text>
          </View>
        </View>

        {/* Bottom Actions: Decline ("Từ chối") & Accept ("Chấp nhận") */}
        <View style={styles.iosBottomActions}>
          <View style={styles.actionCol}>
            <TouchableOpacity
              style={[styles.callCircleBtn, styles.iosDeclineBtn]}
              onPress={handleDecline}
              activeOpacity={0.8}
            >
              <CallIcon name="phone_hangup" size={30} />
            </TouchableOpacity>
            <Text style={styles.iosActionLabel} onPress={handleDecline}>
              Từ chối
            </Text>
          </View>

          <View style={styles.actionCol}>
            <TouchableOpacity
              style={[styles.callCircleBtn, styles.iosAcceptBtn]}
              onPress={handleAccept}
              activeOpacity={0.8}
            >
              <CallIcon name="phone_accept" size={30} />
            </TouchableOpacity>
            <Text style={styles.iosActionLabel} onPress={handleAccept}>
              Chấp nhận
            </Text>
          </View>
        </View>

        {/* White iOS Home Indicator */}
        <View style={styles.iosHomeIndicatorWrap}>
          <View style={styles.iosHomeIndicator} />
        </View>
      </View>
    );
  }

  // ----------------------------------------------------
  // 4. ANDROID STYLE (Fixed Image 1 - Clean Handset Icons, No Emojis)
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
          {/* Small Green Phone Badge (Clean CallIcon only) */}
          <View style={styles.androidPhoneBadge}>
            <CallIcon name="phone_accept" size={14} />
          </View>
        </View>

        <Text style={styles.androidCallerName} numberOfLines={1}>
          {caller.name}
        </Text>
        <Text style={styles.androidCallingStatus}>Đang gọi đến...</Text>

        {/* Green pill tag: Mobile / Caller Role (Clean CallIcon only) */}
        <View style={styles.androidMobilePill}>
          <CallIcon name="phone_accept" size={12} style={{ marginRight: 6 }} />
          <Text style={styles.androidPillText}>
            {caller.role || caller.phoneNumber || 'Sự cố gia đình'}
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
            <CallIcon name="phone_hangup" size={30} />
          </TouchableOpacity>
          <Text style={styles.actionLabelText} onPress={handleDecline}>
            Từ chối
          </Text>
        </View>

        {/* Center Ripple Prompt */}
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
            <CallIcon name="phone_accept" size={30} />
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
    width: 72,
    height: 72,
    borderRadius: 36,
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
  // MESSENGER STYLES (Target Image 2 Theme)
  // ----------------------------------------------------
  messengerContainer: {
    backgroundColor: '#DAD8C3',
  },
  messengerTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingTop: Platform.OS === 'ios' ? 8 : spacing.xs,
  },
  messengerTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messengerTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messengerCenter: {
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  messengerAvatarWrap: {
    marginBottom: spacing.lg,
  },
  messengerAvatarCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#C5C3AF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E8E6D6',
  },
  messengerAvatarInitials: {
    color: '#3A3B35',
    fontSize: 38,
    fontWeight: typography.fontWeights.bold,
  },
  messengerCallerName: {
    color: '#262722',
    fontSize: typography.fontSizes.xxl + 2,
    fontWeight: typography.fontWeights.bold,
    marginBottom: spacing.xs,
  },
  messengerSubtitle: {
    color: '#55564E',
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
  },
  messengerBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  messengerDeclineBtn: {
    backgroundColor: '#FA3E3E',
    shadowColor: '#FA3E3E',
  },
  messengerAcceptBtn: {
    backgroundColor: '#34A853',
    shadowColor: '#34A853',
  },
  messengerActionLabel: {
    color: '#262722',
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    marginTop: 2,
  },

  // ----------------------------------------------------
  // IOS STYLES (Target Image 3)
  // ----------------------------------------------------
  iosContainer: {
    backgroundColor: '#141414',
  },
  iosTopStatus: {
    alignItems: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingTop: Platform.OS === 'ios' ? 0 : spacing.xs,
  },
  iosTimeText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: typography.fontWeights.semiBold,
  },
  iosTop: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  iosCallerName: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  iosSubtext: {
    color: '#8E8E93',
    fontSize: 18,
    fontWeight: '400',
  },
  iosSecondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    marginBottom: spacing.xxl,
  },
  iosSecondaryItem: {
    alignItems: 'center',
  },
  iosSecondaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '400',
    marginTop: 6,
  },
  iosBottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 36,
    marginBottom: spacing.xl,
  },
  iosDeclineBtn: {
    backgroundColor: '#EB5545',
    shadowColor: '#EB5545',
  },
  iosAcceptBtn: {
    backgroundColor: '#34C759',
    shadowColor: '#34C759',
  },
  iosActionLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '400',
    marginTop: 4,
  },
  iosHomeIndicatorWrap: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  iosHomeIndicator: {
    width: 134,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },

  // ----------------------------------------------------
  // ANDROID STYLES (Fixed Image 1)
  // ----------------------------------------------------
  androidContainer: {
    backgroundColor: '#1A2228',
  },
  androidTop: {
    alignItems: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
  },
  androidCenter: {
    alignItems: 'center',
    marginTop: spacing.lg,
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
    borderColor: '#1A2228',
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
    paddingVertical: 5,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.5)',
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
