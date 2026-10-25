import { AppColors } from '../../constants/colors';
import { AppTypography } from '../../constants/typography';
import React from 'react';
import { Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { tabPageStyles } from './TabPageLayout';

export type FilterOption = 'All' | 'Available' | 'Partial' | 'Out';

export type FilterChipsProps<T extends string> = {
  options: readonly { key: T; label: string }[];
  selected: T;
  onSelect: (key: T) => void;
};

export function FilterChips<T extends string>({
  selected,
  onSelect,
  options,
}: FilterChipsProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroller}
      contentContainerStyle={[tabPageStyles.filterRow, styles.container]}
    >
      {options.map((opt) => {
        const isActive = selected === opt.key;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onSelect(opt.key)}
            style={({ pressed }) => [
              styles.chip,
              isActive ? styles.chipActive : styles.chipInactive,
              pressed && styles.chipPressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            aria-pressed={isActive}
          >
            <Text
              style={[
                styles.chipText,
                isActive ? styles.chipTextActive : styles.chipTextInactive,
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroller: {
    flexGrow: 0,
    flexShrink: 0,
    minHeight: 0,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: AppColors.text,
    borderColor: AppColors.text,
  },
  chipInactive: {
    backgroundColor: AppColors.white,
    borderColor: AppColors.border,
  },
  chipPressed: {
    opacity: 0.8,
  },
  chipText: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.supporting,
  },
  chipTextActive: {
    color: AppColors.white,
    fontWeight: AppTypography.weight.semibold,
  },
  chipTextInactive: {
    color: AppColors.textSecondary,
    fontWeight: AppTypography.weight.medium,
  },
});
