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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminBadge: {
    backgroundColor: AppColors.navy,
  },
  asstBadge: {
    backgroundColor: '#F4F5F7',
    borderWidth: 1,
    borderColor: '#E0E2E7',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  adminText: {
    color: AppColors.white,
  },
  asstText: {
    color: '#6B7280',
  },
});
