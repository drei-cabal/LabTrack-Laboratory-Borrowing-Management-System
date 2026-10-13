import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppColors } from '../../constants/colors';

export interface ScreenHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function ScreenHeader({
  title,
  showBack = false,
  onBack,
  rightAction,
}: ScreenHeaderProps) {
  const router = useRouter();

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
    <View style={styles.header}>
      <View style={styles.leftContainer}>
        {showBack ? (
          <Pressable
            onPress={handleBack}
            hitSlop={12}
            style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={24} color={AppColors.text} />
          </Pressable>
        ) : null}
        <Text style={[styles.title, showBack ? styles.titleWithBack : null]} numberOfLines={1}>
          {title}
        </Text>
      </View>

      {rightAction ? <View style={styles.rightContainer}>{rightAction}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backBtn: {
    marginRight: 10,
    padding: 2,
    borderRadius: 6,
  },
  backBtnPressed: {
    opacity: 0.6,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.text,
  },
  titleWithBack: {
    fontSize: 18,
    fontWeight: '700',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
