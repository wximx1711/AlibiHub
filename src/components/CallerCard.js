import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/colors';

export default function CallerCard({
  caller,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
  onSetDefault,
  isSelected,
}) {
  const voiceLabel =
    caller.voiceId === 'kore'
      ? 'Kore (Nữ)'
      : caller.voiceId === 'aoede'
      ? 'Aoede (Nữ)'
      : caller.voiceId === 'charon'
      ? 'Charon (Nam)'
      : caller.voiceId === 'fenrir'
      ? 'Fenrir (Nam)'
      : caller.voiceId === 'puck'
      ? 'Puck (Nam)'
      : caller.gender === 'female'
      ? 'Giọng Nữ'
      : caller.gender === 'male'
      ? 'Giọng Nam'
      : 'Tự động';

  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={onSelect}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.avatarCircle,
          { backgroundColor: caller.avatarBg || colors.primaryLight },
        ]}
      >
        {caller.avatarUrl ? (
          <Image
            source={{ uri: caller.avatarUrl }}
            style={{ width: 48, height: 48, borderRadius: 24 }}
          />
        ) : (
          <Text style={styles.avatarInitials}>
            {caller.initials ||
              caller.name?.substring(0, 2)?.toUpperCase() ||
              'AL'}
          </Text>
        )}
      </View>

      <View style={styles.infoWrap}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {caller.name}
          </Text>
          {caller.isDefault ? (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>Mặc định</Text>
            </View>
          ) : null}
          {caller.isPinned ? <Text style={styles.pinBadge}>📌</Text> : null}
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.role}>{caller.role || 'Người gọi'}</Text>
          <Text style={styles.metaDot}>•</Text>
          <View style={styles.voiceBadge}>
            <Text style={styles.voiceBadgeText}>{voiceLabel}</Text>
          </View>
        </View>

        <Text style={styles.phone}>{caller.phoneNumber || '0901 234 567'}</Text>
      </View>

      <View style={styles.actions}>
        {onEdit ? (
          <TouchableOpacity style={styles.actionBtn} onPress={onEdit} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Text style={styles.actionBtnText}>Sửa</Text>
          </TouchableOpacity>
        ) : null}
        {onDuplicate ? (
          <TouchableOpacity style={styles.actionBtn} onPress={onDuplicate} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Text style={styles.actionBtnText}>Nhân bản</Text>
          </TouchableOpacity>
        ) : null}
        {onDelete ? (
          <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={onDelete} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Text style={styles.deleteText}>Xóa</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs + 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  avatarInitials: {
    color: colors.primary,
    fontSize: typography.fontSizes.sm + 1,
    fontWeight: typography.fontWeights.bold,
  },
  infoWrap: {
    flex: 1,
    marginRight: spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  name: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm + 1,
    fontWeight: typography.fontWeights.semiBold,
  },
  defaultBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  defaultBadgeText: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '700',
  },
  pinBadge: {
    fontSize: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    flexWrap: 'wrap',
  },
  role: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
  },
  metaDot: {
    color: colors.textMuted,
    marginHorizontal: 4,
    fontSize: typography.fontSizes.xs,
  },
  voiceBadge: {
    backgroundColor: colors.bgInput,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  voiceBadgeText: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: '600',
  },
  phone: {
    color: colors.textMuted,
    fontSize: typography.fontSizes.xs - 1,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
  },
  actionBtn: {
    backgroundColor: colors.bgInput,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionBtnText: {
    color: colors.primary,
    fontSize: typography.fontSizes.xs - 1,
    fontWeight: typography.fontWeights.semiBold,
  },
  deleteBtn: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  deleteText: {
    color: '#DC2626',
    fontSize: typography.fontSizes.xs - 1,
    fontWeight: typography.fontWeights.semiBold,
  },
});
