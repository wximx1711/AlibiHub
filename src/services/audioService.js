import { Alert, Platform, Vibration } from 'react-native';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Speech from 'expo-speech';
import { Asset } from 'expo-asset';

let FileSystem = null;
try {
  FileSystem = require('expo-file-system');
} catch (_) {}

function player(source) {
  if (Platform.OS !== 'web') return createAudioPlayer(source);
  const media = new Audio(Asset.fromModule(source).uri);
  return {
    set loop(value) { media.loop = value; },
    set volume(value) { media.volume = value; },
    play() {
      media.play().catch(err => {
        if (err.name !== 'AbortError') Alert.alert('Âm thanh', 'Trình duyệt chưa cho phép phát âm thanh.');
      });
    },
    pause() { media.pause(); },
    remove() { media.pause(); media.removeAttribute('src'); media.load(); },
  };
}

const sounds = {
  classic: require('../../assets/audio/classic.wav'),
  digital: require('../../assets/audio/digital.wav'),
  office: require('../../assets/audio/office.wav'),
  cafe: require('../../assets/audio/cafe.wav'),
  street: require('../../assets/audio/street.wav'),
  hospital: require('../../assets/audio/hospital.wav'),
};

export const AMBIENT_PRESETS = [
  { id: 'none', label: 'Tắt âm nền', description: 'Chỉ phát lời thoại' },
  { id: 'office', label: 'Văn phòng', description: 'Âm bàn phím tổng hợp' },
  { id: 'cafe', label: 'Quán cà phê', description: 'Không gian quán tổng hợp' },
  { id: 'street', label: 'Đường phố', description: 'Âm xe cộ tổng hợp' },
  { id: 'hospital', label: 'Phòng khám', description: 'Tiếng máy theo dõi tổng hợp' },
];

class AudioSimulationService {
  voiceVolume = 1;
  ambientVolume = 0.25;
  isMuted = false;
  speaking = false;
  generation = 0;
  currentUtteranceId = 0;
  availableVoices = [];
  voicesQueried = false;

  async initVoices() {
    if (this.voicesQueried) return;
    this.voicesQueried = true;
    try {
      if (Speech && typeof Speech.getAvailableVoicesAsync === 'function') {
        const voices = await Speech.getAvailableVoicesAsync();
        if (Array.isArray(voices)) {
          this.availableVoices = voices;
        }
      }
    } catch (_) {}
  }

  async configure() {
    await this.initVoices().catch(() => {});
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'mixWithOthers',
      shouldRouteThroughEarpiece: false,
    });
  }

  startIncomingCallAlert(type = 'classic', vibration = true) {
    this.stopAll();
    if (vibration && Platform.OS !== 'web') Vibration.vibrate([0, 1000, 1000], true);
    const generation = this.generation;
    this.configure().then(() => {
      if (generation !== this.generation) return;
      this.ringtone = player(sounds[type] || sounds.classic);
      this.ringtone.loop = true;
      this.ringtone.volume = 0.8;
      this.ringtone.play();
    }).catch(() => Alert.alert('Âm thanh', 'Không thể phát nhạc chuông. Kiểm tra âm lượng thiết bị.'));
  }

  stopIncomingCallAlert() {
    this.generation++;
    Vibration.cancel();
    if (this.ringtone) {
      this.ringtone.pause();
      this.ringtone.remove();
      this.ringtone = null;
    }
  }

  startAmbientSound(type, volume = 0.25) {
    this.stopAmbientSound();
    this.ambientVolume = volume;
    if (!sounds[type] || type === 'classic' || type === 'digital') return;
    try {
      this.ambient = player(sounds[type]);
      this.ambient.loop = true;
      this.setAmbientVolume(volume);
      this.ambient.play();
    } catch {
      Alert.alert('Âm thanh', 'Không thể phát âm nền trên thiết bị này.');
    }
  }

  setAmbientVolume(volume) {
    this.ambientVolume = Math.max(0, Math.min(1, volume));
    if (this.ambient) {
      // Gentle, constant baseline background volume without abrupt DAC volume steps
      const factor = this.isMuted ? 0 : 0.22;
      this.ambient.volume = this.ambientVolume * factor;
    }
  }

  stopAmbientSound() {
    if (this.ambient) {
      try {
        this.ambient.pause();
        this.ambient.remove();
      } catch (_) {}
      this.ambient = null;
    }
  }

  setMuted(value) {
    this.isMuted = value;
    if (value) {
      this.currentUtteranceId++;
      try { Speech.stop(); } catch (_) {}
      this.speaking = false;
    }
    this.setAmbientVolume(this.ambientVolume);
  }

  async setSpeaker(value) {
    await setAudioModeAsync({ shouldRouteThroughEarpiece: !value });
  }

  currentTtsPlayer = null;
  ttsSafetyTimer = null;

  stopCurrentTts() {
    clearTimeout(this.ttsSafetyTimer);
    if (this.currentTtsPlayer) {
      try {
        if (Platform.OS === 'web') {
          this.currentTtsPlayer.pause();
          this.currentTtsPlayer.currentTime = 0;
        } else {
          this.currentTtsPlayer.pause?.();
          this.currentTtsPlayer.remove?.();
        }
      } catch (_) {}
      this.currentTtsPlayer = null;
    }
    try {
      Speech.stop();
    } catch (_) {}
  }

  async playBase64Audio(base64Wav, onEnd) {
    this.stopCurrentTts();
    const utteranceId = ++this.currentUtteranceId;

    const finish = () => {
      clearTimeout(this.ttsSafetyTimer);
      if (this.currentUtteranceId !== utteranceId) return;
      this.speaking = false;
      this.currentTtsPlayer = null;
      this.setAmbientVolume(this.ambientVolume);
      onEnd?.();
    };

    if (!base64Wav || this.isMuted || this.voiceVolume === 0) {
      this.speaking = false;
      onEnd?.();
      return;
    }

    this.speaking = true;
    this.setAmbientVolume(this.ambientVolume);

    if (Platform.OS === 'web') {
      try {
        const audio = new Audio('data:audio/wav;base64,' + base64Wav);
        audio.volume = this.voiceVolume;
        this.currentTtsPlayer = audio;
        audio.onended = finish;
        audio.onerror = finish;
        audio.play().catch(finish);
      } catch (_) {
        finish();
      }
      return;
    }

    // Native Android / iOS
    try {
      let fileUri = null;
      if (FileSystem && FileSystem.cacheDirectory) {
        fileUri = `${FileSystem.cacheDirectory}alibi_gemini_${Date.now()}.wav`;
        await FileSystem.writeAsStringAsync(fileUri, base64Wav, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      if (fileUri) {
        const player = createAudioPlayer({ uri: fileUri });
        this.currentTtsPlayer = player;
        if (typeof player.volume === 'number') {
          player.volume = this.voiceVolume;
        }

        // Calculate approximate duration based on WAV length (~48KB per second at 24kHz 16-bit mono)
        const approxDurationMs = Math.max(1200, Math.round(((base64Wav.length * 0.75) / 48000) * 1000) + 400);

        if (typeof player.addListener === 'function') {
          player.addListener('playbackStatusUpdate', (status) => {
            if (status?.didJustFinish) {
              finish();
            }
          });
        }

        this.ttsSafetyTimer = setTimeout(finish, approxDurationMs);
        player.play();
        return;
      }
    } catch (_) {
      finish();
    }
  }

  speakDialogueLine(text, onEnd, voiceProfile = null, audioBase64 = null) {
    this.stopCurrentTts();

    // 1. If backend Gemini TTS audio is provided, play high-naturalness voice directly!
    if (audioBase64) {
      this.playBase64Audio(audioBase64, onEnd);
      return;
    }

    // 2. Otherwise fall back cleanly to device-level Vietnamese expo-speech
    const thisUtteranceId = ++this.currentUtteranceId;

    if (!text || this.isMuted || this.voiceVolume === 0) {
      this.speaking = false;
      onEnd?.();
      return;
    }

    this.speaking = true;
    this.setAmbientVolume(this.ambientVolume);

    const finish = () => {
      if (this.currentUtteranceId !== thisUtteranceId) return;
      this.speaking = false;
      this.setAmbientVolume(this.ambientVolume);
      onEnd?.();
    };

    const pitch = typeof voiceProfile?.pitch === 'number' ? voiceProfile.pitch : 1.0;
    const rate = typeof voiceProfile?.rate === 'number' ? voiceProfile.rate : 0.95;

    const speakOptions = {
      language: 'vi-VN',
      pitch,
      rate,
      volume: this.voiceVolume,
      onDone: finish,
      onStopped: () => {
        if (this.currentUtteranceId === thisUtteranceId) {
          finish();
        }
      },
      onError: () => {
        if (this.currentUtteranceId === thisUtteranceId) {
          finish();
        }
      },
    };

    if (voiceProfile?.voiceIdentifier) {
      speakOptions.voice = voiceProfile.voiceIdentifier;
    }

    try {
      Speech.speak(text, speakOptions);
    } catch (_) {
      finish();
    }
  }

  stopAll() {
    this.currentUtteranceId++;
    this.stopIncomingCallAlert();
    this.stopAmbientSound();
    this.stopCurrentTts();
    this.isMuted = false;
    this.speaking = false;
  }
}

export const audioService = new AudioSimulationService();
