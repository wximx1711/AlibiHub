import React, { useState, useEffect } from 'react';
import {
  View,
  Alert,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/colors';
import { audioService } from '../services/audioService';

export default function ActiveCallScreen({ callPayload, onHangUp }) {
  const [seconds, setSeconds] = useState(0);
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);

  const caller = callPayload?.caller || {
    name: callPayload?.callerName || 'Người gọi',
    phoneNumber: callPayload?.callerPhone || '0901 234 567',
    role: callPayload?.callerRole || 'Cuộc gọi mô phỏng',
  };

  const dialogueList = callPayload?.dialogue && callPayload.dialogue.length > 0
    ? callPayload.dialogue
    : [
        'Alo em à, anh có việc gấp cần em xử lý ngay bây giờ!',
        'Dạ vâng anh, em đang ở ngoài một chút, có chuyện gì thế ạ?',
        'Dự án đang có lỗi cần em về mở máy xử lý trong 15 phút tới nhé.',
        'Dạ em hiểu rồi, em chào mọi người rồi phi về ngay đây ạ!',
      ];

  const ambientSound = callPayload?.ambientSound || 'none';
  const ambientVolume = callPayload?.ambientVolume ?? 0.25;

  // 1. Timer ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Play ambient sound and dialogue
  useEffect(() => {
    audioService.isMuted = false;
    audioService.voiceVolume = callPayload?.voiceVolume ?? 1;
    if (ambientSound && ambientSound !== 'none') {
      audioService.startAmbientSound(ambientSound, ambientVolume);
    }

    // Play first line
    if (dialogueList.length > 0) {
      audioService.speakDialogueLine(dialogueList[0]);
    }

    return () => {
      audioService.stopAll();
    };
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleNextDialogue = () => {
    if (currentDialogueIndex < dialogueList.length - 1) {
      const nextIdx = currentDialogueIndex + 1;
      setCurrentDialogueIndex(nextIdx);
      audioService.speakDialogueLine(dialogueList[nextIdx]);
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioService.setMuted(nextMuted);
  };

  const handleEndCall = () => {
    audioService.stopAll();
    if (onHangUp) {
      onHangUp({
        durationSeconds: seconds,
        status: 'completed',
        callerName: caller.name,
        callerPhone: caller.phoneNumber,
        scenarioTitle: callPayload?.title || callPayload?.scenarioTitle || 'Cuộc gọi mô phỏng',
      });
    }
  };

  const initials = caller.initials || caller.name?.substring(0, 2)?.toUpperCase() || 'AL';

  const getAmbientBadge = () => {
    switch (ambientSound) {
      case 'office':
        return '🏢 Bối cảnh: Văn phòng làm việc';
      case 'cafe':
        return '☕ Bối cảnh: Quán cà phê';
      case 'street':
        return '🚗 Bối cảnh: Đường phố / Xe cộ';
      case 'hospital':
        return '🏥 Bối cảnh: Bệnh viện';
      default:
        return '🔇 Âm thanh nền: Tắt';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070A12" />

      {/* Top Header */}
      <View style={styles.topInfo}>
        <Text style={styles.timer}>{formatTime(seconds)}</Text>
        <Text style={styles.ambientBadge}>{getAmbientBadge()}</Text>
      </View>

      {/* Caller Info */}
      <View style={styles.callerWrap}>
        <View style={[styles.avatarCircle, { backgroundColor: caller.avatarBg || colors.primary }]}>
          {caller.avatarUrl ? <Image source={{ uri: caller.avatarUrl }} style={{ width: '100%', height: '100%', borderRadius: 100 }} /> : <Text style={styles.avatarText}>{initials}</Text>}
        </View>
        <Text style={styles.callerName}>{caller.name}</Text>
        <Text style={styles.callerPhone}>{caller.phoneNumber}</Text>
      </View>

      {/* Interactive Dialogue Subtitles Box */}
      <View style={styles.dialogueBox}>
        <View style={styles.dialogueHeader}>
          <Text style={styles.dialogueStepBadge}>
            Đoạn thoại {currentDialogueIndex + 1} / {dialogueList.length}
          </Text>
          <Text style={styles.speakerNotice}>Lời thoại tổng hợp</Text>
        </View>

        <Text style={styles.dialogueText}>
          "{dialogueList[currentDialogueIndex]}"
        </Text>

        {currentDialogueIndex < dialogueList.length - 1 ? (
          <TouchableOpacity
            style={styles.nextDialogueBtn}
            onPress={handleNextDialogue}
            activeOpacity={0.8}
          >
            <Text style={styles.nextDialogueText}>
              Chạm để phát câu tiếp theo ⏩
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.finishedDialogueNotice}>
            ✓ Đã phát hết đoạn thoại kịch bản
          </Text>
        )}
      </View>

      {/* In-Call Controls Pad */}
      <View style={styles.controlsWrap}>
        <View style={styles.controlRow}>
          <TouchableOpacity
            style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
            onPress={handleToggleMute}
          >
            <Text style={styles.controlIcon}>{isMuted ? '🔇' : '🎤'}</Text>
            <Text style={styles.controlText}>{isMuted ? 'Đã tắt tiếng' : 'Tắt tiếng'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlBtn, isSpeaker && styles.controlBtnActive]}
            onPress={async () => { try { await audioService.setSpeaker(!isSpeaker); setIsSpeaker(!isSpeaker); } catch { Alert.alert('Âm thanh', 'Thiết bị không hỗ trợ chuyển đường âm thanh.'); } }}
          >
            <Text style={styles.controlIcon}>📢</Text>
            <Text style={styles.controlText}>Loa ngoài</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlBtn} onPress={() => audioService.speakDialogueLine(dialogueList[currentDialogueIndex])}>
            <Text style={styles.controlIcon}>↻</Text>
            <Text style={styles.controlText}>Nghe lại</Text>
          </TouchableOpacity>
        </View>

        {/* Hang up button */}
        <TouchableOpacity style={styles.hangUpBtn} onPress={handleEndCall} activeOpacity={0.85}>
          <Text style={styles.hangUpIcon}>📞</Text>
          <Text style={styles.hangUpText}>KẾT THÚC CUỘC GỌI</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070A12',
    justifyContent: 'space-between',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  topInfo: {
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  timer: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.display,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  ambientBadge: {
    color: colors.accentLight,
    fontSize: typography.fontSizes.xs,
    marginTop: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  callerWrap: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: typography.fontWeights.bold,
  },
  callerName: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    marginBottom: 2,
  },
  callerPhone: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.sm,
  },
  dialogueBox: {
    backgroundColor: colors.bgCardElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  dialogueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dialogueStepBadge: {
    color: colors.accentLight,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
  },
  speakerNotice: {
    color: colors.success,
    fontSize: typography.fontSizes.xs - 1,
  },
  dialogueText: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.md,
    lineHeight: 24,
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  nextDialogueBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  nextDialogueText: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  finishedDialogueNotice: {
    color: colors.success,
    fontSize: typography.fontSizes.xs,
    textAlign: 'center',
    fontWeight: typography.fontWeights.medium,
  },
  controlsWrap: {
    paddingBottom: spacing.lg,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.xl,
  },
  controlBtn: {
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
    minWidth: 88,
  },
  controlBtnActive: {
    backgroundColor: colors.primary + '35',
    borderColor: colors.primary,
  },
  controlIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  controlText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
  },
  hangUpBtn: {
    backgroundColor: colors.callDecline,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md + 2,
    borderRadius: borderRadius.pill,
    shadowColor: colors.callDecline,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  hangUpIcon: {
    fontSize: 22,
    color: '#FFFFFF',
    marginRight: spacing.sm,
    transform: [{ rotate: '135deg' }],
  },
  hangUpText: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 1,
  },
});

