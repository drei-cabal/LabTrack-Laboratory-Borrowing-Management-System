import { AppTypography } from '../../constants/typography';
import React from 'react';
import {
  View,
  Text,
  TextInput,
  Platform,
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
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const [focused, setFocused] = React.useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputWrapper,
          multiline && styles.multilineWrapper,
          focused && styles.inputFocused,
          error ? styles.inputError : null,
        ]}
      >
        <TextInput
          placeholderTextColor={AppColors.textMuted}
          style={[styles.input, multiline && styles.multilineInput, style]}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          accessibilityLabel={label}
          {...rest}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
        />
      </View>
      {error ? <Text style={styles.errorText} accessibilityLiveRegion="polite">{error}</Text> : null}
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
    backgroundColor: AppColors.white,
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
    ...Platform.select({ web: { outlineWidth: 0 } }),
  },
  multilineInput: {
    minHeight: 86,
  },
  inputFocused: {
    borderColor: AppColors.navy,
    backgroundColor: AppColors.white,
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
