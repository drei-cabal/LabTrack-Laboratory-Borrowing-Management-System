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
            const isActive = step <= currentStep;
            return (
              <View
                key={step}
                style={[
                  styles.bar,
                  isActive ? styles.barActive : styles.barInactive,
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
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.text,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bar: {
    width: 18,
    height: 4,
    borderRadius: 2,
  },
  barActive: {
    backgroundColor: AppColors.navy,
  },
  barInactive: {
    backgroundColor: '#E2E8F0',
  },
  stepText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textMuted,
    minWidth: 24,
    textAlign: 'right',
  },
});
