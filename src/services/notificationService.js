import { Platform, AppState, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { delay } from '../utils/validation';
const KEY = '@alibihub_schedule_v1';
if (Platform.OS !== 'web') Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) });
export class ScheduledCallService {
  listeners = new Set(); queue = Promise.resolve();
  subscribe(cb) { this.listeners.add(cb); cb(this.getScheduledInfo()); return () => this.listeners.delete(cb); }
  getScheduledInfo() { return { isScheduled: !!this.payload, payload: this.payload, remainingSeconds: this.payload ? Math.max(0, Math.ceil((this.payload.targetTimestamp - Date.now()) / 1000)) : 0 }; }
  notifyChange() { for (const cb of this.listeners) cb(this.getScheduledInfo()); }
  serialize(fn) { const task = this.queue.then(fn); this.queue = task.catch(() => {}); return task; }
  async requestPermissionsAsync() {
    if (Platform.OS === 'web') return false;
    await Notifications.setNotificationChannelAsync('calls', { name: 'Lịch cuộc gọi mô phỏng', importance: Notifications.AndroidImportance.HIGH, sound: 'default' });
    let permission = await Notifications.getPermissionsAsync();
    if (!permission.granted && permission.canAskAgain) permission = await Notifications.requestPermissionsAsync();
    return permission.granted;
  }
  scheduleCall(callPayload, onTrigger) {
    const seconds = delay(callPayload.delaySeconds);
    return this.serialize(async () => {
      await this.clear(); this.onTrigger = onTrigger || this.onTrigger;
      if (!seconds) { this.onTrigger?.(callPayload); return; }
      const payload = { ...callPayload, scheduleId: `call_${Date.now()}`, targetTimestamp: Date.now() + seconds * 1000 };
      let permitted = false;
      try {
        permitted = await this.requestPermissionsAsync();
        if (permitted) payload.notificationId = await Notifications.scheduleNotificationAsync({ identifier: payload.scheduleId,
          content: { title: `Cuộc gọi mô phỏng: ${callPayload.caller.name}`, body: 'Chạm để mở AlibiHub và nhận cuộc gọi.', data: { scheduleId: payload.scheduleId }, sound: 'default' },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.max(1, Math.ceil((payload.targetTimestamp - Date.now()) / 1000)), channelId: 'calls' },
        });
      } catch { permitted = false; }
      try { await AsyncStorage.setItem(KEY, JSON.stringify(payload)); }
      catch (err) { if (payload.notificationId) await Notifications.cancelScheduledNotificationAsync(payload.notificationId); throw err; }
      this.payload = payload; this.startTicker(); this.notifyChange();
      if (!permitted) Alert.alert('Hẹn giờ trong ứng dụng', 'Chưa có quyền thông báo. Hãy giữ AlibiHub ở màn hình trước để nhận cuộc gọi đúng giờ.');
    });
  }
  startTicker() { clearInterval(this.timer); this.timer = setInterval(() => { this.notifyChange(); this.checkDue(); }, 500); }
  checkDue() {
    if (!this.payload || this.payload.targetTimestamp > Date.now() || (AppState.currentState && AppState.currentState !== 'active') || this.firing) return;
    this.firing = true;
    this.serialize(async () => {
      const payload = this.payload;
      if (!payload || payload.targetTimestamp > Date.now()) return;
      await this.clear();
      if (Date.now() - payload.targetTimestamp > 5 * 60 * 1000) { Alert.alert('Lịch hẹn đã qua', 'Lịch cuộc gọi cũ đã hết hạn. Bạn có thể đặt lịch mới.'); return; }
      this.onTrigger?.(payload);
    }).catch(err => Alert.alert('Lịch hẹn', err.message)).finally(() => { this.firing = false; });
  }
  async clear() {
    await AsyncStorage.removeItem(KEY);
    const previous = this.payload;
    this.payload = null; clearInterval(this.timer); this.timer = null; this.notifyChange();
    if (previous?.notificationId && Platform.OS !== 'web') await Notifications.cancelScheduledNotificationAsync(previous.notificationId);
  }
  cancelScheduledCall() { return this.serialize(() => this.clear()); }
  attach(onTrigger) {
    this.onTrigger = onTrigger;
    let disposed = false;
    this.serialize(async () => {
      const raw = await AsyncStorage.getItem(KEY);
      if (disposed) return;
      if (raw) {
        const payload = JSON.parse(raw);
        if (!Number.isFinite(payload.targetTimestamp) || !payload.caller?.name) throw new Error('Lịch đã lưu không hợp lệ.');
        this.payload = payload; this.startTicker(); this.notifyChange(); this.checkDue();
      }
    }).catch(err => Alert.alert('Không thể khôi phục lịch', err.message));
    const appSub = AppState.addEventListener('change', state => { if (state === 'active') this.checkDue(); });
    const notificationSub = Platform.OS !== 'web' ? Notifications.addNotificationResponseReceivedListener(() => this.checkDue()) : null;
    return () => { disposed = true; appSub.remove(); notificationSub?.remove(); clearInterval(this.timer); };
  }
}
export const notificationService = new ScheduledCallService();
