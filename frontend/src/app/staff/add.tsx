import { screenStyles } from '../../components/ui/ScreenStyles';
import { AppTypography } from '../../constants/typography';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { AppColors } from '../../constants/colors';
import { staffService } from '../../services/staffService';
import { useGuardedPress } from '../../utils/guards';
import { StaffRole, StaffEntity } from '../../types';
import { ROUTES } from '../../routing/routes';

export default function AddStaffScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<StaffRole>('assistant');

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Success modal state
  const [createdStaff, setCreatedStaff] = useState<StaffEntity | null>(null);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      errs.fullName = 'Full name is required (minimum 2 characters).';
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address.';
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
    setGlobalError(null);
    if (!validate()) return;

    setSubmitting(true);
    setErrors({});

    try {
      const cleanUser = username.replace(/^@/, '').trim().toLowerCase();
      const res = await staffService.create({
        full_name: fullName.trim(),
        username: cleanUser,
        email: email.trim() ? email.trim().toLowerCase() : undefined,
        password,
        role,
      });

      if (res.success && res.data) {
        setCreatedStaff(res.data);
      } else {
        const errorMsg = res.error || 'Failed to create staff account.';
        setGlobalError(errorMsg);
        if (errorMsg.toLowerCase().includes('username')) {
          setErrors({ username: errorMsg });
        } else if (errorMsg.toLowerCase().includes('email')) {
          setErrors({ email: errorMsg });
        }
      }
    } catch (err: any) {
      setGlobalError(err?.message || 'Network error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  });

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(ROUTES.STAFF as any);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      {/* Header */}
      <ScreenHeader variant="detail" title="Add Staff Member" onBack={handleBack} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {globalError && (
            <View style={styles.globalErrorBox}>
              <Ionicons name="alert-circle" size={18} color="#DC2626" />
              <Text style={styles.globalErrorText}>{globalError}</Text>
            </View>
          )}

          {/* Full Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Full Name *</Text>
            <View style={[styles.inputWrapper, errors.fullName ? styles.inputError : null]}>
              <Ionicons name="person-outline" size={18} color="#64748B" style={styles.inputIcon} />
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

          {/* Email Address */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email Address</Text>
            <View style={[styles.inputWrapper, errors.email ? styles.inputError : null]}>
              <Ionicons name="mail-outline" size={18} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. k.delacruz@university.edu"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
          </View>

          {/* Username */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Username *</Text>
            <View style={[styles.inputWrapper, errors.username ? styles.inputError : null]}>
              <Ionicons name="at-outline" size={18} color="#64748B" style={styles.inputIcon} />
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
            <Text style={styles.fieldLabel}>Initial Password *</Text>
            <View style={[styles.inputWrapper, errors.password ? styles.inputError : null]}>
              <Ionicons name="lock-closed-outline" size={18} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Minimum 6 characters"
                placeholderTextColor="#94A3B8"
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
                style={styles.eyeBtnSquare}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color="#64748B"
                />
              </Pressable>
            </View>
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
          </View>

          {/* Role Segmented Selector (Square) */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Role Assignment</Text>
            <View style={styles.segmentedContainer}>
              <Pressable
                onPress={() => setRole('admin')}
                style={[
                  styles.segmentButton,
                  role === 'admin' ? styles.segmentButtonActive : styles.segmentButtonInactive,
                ]}
                accessibilityRole="button"
              >
                <Ionicons
                  name="shield-checkmark"
                  size={16}
                  color={role === 'admin' ? '#FFFFFF' : '#64748B'}
                />
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
                <Ionicons
                  name="people"
                  size={16}
                  color={role === 'assistant' ? '#FFFFFF' : '#64748B'}
                />
                <Text
                  style={[
                    styles.segmentText,
                    role === 'assistant' ? styles.segmentTextActive : styles.segmentTextInactive,
                  ]}
                >
                  Staff Assistant
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Submit Button (Square) */}
          <View style={styles.actionContainer}>
            <Pressable
              onPress={handleCreateAccount}
              disabled={submitting}
              style={({ pressed }) => [
                styles.submitBtnSquare,
                pressed && styles.btnPressed,
                submitting && styles.btnDisabled,
              ]}
              accessibilityRole="button"
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="person-add-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>Create Staff Account</Text>
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ─── SUCCESS MODAL (CROSS-PLATFORM) ─────────────────────────────────── */}
      <Modal
        visible={createdStaff !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.successIconWrap}>
              <Ionicons name="checkmark-circle" size={54} color="#16A34A" />
            </View>
            <Text style={styles.modalSuccessTitle}>Staff Account Created!</Text>
            <Text style={styles.modalSuccessSub}>
              The staff member has been registered and can now authenticate and manage equipment loans.
            </Text>

            {createdStaff && (
              <View style={styles.receiptBox}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Full Name</Text>
                  <Text style={styles.receiptValBold}>{createdStaff.full_name}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Username</Text>
                  <Text style={styles.receiptVal}>@{createdStaff.username}</Text>
                </View>
                {createdStaff.email ? (
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Email</Text>
                    <Text style={styles.receiptVal}>{createdStaff.email}</Text>
                  </View>
                ) : null}
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Role</Text>
                  <Text style={[styles.receiptValBold, { textTransform: 'uppercase', color: AppColors.navy }]}>
                    {createdStaff.role}
                  </Text>
                </View>
              </View>
            )}

            <Pressable
              style={styles.successDoneBtn}
              onPress={() => {
                setCreatedStaff(null);
                router.replace(ROUTES.STAFF as any);
              }}
            >
              <Text style={styles.successDoneText}>Back to Staff List</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...screenStyles.screen,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  globalErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
  },
  globalErrorText: {
    fontSize: 13,
    color: '#DC2626',
    flex: 1,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  inputWrapper: {
    height: 46,
    borderRadius: 8,
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    height: '100%',
  },
  passwordInput: {
    paddingRight: 8,
  },
  eyeBtnSquare: {
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
    backgroundColor: '#F1F5F9',
    borderRadius: 4, // Square design
    padding: 4,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4, // Square design
  },
  segmentButtonActive: {
    backgroundColor: '#0F172A',
  },
  segmentButtonInactive: {
    backgroundColor: 'transparent',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: AppColors.white,
  },
  segmentTextInactive: {
    color: AppColors.textSecondary,
  },
  actionContainer: {
    marginTop: 20,
  },
  submitBtnSquare: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
    borderRadius: 4, // Square design
    height: 48,
    width: '100%',
  },
  btnPressed: {
    opacity: 0.85,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // ─── Success Modal Styles ──────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 4, // Square design
    padding: 24,
    alignItems: 'center',
  },
  successIconWrap: {
    marginBottom: 10,
  },
  modalSuccessTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#16A34A',
    marginBottom: 6,
  },
  modalSuccessSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  receiptBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 4, // Square design
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 8,
    marginBottom: 20,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  receiptVal: {
    fontSize: 13,
    color: '#0F172A',
  },
  receiptValBold: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  successDoneBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 4, // Square design
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successDoneText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
