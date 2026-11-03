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
import {
  detectCallerPersona,
  getVoiceProfile,
  getDynamicRoleDialogue,
  getCallerOpeningGreeting,
  selectVietnameseVoice,
  generateOfflineCallReply,
  getGeminiVoiceForCaller,
} from '../services/dialogueService';
import { generateCallReply, generateTtsAudio } from '../services/aiService';
import CallIcon from '../components/CallIcon';

let SpeechRecognizer = null;
try {
  const mod = require('expo-speech-recognition');
  SpeechRecognizer = mod?.ExpoSpeechRecognitionModule || null;
} catch (_) {}

export default function ActiveCallScreen({ callPayload, onHangUp }) {
  // Appearance determined before call: 'android' | 'ios' | 'zalo' | 'messenger'
  const appearance = callPayload?.callAppearance || 'android';

  const [seconds, setSeconds] = useState(0);
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);

  const callEndedRef = useRef(false);
  const isMutedRef = useRef(false);
  const isAiSpeakingRef = useRef(false);
  const isListeningRef = useRef(false);
  const conversationHistoryRef = useRef([]);
  const currentStepRef = useRef(0);
  const micDelayTimerRef = useRef(null);
  const sttRestartTimerRef = useRef(null);
  const abortControllerRef = useRef(null);

  const caller = callPayload?.caller || {
    name: callPayload?.callerName || 'Người gọi',
    phoneNumber: callPayload?.callerPhone || '0901 234 567',
    role: callPayload?.callerRole || 'Cuộc gọi mô phỏng',
  };

  const scenarioTitle = callPayload?.title || callPayload?.scenarioTitle || '';
  const category = callPayload?.category || caller?.role || '';
  const personaKey = detectCallerPersona(caller, scenarioTitle, category);
  const baseProfile = getVoiceProfile(caller, scenarioTitle, category);
  const voiceProfile = {
    ...baseProfile,
    voiceIdentifier: selectVietnameseVoice(audioService.availableVoices, personaKey),
  };
  const geminiVoice = getGeminiVoiceForCaller(caller, scenarioTitle, category, callPayload?.voiceId);
  const voiceName = geminiVoice?.geminiVoice || 'Kore';
  const dialogueList = getDynamicRoleDialogue(caller, scenarioTitle, category, callPayload?.dialogue);

  const ambientSound = callPayload?.ambientSound || 'none';
  const ambientVolume = callPayload?.ambientVolume ?? 0.25;

  // 1. Timer ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Speech recognition helpers with anti-click and anti-echo guards
  const stopListening = () => {
    clearTimeout(sttRestartTimerRef.current);
    clearTimeout(micDelayTimerRef.current);
    isListeningRef.current = false;
    if (!SpeechRecognizer) return;
    try {
      SpeechRecognizer.abort();
    } catch (_) {}
  };

  const startListening = () => {
    if (callEndedRef.current || isMutedRef.current || isAiSpeakingRef.current) return;
    if (!SpeechRecognizer || typeof SpeechRecognizer.start !== 'function') return;
    if (isListeningRef.current) return; // Prevent unnecessary repeated re-initialization

    try {
      isListeningRef.current = true;
      SpeechRecognizer.start({
        lang: 'vi-VN',
        interimResults: false,
        continuous: false,
        requiresOnDeviceRecognition: false,
      });
    } catch (_) {
      isListeningRef.current = false;
    }
  };

  // Anti-echo acoustic buffer: Wait 500ms after TTS ends before opening mic
  const onCallerFinishedSpeaking = () => {
    isAiSpeakingRef.current = false;
    if (callEndedRef.current || isMutedRef.current) return;
    clearTimeout(micDelayTimerRef.current);
    micDelayTimerRef.current = setTimeout(() => {
      if (!callEndedRef.current && !isMutedRef.current && !isAiSpeakingRef.current) {
        startListening();
      }
    }, 500);
  };

  const handleUserSpeech = async (userText) => {
    if (!userText || !userText.trim() || callEndedRef.current) return;
    stopListening();
    isAiSpeakingRef.current = true;

    const trimmedText = userText.trim();
    conversationHistoryRef.current.push({ role: 'user', text: trimmedText });

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    let reply = '';
    let audioBase64 = null;
    try {
      const res = await generateCallReply({
        callerName: caller.name,
        callerRole: caller.role,
        scenarioTitle,
        category,
        userUtterance: trimmedText,
        conversationHistory: conversationHistoryRef.current,
        voiceName,
      });
      if (res?.reply) {
        reply = res.reply;
        audioBase64 = res.audioBase64 || null;
      }
    } catch (_) {
      // Graceful offline fallback on timeout or network error
    }

    if (!reply && !callEndedRef.current) {
      currentStepRef.current += 1;
      reply = generateOfflineCallReply({
        caller,
        scenarioTitle,
        category,
        userUtterance: trimmedText,
        dialogueList,
        stepIndex: currentStepRef.current,
      });
    }

    if (callEndedRef.current) return;

    conversationHistoryRef.current.push({ role: 'caller', text: reply });

    // Speak caller reply via high-naturalness Gemini TTS (fallback to device TTS if needed)
    audioService.speakDialogueLine(
      reply,
      onCallerFinishedSpeaking,
      voiceProfile,
      audioBase64
    );
  };

  // 3. Speech Recognition Event Listener
  useEffect(() => {
    if (!SpeechRecognizer || typeof SpeechRecognizer.addListener !== 'function') return;

    const subResult = SpeechRecognizer.addListener('result', (event) => {
      if (callEndedRef.current || isMutedRef.current || isAiSpeakingRef.current) return;
      const transcript = event?.results?.[0]?.transcript;
      if (transcript && transcript.trim()) {
        handleUserSpeech(transcript);
      }
    });

    const subError = SpeechRecognizer.addListener('error', () => {
      // Cleanly conclude listening on timeout/silence without an aggressive DAC restart loop
      isListeningRef.current = false;
    });

    const subEnd = SpeechRecognizer.addListener('end', () => {
      isListeningRef.current = false;
    });

    return () => {
      clearTimeout(sttRestartTimerRef.current);
      clearTimeout(micDelayTimerRef.current);
      try { subResult?.remove?.(); } catch (_) {}
      try { subError?.remove?.(); } catch (_) {}
      try { subEnd?.remove?.(); } catch (_) {}
    };
  }, []);

  // 4. Initial Greeting on Call Start
  useEffect(() => {
    callEndedRef.current = false;
    isMutedRef.current = false;
    isAiSpeakingRef.current = true;
    currentStepRef.current = 0;
    audioService.isMuted = false;
    audioService.voiceVolume = callPayload?.voiceVolume ?? 1;

    // Request mic permissions in background
    if (SpeechRecognizer?.requestPermissionsAsync) {
      SpeechRecognizer.requestPermissionsAsync().catch(() => {});
    }

    if (ambientSound && ambientSound !== 'none') {
      audioService.startAmbientSound(ambientSound, ambientVolume);
    }

    // Play persona-appropriate opening greeting line
    const openingGreeting = getCallerOpeningGreeting({
      caller,
      scenarioTitle,
      category,
      dialogueList,
    });
    conversationHistoryRef.current = [{ role: 'caller', text: openingGreeting }];

    // If opening audio was passed, play immediately; otherwise request Gemini TTS
    if (callPayload?.openingAudioBase64) {
      audioService.speakDialogueLine(
        openingGreeting,
        onCallerFinishedSpeaking,
        voiceProfile,
        callPayload.openingAudioBase64
      );
    } else {
      generateTtsAudio({
        text: openingGreeting,
        voiceName,
        callerRole: caller.role,
        callerName: caller.name,
      })
        .then((res) => {
          if (!callEndedRef.current) {
            audioService.speakDialogueLine(
              openingGreeting,
              onCallerFinishedSpeaking,
              voiceProfile,
              res?.audioBase64 || null
            );
          }
        })
        .catch(() => {
          if (!callEndedRef.current) {
            audioService.speakDialogueLine(
              openingGreeting,
              onCallerFinishedSpeaking,
              voiceProfile
            );
          }
        });
    }

    return () => {
      callEndedRef.current = true;
      abortControllerRef.current?.abort();
      clearTimeout(micDelayTimerRef.current);
      clearTimeout(sttRestartTimerRef.current);
      stopListening();
      audioService.stopAll();
    };
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // User-triggered continuation (Discreet tap on avatar/center or Continue button)
  const handleNextDialogue = async () => {
    if (callEndedRef.current) return;
    stopListening();
    isAiSpeakingRef.current = true;

    currentStepRef.current += 1;
    const nextLine =
      currentStepRef.current < dialogueList.length
        ? dialogueList[currentStepRef.current]
        : generateOfflineCallReply({
            caller,
            scenarioTitle,
            category,
            userUtterance: 'vâng',
            dialogueList,
            stepIndex: currentStepRef.current,
          });

    setCurrentDialogueIndex(currentStepRef.current);
    conversationHistoryRef.current.push({ role: 'caller', text: nextLine });

    let ttsAudio = null;
    try {
      const res = await generateTtsAudio({
        text: nextLine,
        voiceName,
        callerRole: caller.role,
        callerName: caller.name,
      });
      if (res?.audioBase64) ttsAudio = res.audioBase64;
    } catch (_) {}

    if (callEndedRef.current) return;

    audioService.speakDialogueLine(
      nextLine,
      onCallerFinishedSpeaking,
      voiceProfile,
      ttsAudio
    );
  };

  // Unambiguous Mute: Stops STT recording and mutes audio
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    isMutedRef.current = nextMuted;
    audioService.setMuted(nextMuted);

    if (nextMuted) {
      stopListening();
    } else {
      if (!isAiSpeakingRef.current && !callEndedRef.current) {
        startListening();
      }
    }
  };

  // Immediate hang-up with complete audio and recording termination
  const handleEndCall = () => {
    callEndedRef.current = true;
    abortControllerRef.current?.abort();
    clearTimeout(micDelayTimerRef.current);
    clearTimeout(sttRestartTimerRef.current);
    stopListening();
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
  // 2. MESSENGER ACTIVE CALL (Target Image 2)
  // ----------------------------------------------------
  if (isMessenger) {
    return (
      <View style={[styles.container, styles.messengerContainer]}>
        <StatusBar barStyle="dark-content" backgroundColor="#DAD8C3" />

        {/* Floating Top Bar (Matching Image 2) */}
        <View style={styles.messengerTopBar}>
          <View style={styles.messengerTopLeft}>
            <CallIcon name="ic_minimize" size={20} tintColor="#3A3B35" />
          </View>
          <View style={styles.messengerTopRight}>
            <CallIcon name="ic_add_user" size={22} tintColor="#3A3B35" style={{ marginRight: 18 }} />
            <CallIcon name="ic_more_vert" size={22} tintColor="#3A3B35" />
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
          <Text style={styles.messengerCallingStatus}>
            {seconds < 3 ? 'Đang gọi...' : formatTime(seconds)}
          </Text>
        </TouchableOpacity>

        {/* Bottom Dock: 5 circular buttons on a single row (Target Image 2) */}
        <View style={styles.messengerBottomDock}>
          <TouchableOpacity
            style={styles.messengerDockBtnDark}
            activeOpacity={0.7}
          >
            <CallIcon name="ic_video_off" size={24} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.messengerDockBtnDark, isMuted && styles.messengerDockBtnDarkActive]}
            onPress={handleToggleMute}
            activeOpacity={0.7}
            testID="mute-btn"
            accessibilityLabel={isMuted ? 'Đã tắt tiếng' : 'Tắt tiếng'}
          >
            <CallIcon name={isMuted ? 'ic_mic_off' : 'ic_mic'} size={24} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.messengerDockBtnDark}
            activeOpacity={0.7}
          >
            <CallIcon name="ic_effects" size={24} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.messengerDockBtnDark, isSpeaker && styles.messengerDockBtnDarkActive]}
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
            <CallIcon name="ic_speaker" size={24} />
          </TouchableOpacity>

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
    );
  }

  // ----------------------------------------------------
  // 3. IOS ACTIVE CALL (Target Image 4)
  // ----------------------------------------------------
  if (isIos) {
    return (
      <View style={[styles.container, styles.iosContainer]}>
        <StatusBar barStyle="light-content" backgroundColor="#141414" />

        {/* Top Header / Status Time */}
        <View style={styles.iosTopStatus}>
          <Text style={styles.iosTimeText}>17:04</Text>
        </View>

        {/* Top: Caller Info & Call Duration */}
        <TouchableOpacity
          style={styles.iosTop}
          activeOpacity={0.9}
          onPress={handleNextDialogue}
          testID="caller-avatar-touch"
        >
          <Text style={styles.iosCallerName} numberOfLines={1}>
            {caller.phoneNumber || caller.name}
          </Text>
          <Text style={styles.iosTimer}>{formatTime(seconds)}</Text>
        </TouchableOpacity>

        {/* 6-Grid Control Pad (Target Image 4) */}
        <View style={styles.iosGridSection}>
          <View style={styles.iosGridRow}>
            {/* 1. Tắt tiếng */}
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
                  size={28}
                  tintColor={isMuted ? '#000000' : '#FFFFFF'}
                />
              </TouchableOpacity>
              <Text style={styles.iosGridLabel} onPress={handleToggleMute}>
                tắt tiếng
              </Text>
            </View>

            {/* 2. Bàn phím */}
            <View style={styles.iosGridItem}>
              <View style={styles.iosCircleBtn}>
                <CallIcon name="ic_keypad" size={28} />
              </View>
              <Text style={styles.iosGridLabel}>bàn phím</Text>
            </View>

            {/* 3. Âm thanh */}
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
                  size={28}
                  tintColor={isSpeaker ? '#000000' : '#FFFFFF'}
                />
              </TouchableOpacity>
              <Text style={styles.iosGridLabel}>âm thanh</Text>
            </View>
          </View>

          <View style={styles.iosGridRow}>
            {/* 4. Thêm cuộc gọi */}
            <View style={styles.iosGridItem}>
              <View style={styles.iosCircleBtn}>
                <CallIcon name="ic_add" size={28} />
              </View>
              <Text style={styles.iosGridLabel}>thêm cuộc gọi</Text>
            </View>

            {/* 5. FaceTime */}
            <View style={styles.iosGridItem}>
              <View style={styles.iosCircleBtn}>
                <CallIcon name="ic_video" size={28} tintColor="#8E8E93" />
              </View>
              <Text style={[styles.iosGridLabel, { color: '#8E8E93' }]}>FaceTime</Text>
            </View>

            {/* 6. Danh bạ (also allows discreet dialogue continue) */}
            <View style={styles.iosGridItem}>
              <TouchableOpacity
                style={styles.iosCircleBtn}
                onPress={handleNextDialogue}
                activeOpacity={0.7}
                testID="continue-dialogue-btn"
                accessibilityLabel="danh bạ"
              >
                <CallIcon name="ic_contacts" size={28} />
              </TouchableOpacity>
              <Text style={styles.iosGridLabel}>danh bạ</Text>
            </View>
          </View>
        </View>

        {/* Bottom Red End Call Button (Target Image 4: Icon only, NO text label) */}
        <View style={styles.iosBottom}>
          <TouchableOpacity
            style={styles.iosEndBtn}
            onPress={handleEndCall}
            activeOpacity={0.85}
            testID="end-call-btn"
            accessibilityLabel="KẾT THÚC CUỘC GỌI"
          >
            <CallIcon name="phone_hangup" size={34} />
          </TouchableOpacity>
        </View>

        {/* White iOS Home Indicator Bar */}
        <View style={styles.iosHomeIndicatorWrap}>
          <View style={styles.iosHomeIndicator} />
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

      {/* Top Center: Circular Avatar & Identity */}
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

      {/* 6-Grid Icon Pad (Clean CallIcon without emoji characters) */}
      <View style={styles.androidGrid}>
        <View style={styles.androidGridRow}>
          {/* Ghi âm */}
          <View style={styles.androidGridItem}>
            <View style={styles.androidIconBtn}>
              <CallIcon name="ic_record" size={22} />
            </View>
            <Text style={styles.androidIconLabel}>Ghi âm</Text>
          </View>

          {/* Giữ máy */}
          <View style={styles.androidGridItem}>
            <View style={styles.androidIconBtn}>
              <CallIcon name="ic_hold" size={22} />
            </View>
            <Text style={styles.androidIconLabel}>Giữ máy</Text>
          </View>

          {/* Thêm cuộc gọi */}
          <View style={styles.androidGridItem}>
            <View style={styles.androidIconBtn}>
              <CallIcon name="ic_add" size={22} />
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
              <CallIcon name="ic_video" size={22} />
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
              <CallIcon name="ic_contacts" size={22} />
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

        {/* Center End Call Button */}
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
  // MESSENGER ACTIVE STYLES (Target Image 2)
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
  messengerAvatarCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#C5C3AF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
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
    marginBottom: 4,
  },
  messengerCallingStatus: {
    color: '#55564E',
    fontSize: 15,
    fontWeight: typography.fontWeights.medium,
  },
  messengerBottomDock: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 24 : spacing.xl,
  },
  messengerDockBtnDark: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(74, 75, 70, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messengerDockBtnDarkActive: {
    backgroundColor: 'rgba(74, 75, 70, 0.55)',
  },
  messengerDockBtnRed: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FA3E3E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FA3E3E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },

  // ----------------------------------------------------
  // IOS ACTIVE STYLES (Target Image 4)
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
    marginBottom: spacing.xl,
  },
  iosCallerName: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  iosTimer: {
    color: '#8E8E93',
    fontSize: 18,
    fontWeight: '400',
  },
  iosGridSection: {
    marginVertical: spacing.md,
    paddingHorizontal: 24,
  },
  iosGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.xl,
  },
  iosGridItem: {
    alignItems: 'center',
    width: 82,
  },
  iosCircleBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iosCircleBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  iosGridLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
  },
  iosBottom: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iosEndBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EB5545',
    alignItems: 'center',
    justifyContent: 'center',
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
  // ANDROID ACTIVE STYLES
  // ----------------------------------------------------
  androidContainer: {
    backgroundColor: '#1A2228',
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
