import { AppTypography } from '../../constants/typography';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppColors } from '../../constants/colors';

export interface ProgressBarProps {
  available: number;
  total: number;
}

export function ProgressBar({ available, total }: ProgressBarProps) {
  const percentage = total > 0 ? Math.min(100, Math.max(0, (available / total) * 100)) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${percentage}%` }]} />
      </View>
      <Text style={styles.label} accessibilityLabel={`${available} of ${total} available`}>
        {available}/{total} avail.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barTrack: {
    flex: 1,
    height: 4,
    backgroundColor: AppColors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: AppColors.navy,
    borderRadius: 2,
  },
  label: {
    flexShrink: 0,
    fontVariant: ['tabular-nums'],
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.small,
    lineHeight: AppTypography.lineHeight.small,
    color: AppColors.textSecondary,
    fontWeight: AppTypography.weight.medium,
  },
});
