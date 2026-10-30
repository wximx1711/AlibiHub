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
  const pinnedScenarios = scenarios.filter((s) => s.isPinned || s.isFavorite).slice(0, 3);
  const recentHistory = callHistory.slice(0, 3);

  return (
    <View style={styles.safeArea}>
      <Header
        title="AlibiHub"
        subtitle="Trợ lý thoát tình huống & giao tiếp thông minh"
        rightAction={() => onNavigateTab('settings')}
        rightLabel="⚙️ Cài đặt"
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Primary CTA: Quick Escape */}
        <View style={styles.sectionWrap}>
          <QuickEscapeButton
            onPress={onQuickEscape}
            isScheduled={scheduledInfo?.isScheduled}
            remainingSeconds={scheduledInfo?.remainingSeconds}
            onCancelSchedule={onCancelSchedule}
          />
        </View>

        {/* AI Assistant Promo Banner */}
        <TouchableOpacity
          style={styles.aiBanner}
          onPress={() => onNavigateTab('ai')}
          activeOpacity={0.85}
        >
          <View style={styles.aiBannerHeader}>
            <Text style={styles.aiBadge}>GEMINI AI POWERED</Text>
            <Text style={styles.aiSparkle}>✨</Text>
          </View>
          <Text style={styles.aiBannerTitle}>
            Tạo kịch bản cứu nguy tức thì từ mô tả tự nhiên
          </Text>
          <Text style={styles.aiBannerSub}>
            Mô tả tình huống khó xử của bạn → AI đề xuất người gọi, đoạn thoại & âm nền hợp lý.
          </Text>
          <View style={styles.aiBannerFooter}>
            <Text style={styles.aiBannerAction}>Trải nghiệm Trợ lý AI →</Text>
          </View>
        </TouchableOpacity>

        {/* Pinned / Favorite Scenarios */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>📌 Kịch bản ghim & yêu thích</Text>
            <TouchableOpacity onPress={() => onNavigateTab('library')}>
              <Text style={styles.viewAllText}>Xem tất cả ({scenarios.length}) →</Text>
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
              <Text style={styles.emptyText}>Chưa có kịch bản yêu thích nào được ghim.</Text>
            </View>
          )}
        </View>

        {/* Quick Tools Grid */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>🛠️ Công cụ nhanh</Text>
          <View style={styles.toolsGrid}>
            <TouchableOpacity
              style={styles.toolItem}
              onPress={() => onNavigateTab('call_setup')}
              activeOpacity={0.8}
            >
              <Text style={styles.toolIcon}>📞</Text>
              <Text style={styles.toolTitle}>Tùy chỉnh Cuộc gọi</Text>
              <Text style={styles.toolSub}>Hẹn giờ & âm nền</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolItem}
              onPress={() => onNavigateTab('vault')}
              activeOpacity={0.8}
            >
              <Text style={styles.toolIcon}>🔐</Text>
              <Text style={styles.toolTitle}>Kho Alibi Vault</Text>
              <Text style={styles.toolSub}>Quản lý hồ sơ & lưu trữ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolItem}
              onPress={() => onNavigateTab('network')}
              activeOpacity={0.8}
            >
              <Text style={styles.toolIcon}>🤝</Text>
              <Text style={styles.toolTitle}>Mạng lưới bạn bè</Text>
              <Text style={styles.toolSub}>Yêu cầu cứu nguy thật</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolItem}
              onPress={() => onNavigateTab('ai')}
              activeOpacity={0.8}
            >
              <Text style={styles.toolIcon}>💬</Text>
              <Text style={styles.toolTitle}>Soạn tin nhắn từ chối</Text>
              <Text style={styles.toolSub}>5 phong cách giao tiếp</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent History */}
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
            recentHistory.map((item) => (
              <View key={item.id} style={styles.historyItem}>
                <View style={styles.historyLeft}>
                  <Text style={styles.historyCaller}>{item.callerName}</Text>
                  <Text style={styles.historyScenario}>{item.scenarioTitle}</Text>
                </View>
                <View style={styles.historyRight}>
                  <Text style={styles.historyDate}>{item.dateFormatted}</Text>
                  <Text style={styles.historyDuration}>{item.durationSeconds || 0}s</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Chưa có lịch sử mô phỏng cuộc gọi nào.</Text>
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
    padding: spacing.lg,
    paddingBottom: spacing.xxxl * 2,
  },
  sectionWrap: {
    marginBottom: spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
  },
  viewAllText: {
    color: colors.accentLight,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semiBold,
  },
  aiBanner: {
    backgroundColor: colors.bgCardElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1.5,
    borderColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  aiBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  aiBadge: {
    color: colors.accentLight,
    fontSize: typography.fontSizes.xs - 1,
    fontWeight: typography.fontWeights.extraBold,
    letterSpacing: 1,
  },
  aiSparkle: {
    fontSize: 18,
  },
  aiBannerTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    lineHeight: 22,
    marginBottom: 4,
  },
  aiBannerSub: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  aiBannerFooter: {
    alignItems: 'flex-end',
  },
  aiBannerAction: {
    color: colors.accentLight,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  toolItem: {
    width: '48%',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  toolIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  toolTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    marginBottom: 2,
  },
  toolSub: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs - 1,
  },
  historyItem: {
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
    flex: 1,
  },
  historyCaller: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semiBold,
  },
  historyScenario: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyDate: {
    color: colors.textMuted,
    fontSize: typography.fontSizes.xs - 1,
  },
  historyDuration: {
    color: colors.success,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    marginTop: 2,
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
});

