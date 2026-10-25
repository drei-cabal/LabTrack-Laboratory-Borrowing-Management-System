import { AppTypography } from '../../constants/typography';
import React from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../constants/colors';
import { Button } from './Button';

export interface EmptyStateProps {
  title?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  message?: string;
  actionText?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  title,
  icon = 'cube-outline',
  message = 'No equipment added yet. Start by adding your first item to the inventory.',
  actionText = 'Add Equipment',
  onAction,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={18} color={AppColors.textSecondary} />
      </View>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Text style={[styles.message, onAction && styles.messageWithAction]}>{message}</Text>
      {onAction ? (
        <Button
          title={actionText}
          variant="secondary"
          fullWidth={false}
          size="sm"
          onPress={onAction}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 50,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  message: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.supporting,
    lineHeight: AppTypography.lineHeight.supporting,
    color: AppColors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  title: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.supporting,
    fontWeight: AppTypography.weight.semibold,
    lineHeight: AppTypography.lineHeight.supporting,
    color: AppColors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  messageWithAction: {
    marginBottom: 16,
  },
});
