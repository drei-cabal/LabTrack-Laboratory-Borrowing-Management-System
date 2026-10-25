import { AppTypography } from '../../constants/typography';
import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { AppColors } from '../../constants/colors';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger-outline' | 'danger' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  fullWidth = true,
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  accessibilityLabel = title,
}: ButtonProps) {
  const getContainerStyle = (pressed: boolean): StyleProp<ViewStyle> => {
    const list: StyleProp<ViewStyle> = [styles.base];

    if (fullWidth) list.push(styles.fullWidth);
    if (size === 'sm') list.push(styles.sizeSm);
    if (size === 'lg') list.push(styles.sizeLg);

    switch (variant) {
      case 'primary':
        list.push(styles.primary);
        if (pressed) list.push(styles.pressedPrimary);
        break;
      case 'secondary':
      case 'outline':
        list.push(styles.secondary);
        if (pressed) list.push(styles.pressedSecondary);
        break;
      case 'danger':
      case 'destructive':
      case 'danger-outline':
        list.push(styles.dangerOutline);
        if (pressed) list.push(styles.pressedDangerOutline);
        break;
    }


    if (disabled) list.push(styles.disabled);
    if (style) list.push(style);

    return list;
  };

  const getTextStyle = (): StyleProp<TextStyle> => {
    const list: StyleProp<TextStyle> = [styles.baseText];

    if (size === 'sm') list.push(styles.textSm);
    if (size === 'lg') list.push(styles.textLg);

    switch (variant) {
      case 'primary':
        list.push(styles.primaryText);
        break;
      case 'secondary':
      case 'outline':
        list.push(styles.secondaryText);
        break;
      case 'danger':
      case 'destructive':
      case 'danger-outline':
        list.push(styles.dangerOutlineText);
        break;
    }



    if (disabled) list.push(styles.disabledText);
    if (textStyle) list.push(textStyle);

    return list;
  };

  const isLockedRef = React.useRef(false);

  const handlePress = () => {
    if (disabled || loading || isLockedRef.current) return;
    isLockedRef.current = true;
    try {
      onPress();
    } finally {
      setTimeout(() => {
        isLockedRef.current = false;
      }, 500);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => getContainerStyle(pressed)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? AppColors.white : ['danger', 'danger-outline', 'destructive'].includes(variant) ? AppColors.red : AppColors.navy}
        />
      ) : (
        <>
          {icon}
          <Text style={getTextStyle()}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 46,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 8,
  },
  fullWidth: {
    width: '100%',
  },
  sizeSm: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  sizeLg: {
    height: 52,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  primary: {
    backgroundColor: AppColors.navy,
  },
  pressedPrimary: {
    opacity: 0.85,
  },
  secondary: {
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.navy,
  },
  pressedSecondary: {
    backgroundColor: AppColors.background,
  },
  dangerOutline: {
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.red,
  },
  pressedDangerOutline: {
    backgroundColor: AppColors.overdueBg,
  },

  disabled: {
    opacity: 0.5,
  },
  baseText: {
    lineHeight: AppTypography.lineHeight.button,
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.button,
    fontWeight: AppTypography.weight.semibold,
  },
  textSm: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.small,
  },
  textLg: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.section,
  },
  primaryText: {
    color: AppColors.white,
  },
  secondaryText: {
    color: AppColors.navy,
  },
  dangerOutlineText: {
    color: AppColors.red,
  },
  disabledText: {
    color: AppColors.textMuted,
  },

});
