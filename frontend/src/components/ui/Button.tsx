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
        list.push(styles.secondary);
        if (pressed) list.push(styles.pressedSecondary);
        break;
      case 'outline':
        list.push(styles.outline);
        if (pressed) list.push(styles.pressedOutline);
        break;
      case 'danger':
        list.push(styles.danger);
        if (pressed) list.push(styles.pressedDanger);
        break;
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
        list.push(styles.secondaryText);
        break;
      case 'outline':
        list.push(styles.outlineText);
        break;
      case 'danger':
        list.push(styles.dangerText);
        break;
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
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? AppColors.white : AppColors.navy}
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
    height: 48,
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
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  sizeLg: {
    height: 52,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  primary: {
    backgroundColor: AppColors.navy,
  },
  pressedPrimary: {
    opacity: 0.85,
  },
  secondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.25,
    borderColor: AppColors.navy,
  },
  pressedSecondary: {
    backgroundColor: '#F4F5F7',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.25,
    borderColor: AppColors.navy,
  },
  pressedOutline: {
    backgroundColor: '#F4F5F7',
  },
  danger: {
    backgroundColor: '#DC2626',
  },
  pressedDanger: {
    opacity: 0.85,
  },
  dangerOutline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.25,
    borderColor: '#DC2626',
  },
  pressedDangerOutline: {
    backgroundColor: '#FEF2F2',
  },

  disabled: {
    opacity: 0.5,
  },
  baseText: {
    fontSize: 15,
    fontWeight: '600',
  },
  textSm: {
    fontSize: 13,
  },
  textLg: {
    fontSize: 16,
  },
  primaryText: {
    color: AppColors.white,
  },
  secondaryText: {
    color: AppColors.navy,
  },
  outlineText: {
    color: AppColors.navy,
  },
  dangerText: {
    color: AppColors.white,
  },
  dangerOutlineText: {
    color: '#DC2626',
  },
  disabledText: {
    color: AppColors.textMuted,
  },

});
