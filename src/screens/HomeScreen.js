import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/colors';
import Header from '../components/Header';
import QuickEscapeButton from '../components/QuickEscapeButton';
import ScenarioCard from '../components/ScenarioCard';

export default function HomeScreen({
  scenarios = [],
  callHistory = [],
  scheduledInfo,
  onQuickEscape,
  onCancelSchedule,
  onSelectScenario,
  onLaunchScenario,
  onToggleFavorite,
  onNavigateTab,
}) {
  const pinnedScenarios = scenarios
    .filter((s) => s.isPinned || s.isFavorite)
    .slice(0, 3);
  const recentHistory = callHistory.slice(0, 3);

  return (
    <View style={styles.safeArea}>
      <Header
        title="AlibiHub"
        subtitle="Trợ lý thoát tình huống & giao tiếp thông minh"
        rightAction={() => onNavigateTab('settings')}
        rightLabel="⚙️ Cài đặt"
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        {/* 1. PRIORITY CTA: Quick Escape (1-Tap Emergency Trigger) */}
        <View style={styles.sectionWrap}>
          <QuickEscapeButton
            onPress={onQuickEscape}
            isScheduled={scheduledInfo?.isScheduled}
            remainingSeconds={scheduledInfo?.remainingSeconds}
            onCancelSchedule={onCancelSchedule}
          />
        </View>

        {/* 2 & 3. PRIMARY ACTIONS: Tạo cuộc gọi & Hẹn giờ */}
        <View style={styles.sectionWrap}>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => onNavigateTab('call_setup')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: colors.primaryLight }]}>
                <Text style={styles.actionIcon}>📞</Text>
              </View>
              <View style={styles.actionTextWrap}>
                <Text style={styles.actionTitle}>Tạo cuộc gọi</Text>
                <Text style={styles.actionSub}>Gọi tức thì & kịch bản</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => onNavigateTab('call_setup')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: colors.secondaryLight }]}>
                <Text style={styles.actionIcon}>⏱️</Text>
              </View>
              <View style={styles.actionTextWrap}>
                <Text style={styles.actionTitle}>Hẹn giờ</Text>
                <Text style={styles.actionSub}>10s, 1p, giờ cụ thể</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. FAVORITE / PINNED SCENARIOS */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>📌 Kịch bản yêu thích & gần đây</Text>
            <TouchableOpacity onPress={() => onNavigateTab('library')}>
              <Text style={styles.viewAllText}>
                Xem tất cả ({scenarios.length}) →
              </Text>
            </TouchableOpacity>
          </View>

          {pinnedScenarios.length > 0 ? (
            pinnedScenarios.map((sc) => (
              <ScenarioCard
                key={sc.id}
                scenario={sc}
                onSelect={() => onSelectScenario(sc)}
                onLaunch={() => onLaunchScenario(sc)}
                onToggleFavorite={() => onToggleFavorite(sc.id)}
              />
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                Chưa có kịch bản yêu thích nào được ghim.
              </Text>
            </View>
          )}
        </View>

        {/* 5. SMALL SECONDARY ENTRY TO AI ASSISTANT (Utility bar, not dominant banner) */}
        <View style={styles.sectionWrap}>
          <TouchableOpacity
            style={styles.aiUtilityBar}
            onPress={() => onNavigateTab('ai')}
            activeOpacity={0.8}
          >
            <View style={styles.aiIconBubble}>
              <Text style={styles.aiIcon}>✨</Text>
            </View>
            <View style={styles.aiTextContainer}>
              <Text style={styles.aiBarTitle}>Trợ lý AI Gemini</Text>
              <Text style={styles.aiBarSub}>
                Soạn tin nhắn từ chối lịch sự & sinh kịch bản tự động
              </Text>
            </View>
            <Text style={styles.aiChevron}>→</Text>
          </TouchableOpacity>
        </View>

        {/* 6. RECENT CALL HISTORY */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>🕒 Cuộc gọi gần đây</Text>
            {callHistory.length > 0 ? (
              <TouchableOpacity onPress={() => onNavigateTab('vault')}>
                <Text style={styles.viewAllText}>Chi tiết lịch sử</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {recentHistory.length > 0 ? (
            recentHistory.map((entry) => (
              <View key={entry.id} style={styles.historyCard}>
                <View style={styles.historyLeft}>
                  <View
                    style={[
                      styles.historyStatusDot,
                      {
                        backgroundColor:
                          entry.status === 'completed'
                            ? colors.success
                            : colors.error,
                      },
                    ]}
                  />
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyCaller} numberOfLines={1}>
                      {entry.callerName}
                    </Text>
                    <Text style={styles.historyScenario} numberOfLines={1}>
                      {entry.scenarioTitle}
                    </Text>
                  </View>
                </View>

                <View style={styles.historyRight}>
                  <Text style={styles.historyDate}>{entry.dateFormatted}</Text>
                  <Text style={styles.historyDuration}>
                    {entry.status === 'completed'
                      ? `${entry.durationSeconds || 0}s`
                      : 'Đã từ chối'}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                Chưa có lịch sử cuộc gọi mô phỏng nào.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl * 2,
  },
  sectionWrap: {
    marginBottom: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm + 1,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 0.3,
  },
  viewAllText: {
    color: colors.primary,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semiBold,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
    shadowColor: '#352A21',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  actionIcon: {
    fontSize: 20,
  },
  actionTextWrap: {
    flex: 1,
  },
  actionTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  actionSub: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs - 1,
    marginTop: 2,
  },
  aiUtilityBar: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
    shadowColor: '#352A21',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  aiIconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  aiIcon: {
    fontSize: 18,
  },
  aiTextContainer: {
    flex: 1,
  },
  aiBarTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  aiBarSub: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs - 1,
    marginTop: 2,
  },
  aiChevron: {
    color: colors.textMuted,
    fontSize: 16,
    marginLeft: spacing.sm,
  },
  emptyCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.fontSizes.xs,
  },
  historyCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  historyStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  historyInfo: {
    flex: 1,
  },
  historyCaller: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semiBold,
  },
  historyScenario: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs - 1,
    marginTop: 1,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyDate: {
    color: colors.textMuted,
    fontSize: typography.fontSizes.xs - 2,
  },
  historyDuration: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    marginTop: 2,
  },
});
