import { AppTypography } from '../../constants/typography';
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppColors } from '../../constants/colors';

const HEADER = {
  minHeight: 54,
  minTopInset: 32,
  topPadding: 8,
  horizontalPadding: 20,
  borderWidth: 1,
  backHitSlop: 12,
  backSize: 40,
  backIconSize: 24,
  tabTitleSize: AppTypography.size.title,
  detailTitleSize: AppTypography.size.detailTitle,
  actionLabelSize: AppTypography.size.supporting,
  textGap: 4,
  rightGap: 12,
  iconActionSize: 38,
  actionIconSize: 20,
  textActionIconSize: 18,
  actionRadius: 8,
  actionHorizontalPadding: 14,
} as const;

type HeaderIcon = React.ComponentProps<typeof Ionicons>['name'];

export interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
  variant: 'tab' | 'detail' | 'banner';
  children?: React.ReactNode;
}

export function ScreenHeader({ title, onBack, right, variant, children }: ScreenHeaderProps) {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { top, left, right: rightInset } = useSafeAreaInsets();
  // Some phone browsers report no inset even when a camera cutout is present.
  const paddingTop = Math.max(top, HEADER.minTopInset) + HEADER.topPadding;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/equipment' as any);
    }
  };

  return (
    <View
      style={[
        styles.header,
        variant === 'banner' && styles.banner,
        { paddingTop },
        variant === 'banner' && {
          paddingLeft: left + HEADER.horizontalPadding,
          paddingRight: rightInset + HEADER.horizontalPadding,
          marginLeft: -left,
          marginRight: -rightInset,
        },
      ]}
    >
      {isFocused ? <StatusBar style={variant === 'banner' ? 'light' : 'dark'} /> : null}
      <View style={styles.contentRow}>
        {variant === 'banner' ? children : variant === 'detail' ? (
          <>
            <Pressable
              onPress={handleBack}
              hitSlop={HEADER.backHitSlop}
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={HEADER.backIconSize} color={AppColors.text} />
            </Pressable>
            <Text style={styles.detailTitle} numberOfLines={1}>{title}</Text>
            {right ? <View style={styles.right}>{right}</View> : <View style={styles.rightSpacer} />}
          </>
        ) : (
          <>
            <View style={styles.titleBlock}>
              <Text style={styles.tabTitle} numberOfLines={1}>
                {title}
              </Text>
            </View>
            {right ? <View style={styles.right}>{right}</View> : null}
          </>
        )}
      </View>
    </View>
  );
}

export function ScreenHeaderIconAction({
  icon,
  label,
  onPress,
}: {
  icon: HeaderIcon;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.iconAction, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={HEADER.actionIconSize} color={AppColors.navy} />
    </Pressable>
  );
}

export function ScreenHeaderTextAction({
  icon,
  label,
  onPress,
  accessibilityLabel = label,
}: {
  icon?: HeaderIcon;
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.textAction, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {icon ? <Ionicons name={icon} size={HEADER.textActionIconSize} color={AppColors.white} /> : null}
      <Text style={styles.textActionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexShrink: 0,
    paddingHorizontal: HEADER.horizontalPadding,
    backgroundColor: AppColors.white,
    borderBottomWidth: HEADER.borderWidth,
    borderBottomColor: AppColors.headerBorder,
  },
  contentRow: {
    minHeight: HEADER.minHeight,
    flexDirection: 'row',
    alignItems: 'center',
  },
  banner: {
    marginBottom: 4,
    paddingBottom: 22,
    backgroundColor: AppColors.navy,
    borderBottomWidth: 0,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  tabTitle: {
    fontFamily: AppTypography.fontFamily,
    fontSize: HEADER.tabTitleSize,
    fontWeight: AppTypography.weight.bold,
    color: AppColors.text,
  },
  detailTitle: {
    flex: 1,
    fontFamily: AppTypography.fontFamily,
    fontSize: HEADER.detailTitleSize,
    fontWeight: AppTypography.weight.bold,
    color: AppColors.text,
    textAlign: 'center',
  },
  backButton: {
    width: HEADER.backSize,
    height: HEADER.backSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  right: {
    marginLeft: HEADER.rightGap,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSpacer: {
    width: HEADER.backSize,
  },
  iconAction: {
    width: HEADER.iconActionSize,
    height: HEADER.iconActionSize,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.headerActionBackground,
    borderWidth: HEADER.borderWidth,
    borderColor: AppColors.headerActionBorder,
    borderRadius: HEADER.actionRadius,
  },
  textAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: HEADER.textGap,
    paddingHorizontal: HEADER.actionHorizontalPadding,
    height: HEADER.iconActionSize,
    justifyContent: 'center',
    borderRadius: HEADER.actionRadius,
    backgroundColor: AppColors.navy,
  },
  textActionLabel: {
    color: AppColors.white,
    fontFamily: AppTypography.fontFamily,
    fontSize: HEADER.actionLabelSize,
    fontWeight: AppTypography.weight.semibold,
  },
  pressed: {
    opacity: 0.7,
  },
});
