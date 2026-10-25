import { AppTypography } from '../../constants/typography';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Button } from '../../components/ui/Button';
import { AppColors } from '../../constants/colors';
import { staffService } from '../../services/staffService';
import { useGuardedPress } from '../../utils/guards';
import { StaffRole } from '../../types';

export default function AddStaffScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<StaffRole>('assistant');

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      errs.fullName = 'Full name is required (minimum 2 characters).';
    }

    const cleanUser = username.replace(/^@/, '').trim();
    if (!cleanUser || cleanUser.length < 3) {
      errs.username = 'Username is required (minimum 3 characters).';
    }

    if (!password || password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateAccount = useGuardedPress(async () => {
    if (!validate()) return;

    setSubmitting(true);
    setErrors({});

    try {
      const cleanUser = username.replace(/^@/, '').trim().toLowerCase();
      const res = await staffService.create({
        full_name: fullName.trim(),
        username: cleanUser,
        password,
        role,
      });

      if (res.success) {
        Alert.alert('Success', 'Staff account created successfully.', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      } else {
        const errorMsg = res.error || 'Failed to create staff account.';
        Alert.alert('Error', errorMsg);
        if (errorMsg.toLowerCase().includes('username')) {
          setErrors({ username: errorMsg });
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Network error occurred.');
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScreenHeader title="Add Staff" variant="detail" />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Full Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <View style={[styles.inputWrapper, errors.fullName ? styles.inputError : null]}>
              <TextInput
                style={styles.input}
                placeholder="e.g. Karen Dela Cruz"
                placeholderTextColor={AppColors.textMuted}
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
                }}
                autoCapitalize="words"
              />
            </View>
            {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
          </View>

          {/* Username */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Username</Text>
            <View style={[styles.inputWrapper, errors.username ? styles.inputError : null]}>
              <TextInput
                style={styles.input}
                placeholder="e.g. k.delacruz"
                placeholderTextColor={AppColors.textMuted}
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  if (errors.username) setErrors((prev) => ({ ...prev, username: '' }));
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={[styles.inputWrapper, errors.password ? styles.inputError : null]}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Set initial password"
                placeholderTextColor={AppColors.textMuted}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={12}
                style={styles.eyeBtn}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={AppColors.textSecondary}
                />
              </Pressable>
            </View>
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
          </View>

          {/* Role Segmented Selector */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Role</Text>
            <View style={styles.segmentedContainer}>
              <Pressable
                onPress={() => setRole('admin')}
                style={[
                  styles.segmentButton,
                  role === 'admin' ? styles.segmentButtonActive : styles.segmentButtonInactive,
                ]}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.segmentText,
                    role === 'admin' ? styles.segmentTextActive : styles.segmentTextInactive,
                  ]}
                >
                  Admin
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setRole('assistant')}
                style={[
                  styles.segmentButton,
                  role === 'assistant' ? styles.segmentButtonActive : styles.segmentButtonInactive,
                ]}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.segmentText,
                    role === 'assistant' ? styles.segmentTextActive : styles.segmentTextInactive,
                  ]}
                >
                  Student Asst.
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Submit Button */}
          <View style={styles.actionContainer}>
            <Button
              title="Create Account"
              onPress={handleCreateAccount}
              loading={submitting}
              fullWidth
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.body,
    fontWeight: AppTypography.weight.bold,
    color: AppColors.navy,
    marginBottom: 8,
  },
  inputWrapper: {
    height: 48,
    borderRadius: 8,
    backgroundColor: AppColors.background,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.bodyStrong,
    color: AppColors.navy,
    height: '100%',
  },
  passwordInput: {
    paddingRight: 10,
  },
  eyeBtn: {
    padding: 4,
  },
  inputError: {
    borderColor: AppColors.red,
    backgroundColor: AppColors.overdueBg,
  },
  errorText: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.small,
    color: AppColors.red,
    marginTop: 4,
    fontWeight: AppTypography.weight.medium,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: AppColors.background,
    borderRadius: 8,
    padding: 4,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  segmentButtonActive: {
    backgroundColor: AppColors.navy,
  },
  segmentButtonInactive: {
    backgroundColor: 'transparent',
  },
  segmentText: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.body,
    fontWeight: AppTypography.weight.semibold,
  },
  segmentTextActive: {
    color: AppColors.white,
  },
  segmentTextInactive: {
    color: AppColors.textSecondary,
  },
  actionContainer: {
    marginTop: 16,
  },
});
