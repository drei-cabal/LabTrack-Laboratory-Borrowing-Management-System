import { AppTypography } from '../../constants/typography';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppColors } from '../../constants/colors';

export type BadgeType =
  | 'Available'
  | 'Partial'
  | 'Out'
  | 'overdue'
  | 'borrowed'
  | 'returned'
  | 'active'
  | 'inactive'
  | 'Active'
  | 'Inactive';

export interface StatusBadgeProps {
  status: BadgeType;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  let label: string = status;
  let textColor = AppColors.partial;
  let bgColor = AppColors.partialBg;
  let dotColor = AppColors.partial;

  switch (status.toLowerCase()) {
    case 'available':
      label = 'Available';
      textColor = AppColors.available;
      bgColor = AppColors.availableBg;
      dotColor = AppColors.available;
      break;
    case 'partial':
      label = 'Partial';
      textColor = AppColors.partial;
      bgColor = AppColors.partialBg;
      dotColor = AppColors.partial;
      break;
    case 'out':
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
      textColor = AppColors.returned;
      bgColor = AppColors.returnedBg;
      dotColor = AppColors.returned;
      break;
    case 'active':
      label = 'Active';
      textColor = AppColors.active;
      bgColor = AppColors.activeBg;
      dotColor = AppColors.active;
      break;
    case 'inactive':
      label = 'Inactive';
      textColor = AppColors.inactive;
      bgColor = AppColors.inactiveBg;
      dotColor = AppColors.grayLight;
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
    paddingVertical: 5,
    borderRadius: 3,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  text: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.chip,
    fontWeight: AppTypography.weight.semibold,
    lineHeight: AppTypography.lineHeight.chip,
    letterSpacing: 0.3,
  },
});
