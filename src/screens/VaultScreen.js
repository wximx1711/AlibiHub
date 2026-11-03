import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/colors';
import Header from '../components/Header';
import ScenarioCard from '../components/ScenarioCard';
import CallerCard from '../components/CallerCard';
import ConfirmModal from '../components/ConfirmModal';
import CallerProfileModal from '../components/CallerProfileModal';

export default function VaultScreen({
  callers = [],
  scenarios = [],
  callHistory = [],
  onSelectScenario,
  onLaunchScenario,
  onToggleFavorite,
  onDeleteScenario,
  onDuplicateScenario,
  onSaveCaller,
  onDeleteCaller,
  onDuplicateCaller,
  onSetDefaultCaller,
  onClearHistory,
  onBack,
}) {
  const [activeTab, setActiveTab] = useState('scenarios'); // 'scenarios' | 'callers' | 'history'

  // Delete modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'scenario' | 'caller' | 'history', id, title }

  // Add/Edit Caller Modal
  const [callerModalVisible, setCallerModalVisible] = useState(false);
  const [editingCaller, setEditingCaller] = useState(null);

  const savedScenarios = scenarios.filter((s) => s.isCustom || s.isFavorite);

  // Trigger delete confirmation
  const promptDeleteScenario = (sc) => {
    setDeleteTarget({ type: 'scenario', id: sc.id, title: sc.title });
    setDeleteModalVisible(true);
  };

  const promptDeleteCaller = (c) => {
    setDeleteTarget({ type: 'caller', id: c.id, title: c.name });
    setDeleteModalVisible(true);
  };

  const promptClearHistory = () => {
    setDeleteTarget({ type: 'history', id: null, title: 'toàn bộ lịch sử cuộc gọi' });
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === 'scenario') {
        await onDeleteScenario(deleteTarget.id);
      } else if (deleteTarget.type === 'caller') {
        await onDeleteCaller(deleteTarget.id);
      } else if (deleteTarget.type === 'history') {
        await onClearHistory();
      }

      setDeleteModalVisible(false);
      setDeleteTarget(null);
    } catch (err) {
      Alert.alert('Không thể xóa', err.message);
    }
  };

  // Open add/edit caller modal
  const openAddCallerModal = (caller = null) => {
    setEditingCaller(caller);
    setCallerModalVisible(true);
  };

  const handleSaveCallerFromModal = async (callerData) => {
    try {
      await onSaveCaller(callerData);
      setCallerModalVisible(false);
    } catch (err) {
      Alert.alert('Không thể lưu hồ sơ', err.message);
    }
  };

  return (
    <View style={styles.safeArea}>
      <Header
        title="Kho Alibi Vault"
        subtitle="Quản lý dữ liệu & cấu hình cá nhân"
        rightAction={
          activeTab === 'callers'
            ? () => openAddCallerModal()
            : activeTab === 'history' && callHistory.length > 0
            ? promptClearHistory
            : null
        }
        rightLabel={
          activeTab === 'callers'
            ? '+ Thêm người gọi'
            : activeTab === 'history' && callHistory.length > 0
            ? 'Xóa tất cả'
            : null
        }
      />

      {/* Vault Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'scenarios' && styles.tabItemActive]}
          onPress={() => setActiveTab('scenarios')}
        >
          <Text style={[styles.tabText, activeTab === 'scenarios' && styles.tabTextActive]}>
            📑 Kịch bản ({savedScenarios.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'callers' && styles.tabItemActive]}
          onPress={() => setActiveTab('callers')}
        >
          <Text style={[styles.tabText, activeTab === 'callers' && styles.tabTextActive]}>
            👥 Người gọi ({callers.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'history' && styles.tabItemActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            🕒 Lịch sử ({callHistory.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* ======================================================== */}
        {/* TAB 1: SAVED SCENARIOS */}
        {/* ======================================================== */}
        {activeTab === 'scenarios' ? (
          <View>
            {savedScenarios.length > 0 ? (
              savedScenarios.map((sc) => (
                <View key={sc.id} style={styles.scenarioWrapper}>
                  <ScenarioCard
                    scenario={sc}
                    onSelect={() => onSelectScenario(sc)}
                    onLaunch={() => onLaunchScenario(sc)}
                    onToggleFavorite={() => onToggleFavorite(sc.id)}
                  />
                  <View style={styles.scenarioExtraActions}>
                    {onDuplicateScenario && (
                      <TouchableOpacity
                        style={styles.scenarioActionPill}
                        onPress={() => onDuplicateScenario(sc.id)}
                      >
                        <Text style={styles.scenarioActionPillText}>📑 Nhân bản</Text>
                      </TouchableOpacity>
                    )}
                    {onDeleteScenario && (
                      <TouchableOpacity
                        style={[styles.scenarioActionPill, styles.scenarioDeletePill]}
                        onPress={() => promptDeleteScenario(sc)}
                      >
                        <Text style={[styles.scenarioActionPillText, styles.scenarioDeleteText]}>🗑️ Xóa</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyIcon}>📂</Text>
                <Text style={styles.emptyTitle}>Chưa có kịch bản đã lưu</Text>
                <Text style={styles.emptySub}>
                  Bạn có thể lưu các kịch bản từ Thư viện hoặc tạo kịch bản mới bằng Trợ lý AI.
                </Text>
              </View>
            )}
          </View>
        ) : null}

        {/* ======================================================== */}
        {/* TAB 2: CALLER PROFILES */}
        {/* ======================================================== */}
        {activeTab === 'callers' ? (
          <View>
            {callers.map((c) => (
              <CallerCard
                key={c.id}
                caller={c}
                onSelect={() => openAddCallerModal(c)}
                onEdit={() => openAddCallerModal(c)}
                onDuplicate={() => onDuplicateCaller?.(c.id)}
                onSetDefault={() => onSetDefaultCaller?.(c.id)}
                onDelete={callers.length > 1 ? () => promptDeleteCaller(c) : null}
              />
            ))}
          </View>
        ) : null}

        {/* ======================================================== */}
        {/* TAB 3: CALL HISTORY */}
        {/* ======================================================== */}
        {activeTab === 'history' ? (
          <View>
            {callHistory.length > 0 ? (
              callHistory.map((item) => (
                <View key={item.id} style={styles.historyCard}>
                  <View style={styles.historyMain}>
                    <Text style={styles.historyCaller}>{item.callerName}</Text>
                    <Text style={styles.historyScenario}>{item.scenarioTitle}</Text>
                    <Text style={styles.historyPhone}>{item.callerPhone}</Text>
                  </View>
                  <View style={styles.historyMeta}>
                    <Text style={styles.historyDate}>{item.dateFormatted}</Text>
                    <Text style={styles.historyStatus}>✓ Đã hoàn thành ({item.durationSeconds || 0}s)</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyIcon}>🕒</Text>
                <Text style={styles.emptyTitle}>Chưa có lịch sử cuộc gọi</Text>
                <Text style={styles.emptySub}>
                  Các cuộc gọi mô phỏng đã thực hiện sẽ được lưu nhật ký tại đây để bạn tiện theo dõi.
                </Text>
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        visible={deleteModalVisible}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa "${deleteTarget?.title}" khỏi bộ nhớ không? Hành động này không thể hoàn tác.`}
        confirmText="Xác nhận xóa"
        isDestructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalVisible(false)}
      />

      {/* Comprehensive Dynamic Caller Profile Modal */}
      <CallerProfileModal
        visible={callerModalVisible}
        caller={editingCaller}
        onSave={handleSaveCallerFromModal}
        onDelete={(callerId) => onDeleteCaller?.(callerId)}
        onDuplicate={(callerId) => onDuplicateCaller?.(callerId)}
        onClose={() => setCallerModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.bgDark,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  tabItem: {
    paddingVertical: spacing.md,
    marginRight: spacing.xl,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs + 1,
    fontWeight: typography.fontWeights.medium,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl * 2,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    marginBottom: spacing.xs,
  },
  emptySub: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
  scenarioWrapper: {
    marginBottom: spacing.sm,
  },
  scenarioExtraActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    marginTop: -4,
    marginBottom: spacing.xs,
    paddingRight: spacing.xs,
  },
  scenarioActionPill: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scenarioActionPillText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  scenarioDeletePill: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  scenarioDeleteText: {
    color: '#DC2626',
  },
  historyCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyMain: {
    flex: 1,
  },
  historyCaller: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  historyScenario: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
  },
  historyPhone: {
    color: colors.primary,
    fontSize: typography.fontSizes.xs - 1,
    marginTop: 2,
  },
  historyMeta: {
    alignItems: 'flex-end',
  },
  historyDate: {
    color: colors.textMuted,
    fontSize: typography.fontSizes.xs - 1,
  },
  historyStatus: {
    color: colors.success,
    fontSize: typography.fontSizes.xs - 1,
    fontWeight: typography.fontWeights.semiBold,
    marginTop: 4,
  },
});
