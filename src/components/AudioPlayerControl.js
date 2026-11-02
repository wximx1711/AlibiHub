import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/colors';

export default function AudioPlayerControl({
  voiceVolume = 1.0,
  ambientVolume = 0.25,
  onVoiceVolumeChange,
  onAmbientVolumeChange,
}) {
  const steps = [0.0, 0.25, 0.5, 0.75, 1.0];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>BỘ TRỘN ÂM THANH MÔ PHỎNG (AUDIO MIXER)</Text>

      {/* Voice Volume */}
      <View style={styles.row}>
        <View style={styles.labelCol}>
          <Text style={styles.label}>🗣️ Âm lượng Giọng thoại</Text>
          <Text style={styles.subLabel}>
            Ưu tiên rõ ràng ({Math.round(voiceVolume * 100)}%)
          </Text>
        </View>
        <View style={styles.stepsWrap}>
          {steps.map((s) => (
            <TouchableOpacity
              key={`voice_${s}`}
              style={[
                styles.stepBtn,
                Math.abs(voiceVolume - s) < 0.05 && styles.stepBtnActive,
              ]}
              onPress={() => onVoiceVolumeChange && onVoiceVolumeChange(s)}
            >
              <Text
                style={[
                  styles.stepText,
                  Math.abs(voiceVolume - s) < 0.05 && styles.stepTextActive,
                ]}
              >
                {Math.round(s * 100)}%
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Ambient Volume */}
      <View style={[styles.row, { marginTop: spacing.md }]}>
        <View style={styles.labelCol}>
          <Text style={styles.label}>🔊 Âm thanh bối cảnh (Ambient)</Text>
          <Text style={styles.subLabel}>
            Giữ thấp để không lấn giọng ({Math.round(ambientVolume * 100)}%)
          </Text>
        </View>
        <View style={styles.stepsWrap}>
          {steps.map((s) => (
            <TouchableOpacity
              key={`ambient_${s}`}
              style={[
                styles.stepBtn,
                Math.abs(ambientVolume - s) < 0.05 && styles.stepBtnActive,
              ]}
              onPress={() => onAmbientVolumeChange && onAmbientVolumeChange(s)}
            >
              <Text
                style={[
                  styles.stepText,
                  Math.abs(ambientVolume - s) < 0.05 && styles.stepTextActive,
                ]}
              >
                {Math.round(s * 100)}%
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  header: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  row: {
    marginBottom: spacing.xs,
  },
  labelCol: {
    marginBottom: spacing.xs,
  },
  label: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.xs + 1,
    fontWeight: typography.fontWeights.semiBold,
  },
  subLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs - 1,
    marginTop: 1,
  },
  stepsWrap: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: 4,
  },
  stepBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.bgCardElevated,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  stepBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs - 1,
    fontWeight: typography.fontWeights.medium,
  },
  stepTextActive: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeights.bold,
  },
});
