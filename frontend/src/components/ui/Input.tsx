import { AppTypography } from '../../constants/typography';
import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { AppColors } from '../../constants/colors';

export interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  multiline?: boolean;
}

export function Input({
  label,
  error,
  containerStyle,
  multiline = false,
  style,
  ...rest
}: InputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputWrapper,
          multiline && styles.multilineWrapper,
          error ? styles.inputError : null,
        ]}
      >
        <TextInput
          placeholderTextColor={AppColors.textMuted}
          style={[styles.input, multiline && styles.multilineInput, style]}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          {...rest}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.body,
    fontWeight: AppTypography.weight.semibold,
    color: AppColors.text,
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: AppColors.background,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 8,
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  multilineWrapper: {
    minHeight: 110,
    paddingTop: 12,
    paddingBottom: 12,
  },
  input: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.body,
    color: AppColors.text,
    padding: 0,
  },
  multilineInput: {
    minHeight: 86,
  },
  inputError: {
    borderColor: AppColors.red,
  },
  errorText: {
    color: AppColors.red,
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.small,
    marginTop: 4,
  },
});
