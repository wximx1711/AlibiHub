import { Alert, Platform, Vibration } from 'react-native';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Speech from 'expo-speech';
const sounds = {
  classic: require('../../assets/audio/classic.wav'), digital: require('../../assets/audio/digital.wav'),
  office: require('../../assets/audio/office.wav'), cafe: require('../../assets/audio/cafe.wav'),
  street: require('../../assets/audio/street.wav'), hospital: require('../../assets/audio/hospital.wav'),
};
export const AMBIENT_PRESETS = [
  { id: 'none', label: 'Tắt âm nền', description: 'Chỉ phát lời thoại' },
  { id: 'office', label: 'Văn phòng', description: 'Âm bàn phím tổng hợp' },
  { id: 'cafe', label: 'Quán cà phê', description: 'Không gian quán tổng hợp' },
  { id: 'street', label: 'Đường phố', description: 'Âm xe cộ tổng hợp' },
  { id: 'hospital', label: 'Phòng khám', description: 'Tiếng máy theo dõi tổng hợp' },
];
class AudioSimulationService {
  voiceVolume = 1; ambientVolume = 0.25; isMuted = false; generation = 0;
  async configure() {
    await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: false, interruptionMode: 'mixWithOthers', shouldRouteThroughEarpiece: false });
  }
  startIncomingCallAlert(type = 'classic', vibration = true) {
    this.stopAll();
    if (vibration && Platform.OS !== 'web') Vibration.vibrate([0, 1000, 1000], true);
    const generation = this.generation;
    this.configure().then(() => {
      if (generation !== this.generation) return;
      this.ringtone = createAudioPlayer(sounds[type] || sounds.classic);
      this.ringtone.loop = true; this.ringtone.volume = 0.8; this.ringtone.play();
    }).catch(() => Alert.alert('Âm thanh', 'Không thể phát nhạc chuông. Kiểm tra âm lượng thiết bị.'));
  }
  stopIncomingCallAlert() {
    this.generation++; Vibration.cancel();
    if (this.ringtone) { this.ringtone.pause(); this.ringtone.remove(); this.ringtone = null; }
  }
  startAmbientSound(type, volume = 0.25) {
    this.stopAmbientSound(); this.ambientVolume = volume;
    if (!sounds[type] || type === 'classic' || type === 'digital') return;
    try { this.ambient = createAudioPlayer(sounds[type]); this.ambient.loop = true; this.setAmbientVolume(volume); this.ambient.play(); }
    catch { Alert.alert('Âm thanh', 'Không thể phát âm nền trên thiết bị này.'); }
  }
  setAmbientVolume(volume) {
    this.ambientVolume = Math.max(0, Math.min(1, volume));
    if (this.ambient) this.ambient.volume = this.isMuted ? 0 : this.ambientVolume * (this.speaking ? 0.12 : 0.35);
  }
  stopAmbientSound() {
    if (this.ambient) { this.ambient.pause(); this.ambient.remove(); this.ambient = null; }
  }
  setMuted(value) {
    this.isMuted = value;
    if (value) { Speech.stop(); this.speaking = false; }
    this.setAmbientVolume(this.ambientVolume);
  }
  async setSpeaker(value) { await setAudioModeAsync({ shouldRouteThroughEarpiece: !value }); }
  speakDialogueLine(text, onEnd) {
    Speech.stop();
    if (!text || this.isMuted || this.voiceVolume === 0) { onEnd?.(); return; }
    this.speaking = true; this.setAmbientVolume(this.ambientVolume);
    const finish = () => { this.speaking = false; this.setAmbientVolume(this.ambientVolume); onEnd?.(); };
    Speech.speak(text, { language: 'vi-VN', rate: 0.95, volume: this.voiceVolume, onDone: finish, onStopped: finish,
      onError: () => { finish(); Alert.alert('Giọng đọc', 'Không thể phát lời thoại. Hãy cài giọng Tiếng Việt trong cài đặt chuyển văn bản thành giọng nói của Android để dùng offline.'); },
    });
  }
  stopAll() { this.stopIncomingCallAlert(); this.stopAmbientSound(); Speech.stop(); this.isMuted = false; this.speaking = false; }
}
export const audioService = new AudioSimulationService();
