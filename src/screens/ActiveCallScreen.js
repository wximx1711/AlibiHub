import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Alert,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/colors';
import { audioService } from '../services/audioService';
import { getVoiceProfile, getDynamicRoleDialogue } from '../services/dialogueService';
import CallIcon from '../components/CallIcon';

export default function ActiveCallScreen({ callPayload, onHangUp }) {
  // Appearance determined before call: 'android' | 'ios' | 'zalo' | 'messenger'
  const appearance = callPayload?.callAppearance || 'android';

  const [seconds, setSeconds] = useState(0);
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const callEndedRef = useRef(false);

  const caller = callPayload?.caller || {
    name: callPayload?.callerName || 'Người gọi',
    phoneNumber: callPayload?.callerPhone || '0901 234 567',
    role: callPayload?.callerRole || 'Cuộc gọi mô phỏng',
  };

  const scenarioTitle = callPayload?.title || callPayload?.scenarioTitle || '';
  const category = callPayload?.category || caller?.role || '';
  const voiceProfile = getVoiceProfile(caller, scenarioTitle, category);
  const dialogueList =
    callPayload?.dialogue && callPayload.dialogue.length > 0
      ? callPayload.dialogue
      : getDynamicRoleDialogue(caller, scenarioTitle, category);

  const ambientSound = callPayload?.ambientSound || 'none';
  const ambientVolume = callPayload?.ambientVolume ?? 0.25;

  // 1. Timer ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Play ambient sound and opening line ONCE on call start (no auto-progression)
  useEffect(() => {
    callEndedRef.current = false;
    audioService.isMuted = false;
    audioService.voiceVolume = callPayload?.voiceVolume ?? 1;

    if (ambientSound && ambientSound !== 'none') {
      audioService.startAmbientSound(ambientSound, ambientVolume);
    }

    // Play first line once
    if (dialogueList && dialogueList.length > 0) {
      audioService.speakDialogueLine(dialogueList[0], null, voiceProfile);
    }

    return () => {
      callEndedRef.current = true;
      audioService.stopAll();
    };
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // User-triggered continuation (Discreet tap on avatar/center or Continue button)
  const handleNextDialogue = () => {
    if (callEndedRef.current) return;
    const nextIdx =
      currentDialogueIndex < dialogueList.length - 1
        ? currentDialogueIndex + 1
        : currentDialogueIndex;
    setCurrentDialogueIndex(nextIdx);
    audioService.speakDialogueLine(dialogueList[nextIdx], null, voiceProfile);
  };

  // Unambiguous Mute: Only mutes/unmutes audio, never alters dialogue flow
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioService.setMuted(nextMuted);
  };

  // Immediate hang-up with complete audio termination
  const handleEndCall = () => {
    callEndedRef.current = true;
    audioService.stopAll();
    if (onHangUp) {
      onHangUp({
        durationSeconds: seconds,
        status: 'completed',
        callerName: caller.name,
        callerPhone: caller.phoneNumber,
        scenarioTitle:
          callPayload?.title ||
          callPayload?.scenarioTitle ||
          'Cuộc gọi mô phỏng',
      });
    }
  };

  const initials =
    caller.initials || caller.name?.substring(0, 2)?.toUpperCase() || 'AL';

  const isZalo = appearance === 'zalo';
  const isIos = appearance === 'ios';
  const isMessenger = appearance === 'messenger';

  // ----------------------------------------------------
  // 1. ZALO ACTIVE CALL
  // ----------------------------------------------------
  if (isZalo) {
    return (
      <View style={[styles.container, styles.zaloContainer]}>
        <StatusBar barStyle="light-content" backgroundColor="#0068FF" />

        <View style={styles.zaloTop}>
          <Text style={styles.zaloAppName}>Zalo</Text>
          <Text style={styles.zaloTimer}>{formatTime(seconds)}</Text>
        </View>

        {/* Center: Tap to discreetly continue dialogue */}
        <TouchableOpacity
          style={styles.zaloCenter}
          activeOpacity={0.9}
          onPress={handleNextDialogue}
          testID="caller-avatar-touch"
        >
          <View style={styles.zaloAvatarCircle}>
            {caller.avatarUrl ? (
              <Image source={{ uri: caller.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.zaloAvatarInitials}>{initials}</Text>
            )}
          </View>
          <Text style={styles.zaloCallerName} numberOfLines={1}>
            {caller.name}
          </Text>
        </TouchableOpacity>

        {/* Center Keypad Pill */}
        <View style={styles.zaloMidKeypadRow}>
          <View style={styles.zaloKeypadPill}>
            <CallIcon name="ic_keypad" size={16} style={{ marginRight: 6 }} />
            <Text style={styles.zaloKeypadText}>Bàn phím</Text>
          </View>
        </View>

        {/* Bottom 3 Controls (Speaker, End, Mic) */}
        <View style={styles.zaloBottomControls}>
          <View style={styles.controlItem}>
            <TouchableOpacity
              style={[styles.zaloRoundBtn, isSpeaker && styles.zaloRoundBtnActive]}
              onPress={async () => {
                try {
                  await audioService.setSpeaker(!isSpeaker);
                  setIsSpeaker(!isSpeaker);
                } catch {
                  Alert.alert('Âm thanh', 'Thiết bị không hỗ trợ chuyển loa.');
                }
              }}
              activeOpacity={0.7}
            >
              <CallIcon name="ic_speaker" size={26} />
            </TouchableOpacity>
            <Text style={styles.zaloControlLabel}>Loa ngoài</Text>
          </View>

          {/* End Call (Icon only, no text label) */}
          <View style={styles.controlItem}>
            <TouchableOpacity
              style={styles.zaloEndCallBtn}
              onPress={handleEndCall}
              activeOpacity={0.85}
              testID="end-call-btn"
              accessibilityLabel="KẾT THÚC CUỘC GỌI"
            >
              <CallIcon name="phone_hangup" size={32} />
            </TouchableOpacity>
          </View>

          {/* Mute (Mic - Unambiguous mute only) */}
          <View style={styles.controlItem}>
            <TouchableOpacity
              style={[styles.zaloRoundBtn, isMuted && styles.zaloRoundBtnActive]}
              onPress={handleToggleMute}
              activeOpacity={0.7}
              testID="mute-btn"
              accessibilityLabel={isMuted ? 'Đã tắt tiếng' : 'Tắt tiếng'}
            >
              <CallIcon name={isMuted ? 'ic_mic_off' : 'ic_mic'} size={26} />
            </TouchableOpacity>
            <Text style={styles.zaloControlLabel} onPress={handleToggleMute}>
              {isMuted ? 'Đã tắt tiếng' : 'Tắt tiếng'}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // ----------------------------------------------------
  // 2. MESSENGER ACTIVE CALL
  // ----------------------------------------------------
  if (isMessenger) {
    return (
      <View style={[styles.container, styles.messengerContainer]}>
        <StatusBar barStyle="light-content" backgroundColor="#2C2D32" />

        {/* Top Header: Back Arrow & Camera Off Toggle */}
        <View style={styles.messengerTopHeader}>
          <TouchableOpacity onPress={handleEndCall} activeOpacity={0.7} style={styles.messengerBackBtn}>
            <Text style={styles.messengerBackArrow}>←</Text>
          </TouchableOpacity>
          <View style={styles.messengerCameraTogglePill}>
            <Text style={styles.messengerCameraToggleIcon}>📹</Text>
          </View>
        </View>

        {/* Center: Tap to discreetly continue dialogue */}
        <TouchableOpacity
          style={styles.messengerCenter}
          activeOpacity={0.9}
          onPress={handleNextDialogue}
          testID="caller-avatar-touch"
        >
          <View style={styles.messengerAvatarCircle}>
            {caller.avatarUrl ? (
              <Image source={{ uri: caller.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.messengerAvatarInitials}>{initials}</Text>
            )}
          </View>
          <Text style={styles.messengerCallerName} numberOfLines={1}>
            {caller.name}
          </Text>
          <Text style={styles.messengerTimer}>{formatTime(seconds)}</Text>
        </TouchableOpacity>

        {/* Bottom Dock */}
        <View style={styles.messengerBottomDock}>
          <View style={styles.messengerDockHandle} />
          <View style={styles.messengerDockButtonsRow}>
            {/* Add person */}
            <TouchableOpacity style={styles.messengerDockBtnDark} activeOpacity={0.7}>
              <Text style={styles.messengerDockIconLight}>+👤</Text>
            </TouchableOpacity>

            {/* Speaker */}
            <TouchableOpacity
              style={[styles.messengerDockBtnWhite, isSpeaker && styles.messengerDockBtnWhiteActive]}
              onPress={async () => {
                try {
                  await audioService.setSpeaker(!isSpeaker);
                  setIsSpeaker(!isSpeaker);
                } catch {
                  Alert.alert('Âm thanh', 'Thiết bị không hỗ trợ chuyển loa.');
                }
              }}
              activeOpacity={0.7}
            >
              <CallIcon name="ic_speaker" size={24} tintColor="#000000" />
            </TouchableOpacity>

            {/* Mic / Mute (Unambiguous) */}
            <TouchableOpacity
              style={[styles.messengerDockBtnWhite, isMuted && styles.messengerDockBtnWhiteActive]}
              onPress={handleToggleMute}
              activeOpacity={0.7}
              testID="mute-btn"
              accessibilityLabel={isMuted ? 'Đã tắt tiếng' : 'Tắt tiếng'}
            >
              <CallIcon name={isMuted ? 'ic_mic_off' : 'ic_mic'} size={24} tintColor="#000000" />
            </TouchableOpacity>

            {/* End Call (Icon only) */}
            <TouchableOpacity
              style={styles.messengerDockBtnRed}
              onPress={handleEndCall}
              activeOpacity={0.85}
              testID="end-call-btn"
              accessibilityLabel="KẾT THÚC CUỘC GỌI"
            >
              <CallIcon name="phone_hangup" size={28} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ----------------------------------------------------
  // 3. IOS ACTIVE CALL
  // ----------------------------------------------------
  if (isIos) {
    return (
      <View style={[styles.container, styles.iosContainer]}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />

        {/* Top: Tap to discreetly continue dialogue */}
        <TouchableOpacity
          style={styles.iosTop}
          activeOpacity={0.9}
          onPress={handleNextDialogue}
          testID="caller-avatar-touch"
        >
          <Text style={styles.iosCallerName} numberOfLines={1}>
            {caller.name}
          </Text>
          <Text style={styles.iosTimer}>{formatTime(seconds)}</Text>
        </TouchableOpacity>

        {/* 6-Circle Grid */}
        <View style={styles.iosGridSection}>
          <View style={styles.iosGridRow}>
            {/* Mute (Unambiguous) */}
            <View style={styles.iosGridItem}>
              <TouchableOpacity
                style={[styles.iosCircleBtn, isMuted && styles.iosCircleBtnActive]}
                onPress={handleToggleMute}
                activeOpacity={0.7}
                testID="mute-btn"
                accessibilityLabel={isMuted ? 'Đã tắt tiếng' : 'Tắt tiếng'}
              >
                <CallIcon
                  name={isMuted ? 'ic_mic_off' : 'ic_mic'}
                  size={24}
                  tintColor={isMuted ? '#000000' : '#FFFFFF'}
                />
              </TouchableOpacity>
              <Text style={styles.iosGridLabel} onPress={handleToggleMute}>
                {isMuted ? 'Đã tắt tiếng' : 'Tắt tiếng'}
              </Text>
            </View>

            {/* Keypad */}
            <View style={styles.iosGridItem}>
              <View style={styles.iosCircleBtn}>
                <CallIcon name="ic_keypad" size={24} />
              </View>
              <Text style={styles.iosGridLabel}>bàn phím</Text>
            </View>

            {/* Audio / Speaker */}
            <View style={styles.iosGridItem}>
              <TouchableOpacity
                style={[styles.iosCircleBtn, isSpeaker && styles.iosCircleBtnActive]}
                onPress={async () => {
                  try {
                    await audioService.setSpeaker(!isSpeaker);
                    setIsSpeaker(!isSpeaker);
                  } catch {
                    Alert.alert('Âm thanh', 'Thiết bị không hỗ trợ.');
                  }
                }}
                activeOpacity={0.7}
              >
                <CallIcon
                  name="ic_speaker"
                  size={24}
                  tintColor={isSpeaker ? '#000000' : '#FFFFFF'}
                />
              </TouchableOpacity>
              <Text style={styles.iosGridLabel}>loa ngoài</Text>
            </View>
          </View>

          <View style={styles.iosGridRow}>
            {/* Add Call */}
            <View style={styles.iosGridItem}>
              <View style={styles.iosCircleBtn}>
                <Text style={styles.iosGridIconText}>+</Text>
              </View>
              <Text style={styles.iosGridLabel}>thêm</Text>
            </View>

            {/* FaceTime */}
            <View style={styles.iosGridItem}>
              <View style={styles.iosCircleBtn}>
                <Text style={styles.iosGridIconText}>📹</Text>
              </View>
              <Text style={styles.iosGridLabel}>FaceTime</Text>
            </View>

            {/* Tiếp tục / Nghe tiếp (Discreet Continue Button) */}
            <View style={styles.iosGridItem}>
              <TouchableOpacity
                style={styles.iosCircleBtn}
                onPress={handleNextDialogue}
                activeOpacity={0.7}
                testID="continue-dialogue-btn"
                accessibilityLabel="tiếp tục"
              >
                <Text style={styles.iosGridIconText}>▶</Text>
              </TouchableOpacity>
              <Text style={styles.iosGridLabel}>tiếp tục</Text>
            </View>
          </View>
        </View>

        {/* Bottom Red End Call Button (Icon only) */}
        <View style={styles.iosBottom}>
          <TouchableOpacity
            style={styles.iosEndBtn}
            onPress={handleEndCall}
            activeOpacity={0.85}
            testID="end-call-btn"
            accessibilityLabel="KẾT THÚC CUỘC GỌI"
          >
            <CallIcon name="phone_hangup" size={32} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ----------------------------------------------------
  // 4. ANDROID ACTIVE CALL (Default)
  // ----------------------------------------------------
  return (
    <View style={[styles.container, styles.androidContainer]}>
      <StatusBar barStyle="light-content" backgroundColor="#1A2228" />

      {/* Top Center: Circular Avatar & Identity (Tap to discreetly continue dialogue) */}
      <TouchableOpacity
        style={styles.androidTop}
        activeOpacity={0.9}
        onPress={handleNextDialogue}
        testID="caller-avatar-touch"
      >
        <View style={styles.androidAvatarCircle}>
          {caller.avatarUrl ? (
            <Image source={{ uri: caller.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.androidAvatarInitials}>{initials}</Text>
          )}
        </View>
        <Text style={styles.androidCallerName} numberOfLines={1}>
          {caller.name}
        </Text>
        <Text style={styles.androidSubtext}>
          {caller.phoneNumber || 'Việt Nam'}
        </Text>
        <Text style={styles.androidTimer}>{formatTime(seconds)}</Text>
      </TouchableOpacity>

      {/* 6-Grid Icon Pad */}
      <View style={styles.androidGrid}>
        <View style={styles.androidGridRow}>
          {/* Ghi âm */}
          <View style={styles.androidGridItem}>
            <View style={styles.androidIconBtn}>
              <Text style={styles.androidIconText}>⏺️</Text>
            </View>
            <Text style={styles.androidIconLabel}>Ghi âm</Text>
          </View>

          {/* Giữ máy */}
          <View style={styles.androidGridItem}>
            <View style={styles.androidIconBtn}>
              <Text style={styles.androidIconText}>⏸️</Text>
            </View>
            <Text style={styles.androidIconLabel}>Giữ máy</Text>
          </View>

          {/* Thêm cuộc gọi */}
          <View style={styles.androidGridItem}>
            <View style={styles.androidIconBtn}>
              <Text style={styles.androidIconText}>➕</Text>
            </View>
            <Text style={styles.androidIconLabel}>Thêm cuộc gọi</Text>
          </View>
        </View>

        <View style={styles.androidGridRow}>
          {/* Im lặng / Tắt tiếng (Unambiguous Mute) */}
          <View style={styles.androidGridItem}>
            <TouchableOpacity
              style={[styles.androidIconBtn, isMuted && styles.androidIconBtnActive]}
              onPress={handleToggleMute}
              activeOpacity={0.7}
              testID="mute-btn"
              accessibilityLabel={isMuted ? 'Đã tắt tiếng' : 'Tắt tiếng'}
            >
              <CallIcon name={isMuted ? 'ic_mic_off' : 'ic_mic'} size={22} />
            </TouchableOpacity>
            <Text style={styles.androidIconLabel} onPress={handleToggleMute}>
              {isMuted ? 'Đã tắt tiếng' : 'Tắt tiếng'}
            </Text>
          </View>

          {/* Video */}
          <View style={styles.androidGridItem}>
            <View style={styles.androidIconBtn}>
              <Text style={styles.androidIconText}>📹</Text>
            </View>
            <Text style={styles.androidIconLabel}>Video</Text>
          </View>

          {/* Tiếp tục / Nghe tiếp (Discreet Continue Button) */}
          <View style={styles.androidGridItem}>
            <TouchableOpacity
              style={styles.androidIconBtn}
              onPress={handleNextDialogue}
              activeOpacity={0.7}
              testID="continue-dialogue-btn"
              accessibilityLabel="Tiếp tục lời thoại"
            >
              <Text style={styles.androidIconText}>▶️</Text>
            </TouchableOpacity>
            <Text style={styles.androidIconLabel}>Tiếp tục</Text>
          </View>
        </View>
      </View>

      {/* Bottom 3 Controls (Speaker, Big Red End, Keypad) */}
      <View style={styles.androidBottomRow}>
        {/* Speaker */}
        <TouchableOpacity
          style={[styles.androidBottomSideBtn, isSpeaker && styles.androidBottomSideBtnActive]}
          onPress={async () => {
            try {
              await audioService.setSpeaker(!isSpeaker);
              setIsSpeaker(!isSpeaker);
            } catch {
              Alert.alert('Âm thanh', 'Thiết bị không hỗ trợ.');
            }
          }}
          activeOpacity={0.7}
        >
          <CallIcon name="ic_speaker" size={22} />
        </TouchableOpacity>

        {/* Center End Call Button (Big round red button with white curved handset) */}
        <View style={styles.androidEndCallWrap}>
          <TouchableOpacity
            style={styles.androidEndCallBtn}
            onPress={handleEndCall}
            activeOpacity={0.85}
            testID="end-call-btn"
            accessibilityLabel="KẾT THÚC CUỘC GỌI"
          >
            <CallIcon name="phone_hangup" size={32} />
          </TouchableOpacity>
        </View>

        {/* Keypad */}
        <View style={styles.androidBottomSideBtn}>
          <CallIcon name="ic_keypad" size={22} />
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
  controlItem: {
    alignItems: 'center',
    minWidth: 72,
  },

  // ----------------------------------------------------
  // ZALO ACTIVE STYLES
  // ----------------------------------------------------
  zaloContainer: {
    backgroundColor: '#0068FF',
  },
  zaloTop: {
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  zaloAppName: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 15,
    fontWeight: typography.fontWeights.semiBold,
  },
  zaloTimer: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: typography.fontWeights.bold,
    marginTop: 2,
  },
  zaloCenter: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  zaloAvatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    overflow: 'hidden',
  },
  zaloAvatarInitials: {
    color: '#0068FF',
    fontSize: 36,
    fontWeight: typography.fontWeights.bold,
  },
  zaloCallerName: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
  },
  zaloMidKeypadRow: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  zaloKeypadPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.16)',
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    borderRadius: borderRadius.pill,
  },
  zaloKeypadText: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
  },
  zaloBottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingBottom: spacing.xl,
  },
  zaloRoundBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  zaloRoundBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  zaloEndCallBtn: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  zaloControlLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: typography.fontWeights.medium,
    textAlign: 'center',
  },

  // ----------------------------------------------------
  // MESSENGER ACTIVE STYLES
  // ----------------------------------------------------
  messengerContainer: {
    backgroundColor: '#2C2D32',
  },
  messengerTopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
  },
  messengerBackBtn: {
    padding: spacing.xs,
  },
  messengerBackArrow: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  messengerCameraTogglePill: {
    width: 44,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3E4047',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messengerCameraToggleIcon: {
    fontSize: 14,
  },
  messengerCenter: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  messengerAvatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  messengerAvatarInitials: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: typography.fontWeights.bold,
  },
  messengerCallerName: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    marginBottom: 4,
  },
  messengerTimer: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 15,
    fontWeight: typography.fontWeights.medium,
  },
  messengerBottomDock: {
    backgroundColor: '#18191E',
    borderRadius: 28,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : spacing.lg,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.xs,
  },
  messengerDockHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  messengerDockButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  messengerDockBtnDark: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#3A3B42',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messengerDockIconLight: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  messengerDockBtnWhite: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messengerDockBtnWhiteActive: {
    backgroundColor: '#CBD5E1',
  },
  messengerDockBtnRed: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },

  // ----------------------------------------------------
  // IOS ACTIVE STYLES
  // ----------------------------------------------------
  iosContainer: {
    backgroundColor: '#000000',
  },
  iosTop: {
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  iosCallerName: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.xxl + 2,
    fontWeight: typography.fontWeights.semiBold,
    letterSpacing: 0.3,
  },
  iosTimer: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: typography.fontSizes.sm,
    marginTop: 2,
  },
  iosGridSection: {
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  iosGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  iosGridItem: {
    alignItems: 'center',
    width: 76,
  },
  iosCircleBtn: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#262628',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  iosCircleBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  iosGridIconText: {
    color: '#FFFFFF',
    fontSize: 20,
  },
  iosGridLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: typography.fontWeights.medium,
    textAlign: 'center',
  },
  iosBottom: {
    alignItems: 'center',
    paddingBottom: spacing.xxl,
  },
  iosEndBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },

  // ----------------------------------------------------
  // ANDROID ACTIVE STYLES
  // ----------------------------------------------------
  androidContainer: {
    backgroundColor: '#192229',
  },
  androidTop: {
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  androidAvatarCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  androidAvatarInitials: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: typography.fontWeights.bold,
  },
  androidCallerName: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.xl + 2,
    fontWeight: typography.fontWeights.bold,
  },
  androidSubtext: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: typography.fontSizes.xs,
    marginTop: 1,
  },
  androidTimer: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: typography.fontSizes.sm,
    marginTop: 2,
    fontWeight: typography.fontWeights.medium,
  },
  androidGrid: {
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  androidGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  androidGridItem: {
    alignItems: 'center',
    width: 84,
  },
  androidIconBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  androidIconBtnActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
  },
  androidIconText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  androidIconLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    textAlign: 'center',
  },
  androidBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  androidBottomSideBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  androidBottomSideBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  androidEndCallWrap: {
    alignItems: 'center',
  },
  androidEndCallBtn: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 6,
  },
});
