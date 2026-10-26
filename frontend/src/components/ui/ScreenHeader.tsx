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
  actionRadius: 12,
  actionHorizontalPadding: 14,
} as const;

type HeaderIcon = React.ComponentProps<typeof Ionicons>['name'];

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  icon?: HeaderIcon;
  tone?: 'light' | 'navy';
  onBack?: () => void;
  right?: React.ReactNode;
  variant: 'tab' | 'detail' | 'banner';
  children?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, icon, tone = 'light', onBack, right, variant, children }: ScreenHeaderProps) {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { top, left, right: rightInset } = useSafeAreaInsets();
  // Some phone browsers report no inset even when a camera cutout is present.
  const paddingTop = Math.max(top, HEADER.minTopInset) + HEADER.topPadding;
  const isNavy = tone === 'navy' || variant === 'banner';

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
        isNavy && styles.navyHeader,
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
      {isFocused ? <StatusBar style={isNavy ? 'light' : 'dark'} /> : null}
      <View pointerEvents="none" style={styles.decoration} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={[styles.outerRing, isNavy && styles.navyRing]} />
        <View style={[styles.innerRing, isNavy && styles.navyRing]} />
      </View>
      <View style={styles.contentRow}>
        {variant === 'banner' ? children : variant === 'detail' ? (
          <>
            <Pressable
              onPress={handleBack}
              hitSlop={HEADER.backHitSlop}
              style={({ pressed }) => [styles.backButton, isNavy && styles.navyIconTile, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={HEADER.backIconSize} color={isNavy ? AppColors.white : AppColors.text} />
            </Pressable>
            <Text style={[styles.detailTitle, isNavy && styles.navyTitle]} numberOfLines={1}>{title}</Text>
            {right ? <View style={styles.right}>{right}</View> : <View style={styles.rightSpacer} />}
          </>
        ) : (
          <>
            {icon ? (
              <View style={[styles.iconTile, isNavy && styles.navyIconTile]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <Ionicons name={icon} size={22} color={isNavy ? AppColors.white : AppColors.navy} />
              </View>
            ) : null}
            <View style={styles.titleBlock}>
              <Text style={[styles.tabTitle, isNavy && styles.navyTitle]} numberOfLines={1}>
                {title}
              </Text>
              {subtitle ? <Text style={[styles.subtitle, isNavy && styles.navySubtitle]} numberOfLines={1}>{subtitle}</Text> : null}
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
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    paddingBottom: 10,
  },
  decoration: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  outerRing: {
    position: 'absolute',
    width: 144,
    height: 144,
    borderRadius: 72,
    borderWidth: 1,
    borderColor: AppColors.borrowedBg,
    right: -32,
    top: -40,
  },
  innerRing: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 1,
    borderColor: AppColors.borrowedBg,
    right: -12,
    top: -20,
  },
  navyRing: {
    borderColor: 'rgba(255,255,255,0.08)',
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: AppColors.borrowedBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  navyIconTile: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  contentRow: {
    minHeight: HEADER.minHeight,
    flexDirection: 'row',
    alignItems: 'center',
  },
  navyHeader: {
    backgroundColor: AppColors.navy,
    borderBottomColor: AppColors.navy,
  },
  navyTitle: {
    color: AppColors.white,
  },
  navySubtitle: {
    color: AppColors.headerBannerLabel,
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
    color: AppColors.navy,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.small,
    color: AppColors.textSecondary,
    marginTop: 2,
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.headerActionBorder,
    backgroundColor: AppColors.headerActionBackground,
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
