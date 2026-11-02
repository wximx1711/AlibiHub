import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/colors';

export default function CallerCard({
  caller,
  onSelect,
  onEdit,
  onDelete,
  isSelected,
}) {
  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={onSelect}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.avatarCircle,
          { backgroundColor: caller.avatarBg || colors.secondary },
        ]}
      >
        {caller.avatarUrl ? (
          <Image
            source={{ uri: caller.avatarUrl }}
            style={{ width: 44, height: 44, borderRadius: 22 }}
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
          {caller.isPinned ? <Text style={styles.pinBadge}>📌</Text> : null}
        </View>
        <Text style={styles.role}>{caller.role || 'Người gọi'}</Text>
        <Text style={styles.phone}>{caller.phoneNumber || '0901 234 567'}</Text>
      </View>

      <View style={styles.actions}>
        {onEdit ? (
          <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
            <Text style={styles.btnText}>Sửa</Text>
          </TouchableOpacity>
        ) : null}
        {onDelete ? (
          <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
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
    marginBottom: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.bgCardElevated,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  infoWrap: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm + 1,
    fontWeight: typography.fontWeights.semiBold,
    marginRight: 4,
  },
  pinBadge: {
    fontSize: 12,
  },
  role: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs - 1,
    marginTop: 1,
  },
  phone: {
    color: colors.textMuted,
    fontSize: typography.fontSizes.xs - 1,
    marginTop: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editBtn: {
    backgroundColor: colors.bgCardElevated,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  btnText: {
    color: colors.primary,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semiBold,
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  deleteText: {
    color: colors.error,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semiBold,
  },
});