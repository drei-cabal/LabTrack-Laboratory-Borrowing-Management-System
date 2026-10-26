import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../constants/colors';
import { AppTypography } from '../../constants/typography';
import './SearchBar.css';

interface SearchBarProps extends TextInputProps {
  containerStyle?: StyleProp<ViewStyle>;
}

export const SearchBar = forwardRef<TextInput, SearchBarProps>(function SearchBar(
  { containerStyle, style, value = '', onChangeText, onFocus, onBlur, ...props },
  ref,
) {
  const inputRef = useRef<TextInput>(null);
  const [isHighlighted, setIsHighlighted] = useState(false);
  useImperativeHandle(ref, () => inputRef.current!);

  const changeText = (text: string) => {
    setIsHighlighted(false);
    onChangeText?.(text);
  };

  return (
    <Pressable
      accessible={false}
      focusable={false}
      style={[styles.container, containerStyle, isHighlighted && styles.highlighted]}
      onPress={() => {
        inputRef.current?.focus();
        setIsHighlighted(true);
      }}
    >
      <Ionicons name="search-outline" size={18} color={AppColors.textMuted} />
      <TextInput
        ref={inputRef}
        placeholderTextColor={AppColors.textMuted}
        autoCapitalize="none"
        returnKeyType="search"
        {...props}
        testID="labtrack-search-input"
        value={value}
        style={[styles.input, style, styles.noInnerBorder]}
        underlineColorAndroid="transparent"
        clearButtonMode="never"
        onFocus={(event) => {
          setIsHighlighted(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setIsHighlighted(false);
          onBlur?.(event);
        }}
        onChangeText={changeText}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={8}
          onPress={(event) => {
            event.stopPropagation();
            changeText('');
          }}
        >
          <Ionicons name="close-circle" size={18} color={AppColors.textMuted} />
        </Pressable>
      ) : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.white,
  },
  highlighted: {
    borderColor: AppColors.navy,
  },
  input: {
    flex: 1,
    minWidth: 0,
    padding: 0,
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.body,
    color: AppColors.text,
  },
  noInnerBorder: {
    borderWidth: 0,
    ...Platform.select({ web: { outlineWidth: 0 } }),
  },
});
