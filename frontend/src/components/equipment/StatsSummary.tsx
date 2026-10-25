import { AppTypography } from '../../constants/typography';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppColors } from '../../constants/colors';

export interface StatsSummaryProps {
  total: number;
  borrowed: number;
  available: number;
}

export function StatsSummary({ total, borrowed, available }: StatsSummaryProps) {
  return (
    <View style={styles.card}>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{total}</Text>
        <Text style={styles.statLabel}>Total</Text>
      </View>

      <View style={styles.statDivider} />

      <View style={styles.statItem}>
        <Text style={[styles.statNumber, styles.borrowedNumber]}>{borrowed}</Text>
        <Text style={styles.statLabel}>Borrowed</Text>
      </View>

      <View style={styles.statDivider} />

      <View style={styles.statItem}>
        <Text style={[styles.statNumber, styles.availableNumber]}>{available}</Text>
        <Text style={styles.statLabel}>Available</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingVertical: 14,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.display,
    fontWeight: AppTypography.weight.bold,
    color: AppColors.text,
    marginBottom: 2,
  },
  borrowedNumber: {
    color: AppColors.borrowed,
  },
  availableNumber: {
    color: AppColors.available,
  },
  statLabel: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.small,
    color: AppColors.textSecondary,
    fontWeight: AppTypography.weight.medium,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: AppColors.border,
  },
});
