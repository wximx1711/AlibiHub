/**
 * AlibiHub - Persistent Storage Service (FE3: My Escape Vault)
 * Uses AsyncStorage for reliable offline persistence across app restarts.
 */

import { text, phone, delay, dialogue, AMBIENTS, proxyUrl } from '../utils/validation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_CALLERS } from '../data/defaultCallers';
import { DEFAULT_SCENARIOS } from '../data/defaultScenarios';

const STORAGE_KEYS = {
  CALLERS: '@alibihub_callers_v1',
  SCENARIOS: '@alibihub_scenarios_v1',
  CALL_HISTORY: '@alibihub_call_history_v1',
  SETTINGS: '@alibihub_settings_v1',
  TRUSTED_CONTACTS: '@alibihub_trusted_contacts_v1',
};

const DEFAULT_SETTINGS = {
  voiceVolume: 1.0,
  ambientVolume: 0.25,
  vibrationEnabled: true,
  ringtoneType: 'classic',
  proxyUrl: process.env.EXPO_PUBLIC_AI_PROXY_URL || '',
  theme: 'dark',
};

const DEFAULT_TRUSTED_CONTACTS = [];

/**
 * Initialize storage with default data if empty
 */
async function initializeStorageIfNeededImpl() {
  try {
    const [callersJson, scenariosJson, settingsJson, contactsJson] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.CALLERS),
      AsyncStorage.getItem(STORAGE_KEYS.SCENARIOS),
      AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
      AsyncStorage.getItem(STORAGE_KEYS.TRUSTED_CONTACTS),
    ]);

    if (!callersJson) {
      await AsyncStorage.setItem(STORAGE_KEYS.CALLERS, JSON.stringify(DEFAULT_CALLERS));
    }
    if (!scenariosJson) {
      await AsyncStorage.setItem(STORAGE_KEYS.SCENARIOS, JSON.stringify(DEFAULT_SCENARIOS));
    }
    if (!settingsJson) {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    }
    if (!contactsJson) {
      await AsyncStorage.setItem(STORAGE_KEYS.TRUSTED_CONTACTS, JSON.stringify(DEFAULT_TRUSTED_CONTACTS));
    }
  } catch (error) {
    throw new Error('Không thể khởi tạo bộ nhớ. Vui lòng thử mở lại ứng dụng.');
  }
}

// ==========================================
// CALLER PROFILES (FE1 & FE3)
// ==========================================

export async function getCallers() {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.CALLERS);
    if (!json) return DEFAULT_CALLERS;
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) throw new Error('Dữ liệu lưu trữ không hợp lệ.');
    return parsed;
  } catch (error) {
    console.error('Failed to get callers:', error);
    throw error;
  }
}

async function saveCallerImpl(callerData) {
  callerData = { ...callerData, name: text(callerData.name, 'Tên người gọi', 1, 80), phoneNumber: phone(callerData.phoneNumber) };
  try {
    if (callerData.avatarUrl && !/^https:\/\//.test(callerData.avatarUrl)) throw new Error('Ảnh đại diện phải dùng HTTPS.');
    const callers = await getCallers();
    const isEdit = callerData.id && callers.some((c) => c.id === callerData.id);

    const callerToSave = {
      ...callerData,
      id: callerData.id || `caller_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      updatedAt: new Date().toISOString(),
    };

    let updatedList;
    if (isEdit) {
      updatedList = callers.map((c) => (c.id === callerToSave.id ? callerToSave : c));
    } else {
      updatedList = [callerToSave, ...callers];
    }

    await AsyncStorage.setItem(STORAGE_KEYS.CALLERS, JSON.stringify(updatedList));
    return callerToSave;
  } catch (error) {
    console.error('Failed to save caller:', error);
    throw new Error(`Không thể lưu hồ sơ người gọi: ${error.message}`);
  }
}

async function deleteCallerImpl(callerId) {
  try {
    const callers = await getCallers();
    const filtered = callers.filter((c) => c.id !== callerId);
    await AsyncStorage.setItem(STORAGE_KEYS.CALLERS, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Failed to delete caller:', error);
    throw new Error(`Không thể xóa người gọi: ${error.message}`);
  }
}

// ==========================================
// SCENARIOS (FE2 & FE3)
// ==========================================

export async function getScenarios() {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.SCENARIOS);
    if (!json) return DEFAULT_SCENARIOS;
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) throw new Error('Dữ liệu lưu trữ không hợp lệ.');
    return parsed;
  } catch (error) {
    console.error('Failed to get scenarios:', error);
    throw error;
  }
}

async function saveScenarioImpl(scenarioData) {
  scenarioData = { ...scenarioData, callerName: scenarioData.callerName || scenarioData.caller?.name, callerPhone: scenarioData.callerPhone || scenarioData.caller?.phoneNumber, callerRole: scenarioData.callerRole || scenarioData.caller?.role, callerAvatar: scenarioData.callerAvatar || scenarioData.caller?.avatarUrl || '' };
  scenarioData.title = text(scenarioData.title, 'Tiêu đề', 1, 120);
  scenarioData.callerName = text(scenarioData.callerName, 'Tên người gọi', 1, 80);
  scenarioData.callerPhone = phone(scenarioData.callerPhone);
  scenarioData.delaySeconds = delay(scenarioData.delaySeconds ?? 0);
  scenarioData.dialogue = dialogue(scenarioData.dialogue);
  if (!AMBIENTS.includes(scenarioData.ambientSound)) throw new Error('Âm nền không hợp lệ.');
  try {
    const scenarios = await getScenarios();
    const isEdit = scenarioData.id && scenarios.some((s) => s.id === scenarioData.id);

    const scenarioToSave = {
      ...scenarioData,
      id: scenarioData.id || `sc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      isCustom: true,
      updatedAt: new Date().toISOString(),
    };

    let updatedList;
    if (isEdit) {
      updatedList = scenarios.map((s) => (s.id === scenarioToSave.id ? scenarioToSave : s));
    } else {
      updatedList = [scenarioToSave, ...scenarios];
    }

    await AsyncStorage.setItem(STORAGE_KEYS.SCENARIOS, JSON.stringify(updatedList));
    return scenarioToSave;
  } catch (error) {
    console.error('Failed to save scenario:', error);
    throw new Error(`Không thể lưu kịch bản: ${error.message}`);
  }
}

async function toggleScenarioFavoriteImpl(scenarioId) {
  try {
    const scenarios = await getScenarios();
    const updated = scenarios.map((s) =>
      s.id === scenarioId ? { ...s, isFavorite: !s.isFavorite } : s
    );
    await AsyncStorage.setItem(STORAGE_KEYS.SCENARIOS, JSON.stringify(updated));
    return updated.find((s) => s.id === scenarioId);
  } catch (error) {
    console.error('Failed to toggle favorite:', error);
    throw error;
  }
}

async function toggleScenarioPinImpl(scenarioId) {
  try {
    const scenarios = await getScenarios();
    const updated = scenarios.map((s) =>
      s.id === scenarioId ? { ...s, isPinned: !s.isPinned } : s
    );
    await AsyncStorage.setItem(STORAGE_KEYS.SCENARIOS, JSON.stringify(updated));
    return updated.find((s) => s.id === scenarioId);
  } catch (error) {
    console.error('Failed to toggle pin:', error);
    throw error;
  }
}

async function deleteScenarioImpl(scenarioId) {
  try {
    const scenarios = await getScenarios();
    const filtered = scenarios.filter((s) => s.id !== scenarioId);
    await AsyncStorage.setItem(STORAGE_KEYS.SCENARIOS, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Failed to delete scenario:', error);
    throw new Error(`Không thể xóa kịch bản: ${error.message}`);
  }
}

// ==========================================
// CALL HISTORY (FE3)
// ==========================================

export async function getCallHistory() {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.CALL_HISTORY);
    if (!json) return [];
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) throw new Error('Dữ liệu lưu trữ không hợp lệ.');
    return parsed;
  } catch (error) {
    console.error('Failed to get call history:', error);
    throw error;
  }
}

async function addCallHistoryEntryImpl(entry) {
  try {
    const history = await getCallHistory();
    const newEntry = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      dateFormatted: new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
      }),
      status: entry.status || 'completed', // 'completed' | 'declined' | 'missed'
      callerName: entry.callerName || 'Người gọi ẩn danh',
      callerPhone: entry.callerPhone || '',
      scenarioTitle: entry.scenarioTitle || 'Cuộc gọi nhanh (Quick Escape)',
      durationSeconds: entry.durationSeconds || 0,
    };

    // Keep up to 50 recent calls
    const updated = [newEntry, ...history].slice(0, 50);
    await AsyncStorage.setItem(STORAGE_KEYS.CALL_HISTORY, JSON.stringify(updated));
    return newEntry;
  } catch (error) {
    console.error('Failed to log call history:', error);
    throw error;
  }
}

async function clearCallHistoryImpl() {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CALL_HISTORY, JSON.stringify([]));
    return true;
  } catch (error) {
    console.error('Failed to clear history:', error);
    throw error;
  }
}

// ==========================================
// SETTINGS
// ==========================================

export async function getSettings() {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!json) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Cài đặt đã lưu không hợp lệ.');
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (error) {
    console.error('Failed to get settings:', error);
    throw error;
  }
}

async function saveSettingsImpl(newSettings) {
  for (const key of ['voiceVolume', 'ambientVolume']) {
    if (key in newSettings && (typeof newSettings[key] !== 'number' || !Number.isFinite(newSettings[key]) || newSettings[key] < 0 || newSettings[key] > 1)) throw new Error('Âm lượng phải từ 0 đến 1.');
  }
  if ('proxyUrl' in newSettings && newSettings.proxyUrl) proxyUrl(newSettings.proxyUrl);
  if ('ringtoneType' in newSettings && !['classic', 'digital'].includes(newSettings.ringtoneType)) throw new Error('Nhạc chuông không hợp lệ.');
  try {
    const current = await getSettings();
    const merged = { ...current, ...newSettings };
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
    return merged;
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw error;
  }
}

// ==========================================
// TRUSTED CONTACTS (FE4 - Phase 2)
// ==========================================

export async function getTrustedContacts() {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.TRUSTED_CONTACTS);
    if (!json) return DEFAULT_TRUSTED_CONTACTS;
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) throw new Error('Dữ liệu lưu trữ không hợp lệ.');
    return parsed;
  } catch (error) { throw error; }
}

async function saveTrustedContactImpl(contact) {
  contact = { ...contact, name: text(contact.name, 'Tên liên hệ', 1, 80), phone: phone(contact.phone) };
  try {
    const list = await getTrustedContacts();
    const newContact = {
      ...contact,
      id: contact.id || `tc_${Date.now()}`,
      status: 'local',
    };
    const updated = [newContact, ...list];
    await AsyncStorage.setItem(STORAGE_KEYS.TRUSTED_CONTACTS, JSON.stringify(updated));
    return updated;
  } catch (error) {
    throw error;
  }
}

async function deleteTrustedContactImpl(contactId) {
  try {
    const list = await getTrustedContacts();
    const filtered = list.filter((c) => c.id !== contactId);
    await AsyncStorage.setItem(STORAGE_KEYS.TRUSTED_CONTACTS, JSON.stringify(filtered));
    return filtered;
  } catch (error) {
    throw error;
  }
}

// ==========================================
// FACTORY RESET / CLEAR ALL DATA
// ==========================================

async function resetAllDataToDefaultImpl() {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.CALLERS,
      STORAGE_KEYS.SCENARIOS,
      STORAGE_KEYS.CALL_HISTORY,
      STORAGE_KEYS.SETTINGS,
      STORAGE_KEYS.TRUSTED_CONTACTS,
      '@alibihub_schedule_v1',
    ]);
    await initializeStorageIfNeededImpl();
    return true;
  } catch (error) {
    console.error('Failed to reset all data:', error);
    throw error;
  }
}


let writeQueue = Promise.resolve();
function mutate(fn) { const next = writeQueue.then(fn); writeQueue = next.catch(() => {}); return next; }
export function initializeStorageIfNeeded(...args) { return mutate(() => initializeStorageIfNeededImpl(...args)); }
export function saveCaller(...args) { return mutate(() => saveCallerImpl(...args)); }
export function deleteCaller(...args) { return mutate(() => deleteCallerImpl(...args)); }
export function saveScenario(...args) { return mutate(() => saveScenarioImpl(...args)); }
export function toggleScenarioFavorite(...args) { return mutate(() => toggleScenarioFavoriteImpl(...args)); }
export function toggleScenarioPin(...args) { return mutate(() => toggleScenarioPinImpl(...args)); }
export function deleteScenario(...args) { return mutate(() => deleteScenarioImpl(...args)); }
export function addCallHistoryEntry(...args) { return mutate(() => addCallHistoryEntryImpl(...args)); }
export function clearCallHistory(...args) { return mutate(() => clearCallHistoryImpl(...args)); }
export function saveSettings(...args) { return mutate(() => saveSettingsImpl(...args)); }
export function saveTrustedContact(...args) { return mutate(() => saveTrustedContactImpl(...args)); }
export function deleteTrustedContact(...args) { return mutate(() => deleteTrustedContactImpl(...args)); }
export function resetAllDataToDefault(...args) { return mutate(() => resetAllDataToDefaultImpl(...args)); }
