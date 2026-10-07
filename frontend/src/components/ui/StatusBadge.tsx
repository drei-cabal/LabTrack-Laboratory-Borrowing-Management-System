import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppColors } from '../../constants/colors';

export type BadgeType = 'Available' | 'Partial' | 'Out' | 'overdue' | 'borrowed' | 'returned';

export interface StatusBadgeProps {
  status: BadgeType;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  let label: string = status;
  let textColor = AppColors.partial;
  let bgColor = AppColors.partialBg;
  let dotColor = AppColors.partial;

  switch (status) {
    case 'Available':
      label = 'Available';
      textColor = AppColors.available;
      bgColor = AppColors.availableBg;
      dotColor = AppColors.available;
      break;
    case 'Partial':
      label = 'Partial';
      textColor = '#475569';
      bgColor = '#F1F5F9';
      dotColor = '#475569';
      break;
    case 'Out':
      label = 'Out';
      textColor = AppColors.out;
      bgColor = AppColors.outBg;
      dotColor = AppColors.out;
      break;
    case 'overdue':
      label = 'Overdue';
      textColor = AppColors.overdue;
      bgColor = AppColors.overdueBg;
      dotColor = AppColors.overdue;
      break;
    case 'borrowed':
      label = 'Borrowed';
      textColor = AppColors.borrowed;
      bgColor = AppColors.borrowedBg;
      dotColor = AppColors.borrowed;
      break;
    case 'returned':
      label = 'Returned';
      textColor = AppColors.available;
      bgColor = AppColors.availableBg;
      dotColor = AppColors.available;
      break;
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});
