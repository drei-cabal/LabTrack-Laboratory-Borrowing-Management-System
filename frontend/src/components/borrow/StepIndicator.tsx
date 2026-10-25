import { AppTypography } from '../../constants/typography';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppColors } from '../../constants/colors';

interface StepIndicatorProps {
  currentStep: number; // 1, 2, 3, 4
  totalSteps?: number; // 4
  title: string;
}

export function StepIndicator({
  currentStep,
  totalSteps = 4,
  title,
}: StepIndicatorProps) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.barsRow}>
        <View style={styles.barsContainer}>
          {steps.map((step) => {
            const isActive = step === currentStep;
            return (
              <View
                key={step}
                style={[
                  styles.bar,
                  isActive ? styles.barActive : step < currentStep ? styles.barCompleted : styles.barInactive,
                ]}
              />
            );
          })}
        </View>
        <Text style={styles.stepText}>
          {currentStep}/{totalSteps}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.background,
    backgroundColor: AppColors.white,
  },
  title: {
    flexShrink: 1,
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.section,
    fontWeight: AppTypography.weight.bold,
    color: AppColors.text,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bar: {
    width: 16,
    height: 6,
    borderRadius: 3,
  },
  barActive: {
    width: 32,
    backgroundColor: AppColors.navy,
  },
  barInactive: {
    backgroundColor: AppColors.border,
  },
  barCompleted: {
    backgroundColor: AppColors.textMuted,
  },
  stepText: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.small,
    fontWeight: AppTypography.weight.regular,
    color: AppColors.textSecondary,
    minWidth: 24,
    textAlign: 'right',
  },
});
