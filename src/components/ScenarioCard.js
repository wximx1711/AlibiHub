import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/colors';

export default function ScenarioCard({
  scenario,
  onSelect,
  onLaunch,
  onToggleFavorite,
}) {
  const getTagColor = (tag) => {
    switch (tag) {
      case 'tagWork':
        return colors.tagWork;
      case 'tagFamily':
        return colors.tagFamily;
      case 'tagFriends':
        return colors.tagFriends;
      case 'tagParty':
        return colors.tagParty;
      default:
        return colors.tagEmergency;
    }
  };

  const getAmbientLabel = (amb) => {
    switch (amb) {
      case 'office':
        return '🏢 Văn phòng';
      case 'cafe':
        return '☕ Quán cà phê';
      case 'street':
        return '🚗 Đường phố';
      case 'hospital':
        return '🏥 Bệnh viện';
      default:
        return '🔇 Yên tĩnh';
    }
  };

  const tagColor = getTagColor(scenario.categoryTag);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onSelect}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.badge,
            { backgroundColor: tagColor + '20', borderColor: tagColor + '40' },
          ]}
        >
          <Text style={[styles.badgeText, { color: tagColor }]}>
            {scenario.category || 'Tình huống'}
          </Text>
        </View>
        <TouchableOpacity
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={onToggleFavorite}
        >
          <Text style={styles.heart}>{scenario.isFavorite ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {scenario.title}
      </Text>

      {scenario.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {scenario.description}
        </Text>
      ) : null}

      <View style={styles.metaRow}>
        <Text style={styles.callerInfo}>
          👤 {scenario.callerName || 'Người gọi'}
        </Text>
        <Text style={styles.metaDivider}>•</Text>
        <Text style={styles.ambientInfo}>
          {getAmbientLabel(scenario.ambientSound)}
        </Text>
        <Text style={styles.metaDivider}>•</Text>
        <Text style={styles.delayInfo}>
          ⏱️ {scenario.delaySeconds ? `${scenario.delaySeconds}s` : 'Ngay'}
        </Text>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.dialogueCount}>
          💬 {scenario.dialogue?.length || 2} câu thoại
        </Text>
        <TouchableOpacity
          style={styles.launchBtn}
          onPress={onLaunch}
          activeOpacity={0.8}
        >
          <Text style={styles.launchBtnText}>Gọi mô phỏng →</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
    shadowColor: '#352A21',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: typography.fontSizes.xs - 1,
    fontWeight: typography.fontWeights.semiBold,
  },
  heart: {
    fontSize: 16,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm + 1,
    fontWeight: typography.fontWeights.bold,
    lineHeight: 20,
    marginBottom: 4,
  },
  description: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    lineHeight: 16,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  callerInfo: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.xs - 1,
    fontWeight: typography.fontWeights.medium,
  },
  metaDivider: {
    color: colors.textMuted,
    marginHorizontal: spacing.xs + 2,
    fontSize: typography.fontSizes.xs - 2,
  },
  ambientInfo: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs - 1,
  },
  delayInfo: {
    color: colors.warning,
    fontSize: typography.fontSizes.xs - 1,
    fontWeight: typography.fontWeights.medium,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.bgCardBorder,
    paddingTop: spacing.xs + 4,
  },
  dialogueCount: {
    color: colors.textMuted,
    fontSize: typography.fontSizes.xs - 1,
  },
  launchBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
  },
  launchBtnText: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
  },
});
