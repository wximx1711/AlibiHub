import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/colors';

export default function Header({ title, subtitle, rightAction, rightLabel }) {
  return (
    <View style={styles.header}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {rightAction ? (
        <TouchableOpacity style={styles.actionButton} onPress={rightAction} activeOpacity={0.7}>
          <Text style={styles.actionLabel}>{rightLabel || 'Hành động'}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgDark,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgCardBorder,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 0.3,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
  },
  actionButton: {
    backgroundColor: colors.bgCardElevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.accentLight + '40',
  },
  actionLabel: {
    color: colors.accentLight,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semiBold,
  },
});

