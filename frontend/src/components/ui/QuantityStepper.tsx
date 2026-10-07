import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AppColors } from '../../constants/colors';

export interface QuantityStepperProps {
  label?: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
}

export function QuantityStepper({
  label = 'Total Quantity',
  value,
  onChange,
  min = 1,
  max = 999,
}: QuantityStepperProps) {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.stepperRow}>
        <Pressable
          onPress={handleDecrement}
          disabled={value <= min}
          style={({ pressed }) => [
            styles.stepBtn,
            styles.stepBtnMinus,
            value <= min && styles.stepBtnDisabled,
            pressed && styles.stepBtnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Decrease quantity"
        >
          <Text style={[styles.stepBtnMinusText, value <= min && styles.stepBtnTextDisabled]}>
            -
          </Text>
        </Pressable>

        <View style={styles.valueContainer}>
          <Text style={styles.valueText}>{value}</Text>
        </View>

        <Pressable
          onPress={handleIncrement}
          disabled={value >= max}
          style={({ pressed }) => [
            styles.stepBtn,
            styles.stepBtnPlus,
            value >= max && styles.stepBtnDisabled,
            pressed && styles.stepBtnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Increase quantity"
        >
          <Text style={styles.stepBtnPlusText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 28,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.text,
    marginBottom: 10,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnMinus: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepBtnPlus: {
    backgroundColor: AppColors.navy,
  },
  stepBtnPressed: {
    opacity: 0.75,
  },
  stepBtnDisabled: {
    opacity: 0.4,
  },
  stepBtnMinusText: {
    fontSize: 20,
    fontWeight: '600',
    color: AppColors.text,
    lineHeight: 22,
  },
  stepBtnPlusText: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.white,
    lineHeight: 20,
  },
  stepBtnTextDisabled: {
    color: AppColors.textMuted,
  },
  valueContainer: {
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    fontSize: 17,
    fontWeight: '600',
    color: AppColors.text,
  },
});
