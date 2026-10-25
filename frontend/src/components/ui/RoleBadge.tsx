import { AppTypography } from '../../constants/typography';
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { AppColors } from '../../constants/colors';

export type RoleType = 'admin' | 'assistant' | 'staff' | string;

export interface RoleBadgeProps {
  role: RoleType;
  style?: StyleProp<ViewStyle>;
}

export function RoleBadge({ role, style }: RoleBadgeProps) {
  const isAdmin = role.toLowerCase() === 'admin';

  return (
    <View
      style={[
        styles.badge,
        isAdmin ? styles.adminBadge : styles.asstBadge,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          isAdmin ? styles.adminText : styles.asstText,
        ]}
      >
        {isAdmin ? 'ADMIN' : 'ASST.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: AppColors.navy,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminBadge: {
    backgroundColor: AppColors.navy,
  },
  asstBadge: {
    backgroundColor: AppColors.background,
    borderColor: AppColors.border,
  },
  text: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.chip,
    fontWeight: AppTypography.weight.bold,
    letterSpacing: 0.5,
    lineHeight: AppTypography.lineHeight.chip,
  },
  adminText: {
    color: AppColors.white,
  },
  asstText: {
    color: AppColors.textSecondary,
    fontWeight: AppTypography.weight.semibold,
  },
});
