import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/colors';

export default function CallerCard({ caller, onSelect, onEdit, onDelete, isSelected }) {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected && styles.cardSelected,
      ]}
      onPress={onSelect}
      activeOpacity={0.8}
    >
      <View style={[styles.avatarCircle, { backgroundColor: caller.avatarBg || colors.accent }]}>
        {caller.avatarUrl ? <Image source={{ uri: caller.avatarUrl }} style={{ width: 48, height: 48, borderRadius: 24 }} /> : <Text style={styles.avatarInitials}>
          {caller.initials || caller.name?.substring(0, 2)?.toUpperCase() || 'AL'}
        </Text>}
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
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.bgCardElevated,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.md,
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
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semiBold,
    marginRight: 4,
  },
  pinBadge: {
    fontSize: 12,
  },
  role: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    marginTop: 1,
  },
  phone: {
    color: colors.accentLight,
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginRight: spacing.xs,
  },
  btnText: {
    color: colors.primary,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
  },
  deleteBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  deleteText: {
    color: colors.error,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
  },
});
