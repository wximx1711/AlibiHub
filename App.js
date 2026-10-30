/**
 * AlibiHub — AI-Powered Social Escape & Communication Assistant
 * Complete Phase 1 MVP + Phase 2 Foundation
 */

import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Platform,
  Alert,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

// Design System
import { colors, typography, spacing, borderRadius } from './src/theme/colors';

// Storage & Services
import {
  initializeStorageIfNeeded,
  getCallers,
  getScenarios,
  getCallHistory,
  getSettings,
  getTrustedContacts,
  saveCaller,
  deleteCaller,
  saveScenario,
  deleteScenario,
  toggleScenarioFavorite,
  addCallHistoryEntry,
  clearCallHistory,
  saveSettings,
  saveTrustedContact,
  deleteTrustedContact,
  resetAllDataToDefault,
} from './src/services/storageService';

import { notificationService } from './src/services/notificationService';
import { audioService } from './src/services/audioService';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import SmartCallSetupScreen from './src/screens/SmartCallSetupScreen';
import ScenarioLibraryScreen from './src/screens/ScenarioLibraryScreen';
import ScenarioDetailScreen from './src/screens/ScenarioDetailScreen';
import AiAssistantScreen from './src/screens/AiAssistantScreen';
import VaultScreen from './src/screens/VaultScreen';
import TrustedNetworkScreen from './src/screens/TrustedNetworkScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import IncomingCallScreen from './src/screens/IncomingCallScreen';
import ActiveCallScreen from './src/screens/ActiveCallScreen';

export default function App() { return <SafeAreaProvider><AppContent /></SafeAreaProvider>; }
function AppContent() {
  // Navigation State
  const [currentTab, setCurrentTab] = useState('home'); // 'home' | 'call_setup' | 'library' | 'ai' | 'vault' | 'network' | 'settings'
  const [activeModalScreen, setActiveModalScreen] = useState(null); // 'incoming_call' | 'active_call' | 'scenario_detail'

  // Data State
  const [callers, setCallers] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [callHistory, setCallHistory] = useState([]);
  const [settings, setSettings] = useState({});
  const [trustedContacts, setTrustedContacts] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Active / Selected Payload
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [activeCallPayload, setActiveCallPayload] = useState(null);
  const [callSetupInitialConfig, setCallSetupInitialConfig] = useState(null);

  // Scheduled Call state
  const [scheduledInfo, setScheduledInfo] = useState({ isScheduled: false, remainingSeconds: 0 });

  // Load Initial Data from Storage
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      await initializeStorageIfNeeded();
      const [storedCallers, storedScenarios, storedHistory, storedSettings, storedContacts] =
        await Promise.all([
          getCallers(),
          getScenarios(),
          getCallHistory(),
          getSettings(),
          getTrustedContacts(),
        ]);

      setCallers(storedCallers);
      setScenarios(storedScenarios);
      setCallHistory(storedHistory);
      setSettings(storedSettings);
      setTrustedContacts(storedContacts);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Subscribe to scheduled call updates
    const unsubscribe = notificationService.subscribe((info) => {
      setScheduledInfo(info);
    });

    return () => {
      unsubscribe();
      audioService.stopAll();
    };
  }, [loadData]);

  // ==========================================
  // CALL SIMULATION DISPATCHERS (FE1)
  // ==========================================

  // Trigger Incoming Call Overlay
  const triggerIncomingCall = useCallback((payload) => {
    notificationService.cancelScheduledCall().catch(err => Alert.alert('Lịch hẹn', err.message));
    setActiveCallPayload({ ...payload, ringtoneType: settings.ringtoneType, vibrationEnabled: settings.vibrationEnabled });
    setActiveModalScreen('incoming_call');
  }, [settings]);

  useEffect(() => notificationService.attach(triggerIncomingCall), [triggerIncomingCall]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (activeModalScreen === 'incoming_call' || activeModalScreen === 'active_call') return true;
      if (activeModalScreen) { setActiveModalScreen(null); return true; }
      if (currentTab !== 'home') { setCurrentTab('home'); return true; }
      return false;
    });
    return () => sub.remove();
  }, [activeModalScreen, currentTab]);

  // Quick Escape 1-Tap Trigger
  const handleQuickEscape = () => {
    // Pick first favorite or first caller
    const favoriteSc = scenarios.find((s) => s.isFavorite || s.isPinned) || scenarios[0];
    const topCaller = callers[0] || {
      name: 'Mẹ Yêu',
      phoneNumber: '0912 345 678',
      role: 'Gia đình',
    };

    const payload = {
      caller: {
        name: favoriteSc?.callerName || topCaller.name,
        phoneNumber: favoriteSc?.callerPhone || topCaller.phoneNumber,
        role: favoriteSc?.callerRole || topCaller.role,
        avatarUrl: favoriteSc?.callerAvatar || topCaller.avatarUrl,
      },
      delaySeconds: 0,
      ambientSound: favoriteSc?.ambientSound || 'cafe',
      ambientVolume: favoriteSc?.ambientVolume ?? settings.ambientVolume ?? 0.25,
      voiceVolume: favoriteSc?.voiceVolume ?? settings.voiceVolume ?? 1.0,
      dialogue: favoriteSc?.dialogue || [
        'Alo con à, về nhà gấp nhé bố mẹ đang cần con hỗ trợ việc gia đình ngay!',
        'Dạ vâng mẹ, con đang chào mọi người rồi về ngay đây ạ!',
      ],
      title: favoriteSc?.title || 'Cuộc gọi khẩn cấp (Quick Escape)',
    };

    triggerIncomingCall(payload);
  };

  // Schedule Call
  const handleScheduleCall = async (payload) => {
    try { await notificationService.scheduleCall(payload, (firedPayload) => {
      triggerIncomingCall(firedPayload);
    });
    setCurrentTab('home');
    } catch (err) { Alert.alert('Không thể hẹn cuộc gọi', err.message); }
  };

  // Cancel Scheduled Call
  const handleCancelSchedule = () => {
    notificationService.cancelScheduledCall().catch(err => Alert.alert('Lịch hẹn', err.message));
  };

  // Accept Call (Incoming -> Active)
  const handleAcceptCall = (payload) => {
    setActiveModalScreen('active_call');
  };

  // Decline Call
  const handleDeclineCall = async (payload) => {
    setActiveModalScreen(null);
    audioService.stopAll();

    const logged = await addCallHistoryEntry({
      status: 'declined',
      callerName: payload?.caller?.name || 'Người gọi',
      callerPhone: payload?.caller?.phoneNumber || '',
      scenarioTitle: payload?.title || 'Cuộc gọi mô phỏng',
      durationSeconds: 0,
    }).catch(err => { Alert.alert('Chưa lưu lịch sử', err.message); return null; });

    if (logged) {
      setCallHistory((prev) => [logged, ...prev]);
    }
  };

  // Hang Up Call
  const handleHangUpCall = async (callResult) => {
    setActiveModalScreen(null);
    audioService.stopAll();

    const logged = await addCallHistoryEntry({
      status: 'completed',
      callerName: callResult.callerName,
      callerPhone: callResult.callerPhone,
      scenarioTitle: callResult.scenarioTitle,
      durationSeconds: callResult.durationSeconds,
    }).catch(err => { Alert.alert('Chưa lưu lịch sử', err.message); return null; });

    if (logged) {
      setCallHistory((prev) => [logged, ...prev]);
    }
  };

  // ==========================================
  // SCENARIO HANDLERS (FE2 & FE3)
  // ==========================================

  const handleSelectScenario = (scenario) => {
    setSelectedScenario(scenario);
    setActiveModalScreen('scenario_detail');
  };

  const handleLaunchScenarioFromDetail = (scenario) => {
    setActiveModalScreen(null);
    const payload = {
      caller: {
        name: scenario.callerName,
        avatarUrl: scenario.callerAvatar,
        phoneNumber: scenario.callerPhone,
        role: scenario.category || 'Tình huống',
      },
      delaySeconds: scenario.delaySeconds || 0,
      ambientSound: scenario.ambientSound || 'office',
      ambientVolume: scenario.ambientVolume ?? settings.ambientVolume ?? 0.25,
      voiceVolume: scenario.voiceVolume ?? settings.voiceVolume ?? 1.0,
      dialogue: scenario.dialogue,
      title: scenario.title,
    };

    if (payload.delaySeconds === 0) {
      triggerIncomingCall(payload);
    } else {
      handleScheduleCall(payload);
    }
  };

  const handleCustomizeScenario = (scenario) => {
    setActiveModalScreen(null);
    setCallSetupInitialConfig(scenario);
    setCurrentTab('call_setup');
  };

  const handleToggleFavorite = async (scenarioId) => {
    try {
      const updated = await toggleScenarioFavorite(scenarioId);
      setScenarios((prev) => prev.map((s) => (s.id === scenarioId ? updated : s)));
    } catch (err) {
      Alert.alert('Không thể lưu yêu thích', err.message);
    }
  };

  const handleDeleteScenario = async (scenarioId) => {
    try {
      await deleteScenario(scenarioId);
      setScenarios((prev) => prev.filter((s) => s.id !== scenarioId));
      if (activeModalScreen === 'scenario_detail') {
        setActiveModalScreen(null);
      }
    } catch (err) {
      Alert.alert('Không thể cập nhật', err.message);
      throw err;
    }
  };

  // ==========================================
  // AI HANDLERS (AI1 & AI2)
  // ==========================================

  const handleTransferAiScenarioToCallSetup = (aiScenario) => {
    setCallSetupInitialConfig(aiScenario);
    setCurrentTab('call_setup');
  };

  const handleSaveAiScenarioToVault = async (aiScenario) => {
    try {
      const saved = await saveScenario(aiScenario);
      setScenarios((prev) => [saved, ...prev.filter(s => s.id !== saved.id)]);
      Alert.alert('Đã lưu', 'Kịch bản đã có trong Kho Alibi Vault.');
    } catch (err) {
      Alert.alert('Không thể cập nhật', err.message);
      throw err;
    }
  };

  // ==========================================
  // VAULT & SETTINGS HANDLERS (FE3)
  // ==========================================

  const handleSaveCaller = async (callerData) => {
    const saved = await saveCaller(callerData);
    setCallers((prev) => {
      const exists = prev.some((c) => c.id === saved.id);
      return exists ? prev.map((c) => (c.id === saved.id ? saved : c)) : [saved, ...prev];
    });
  };

  const handleDeleteCaller = async (callerId) => {
    await deleteCaller(callerId);
    setCallers((prev) => prev.filter((c) => c.id !== callerId));
  };

  const handleClearHistory = async () => {
    await clearCallHistory();
    setCallHistory([]);
  };

  const handleSaveSettings = async (newSettings) => {
    const saved = await saveSettings(newSettings);
    setSettings(saved);
  };

  const handleResetFactoryData = async () => {
    await notificationService.cancelScheduledCall();
    audioService.stopAll();
    await resetAllDataToDefault();
    await loadData();
  };

  // Trusted Network Handlers (FE4)
  const handleAddContact = async (contact) => {
    const updated = await saveTrustedContact(contact);
    setTrustedContacts(updated);
  };

  const handleDeleteContact = async (contactId) => {
    const updated = await deleteTrustedContact(contactId);
    setTrustedContacts(updated);
  };

  if (loadError) return <View style={{ flex: 1, padding: 30, justifyContent: 'center', backgroundColor: colors.bgDark }}><Text style={{ color: colors.textPrimary }}>{loadError}</Text><TouchableOpacity onPress={loadData}><Text style={{ color: colors.primary, padding: 20 }}>Thử tải lại dữ liệu</Text></TouchableOpacity></View>;
  if (isLoading) return <View style={{ flex: 1, backgroundColor: colors.bgDark, justifyContent: 'center' }}><ActivityIndicator color={colors.primary} /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />
      <ExpoStatusBar style="light" />

      {/* Main Tab Content */}
      <View style={styles.mainContent}>
        {currentTab === 'home' && (
          <HomeScreen
            scenarios={scenarios}
            callHistory={callHistory}
            scheduledInfo={scheduledInfo}
            onQuickEscape={handleQuickEscape}
            onCancelSchedule={handleCancelSchedule}
            onSelectScenario={handleSelectScenario}
            onLaunchScenario={handleLaunchScenarioFromDetail}
            onToggleFavorite={handleToggleFavorite}
            onNavigateTab={setCurrentTab}
          />
        )}

        {currentTab === 'call_setup' && (
          <SmartCallSetupScreen
            callers={callers}
            initialConfig={callSetupInitialConfig}
            onLaunchCall={triggerIncomingCall}
            onScheduleCall={handleScheduleCall}
            onSaveTemplate={async (template) => {
              const saved = await saveScenario(template);
              setScenarios((prev) => [saved, ...prev.filter(s => s.id !== saved.id)]);
            }}
            onBack={() => {
              setCallSetupInitialConfig(null);
              setCurrentTab('home');
            }}
          />
        )}

        {currentTab === 'library' && (
          <ScenarioLibraryScreen
            scenarios={scenarios}
            onSelectScenario={handleSelectScenario}
            onLaunchScenario={handleLaunchScenarioFromDetail}
            onToggleFavorite={handleToggleFavorite}
            onCreateCustom={() => {
              setCallSetupInitialConfig(null);
              setCurrentTab('call_setup');
            }}
            onBack={() => setCurrentTab('home')}
          />
        )}

        {currentTab === 'ai' && (
          <AiAssistantScreen
            onTransferToCallSimulator={handleTransferAiScenarioToCallSetup}
            onSaveScenarioToVault={handleSaveAiScenarioToVault}
            onBack={() => setCurrentTab('home')}
          />
        )}

        {currentTab === 'vault' && (
          <VaultScreen
            callers={callers}
            scenarios={scenarios}
            callHistory={callHistory}
            onSelectScenario={handleSelectScenario}
            onLaunchScenario={handleLaunchScenarioFromDetail}
            onToggleFavorite={handleToggleFavorite}
            onDeleteScenario={handleDeleteScenario}
            onSaveCaller={handleSaveCaller}
            onDeleteCaller={handleDeleteCaller}
            onClearHistory={handleClearHistory}
            onBack={() => setCurrentTab('home')}
          />
        )}

        {currentTab === 'network' && (
          <TrustedNetworkScreen
            trustedContacts={trustedContacts}
            onAddContact={handleAddContact}
            onDeleteContact={handleDeleteContact}
            onBack={() => setCurrentTab('home')}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsScreen
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onResetFactoryData={handleResetFactoryData}
            onBack={() => setCurrentTab('home')}
          />
        )}
      </View>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        {[
          { id: 'home', label: 'Trang chủ', icon: '🏠' },
          { id: 'call_setup', label: 'Gọi mô phỏng', icon: '📞' },
          { id: 'library', label: 'Thư viện', icon: '📚' },
          { id: 'ai', label: 'Trợ lý AI', icon: '✨' },
          { id: 'vault', label: 'Kho Vault', icon: '🔐' },
        ].map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.navItem}
              onPress={() => {
                if (tab.id === 'call_setup') setCallSetupInitialConfig(null);
                setCurrentTab(tab.id);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.navIcon, isActive && styles.navIconActive]}>
                {tab.icon}
              </Text>
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Full-Screen Overlays (Simulated Calls) */}
      {activeModalScreen === 'incoming_call' && (
        <View style={StyleSheet.absoluteFill}>
          <IncomingCallScreen
            callPayload={activeCallPayload}
            onAccept={handleAcceptCall}
            onDecline={handleDeclineCall}
          />
        </View>
      )}

      {activeModalScreen === 'active_call' && (
        <View style={StyleSheet.absoluteFill}>
          <ActiveCallScreen
            callPayload={activeCallPayload}
            onHangUp={handleHangUpCall}
          />
        </View>
      )}

      {activeModalScreen === 'scenario_detail' && (
        <View style={StyleSheet.absoluteFill}>
          <ScenarioDetailScreen
            scenario={selectedScenario}
            onLaunch={handleLaunchScenarioFromDetail}
            onCustomize={handleCustomizeScenario}
            onDelete={handleDeleteScenario}
            onBack={() => setActiveModalScreen(null)}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  mainContent: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: colors.bgCardBorder,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: spacing.xs,
    minWidth: 54,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 2,
    opacity: 0.6,
  },
  navIconActive: {
    opacity: 1,
    transform: [{ scale: 1.15 }],
  },
  navLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs - 2,
    fontWeight: typography.fontWeights.medium,
  },
  navLabelActive: {
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
});

