import { screenStyles } from '../../components/ui/ScreenStyles';
import { AppTypography } from '../../constants/typography';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { AppColors } from '../../constants/colors';
import { staffService } from '../../services/staffService';
import { useGuardedPress } from '../../utils/guards';
import { StaffEntity, StaffRole } from '../../types';
import { ROUTES } from '../../routing/routes';

export default function EditStaffScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [staff, setStaff] = useState<StaffEntity | null>(null);
  const [loadingStaff, setLoadingStaff] = useState(true);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<StaffRole>('assistant');
  const [isActive, setIsActive] = useState(true);

  // Status & modal states
  const [saving, setSaving] = useState(false);
  const [statusToggling, setStatusToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [deactivateModalVisible, setDeactivateModalVisible] = useState(false);
  const [reactivateModalVisible, setReactivateModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  // Inline Feedback & Alerts
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // Success Notification Modal
  const [successInfo, setSuccessInfo] = useState<{
    visible: boolean;
    title: string;
    message: string;
    redirectOnClose: boolean;
  }>({
    visible: false,
    title: '',
    message: '',
    redirectOnClose: true,
  });

  const getInitials = (name: string): string => {
    if (!name) return 'ST';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    async function loadStaff() {
      setLoadingStaff(true);
      setGlobalError(null);
      try {
        const res = await staffService.getById(id as string);
        if (isMounted && res.success && res.data) {
          const s = res.data;
          setStaff(s);
          setFullName(s.full_name);
          setEmail(s.email || '');
          setUsername(s.username);
          setRole(s.role);
          setIsActive(s.is_active);
        } else if (isMounted) {
          setGlobalError(res.error || 'Failed to load staff details.');
        }
      } catch (err: any) {
        if (isMounted) {
          setGlobalError(err?.message || 'Network error loading staff details.');
        }
      } finally {
        if (isMounted) setLoadingStaff(false);
      }
    }

    loadStaff();
    return () => {
      isMounted = false;
    };
  }, [id]);

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

    if (password.length > 0 && password.length < 6) {
      errs.password = 'New password must be at least 6 characters.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveChanges = useGuardedPress(async () => {
    if (!id || !validate()) return;

    setSaving(true);
    setErrors({});
    setGlobalError(null);

    try {
      const cleanUser = username.replace(/^@/, '').trim().toLowerCase();
      const payload: any = {
        full_name: fullName.trim(),
        username: cleanUser,
        email: email.trim().toLowerCase() || undefined,
        role,
      };

      if (password.trim().length > 0) {
        payload.password = password.trim();
      }

      const res = await staffService.update(id as string, payload);
      if (res.success && res.data) {
        setStaff(res.data);
        setPassword('');
        setSuccessInfo({
          visible: true,
          title: 'Changes Saved',
          message: `${fullName}'s profile information has been successfully updated.`,
          redirectOnClose: true,
        });
      } else {
        const errorMsg = res.error || 'Failed to update staff member.';
        setGlobalError(errorMsg);
        if (errorMsg.toLowerCase().includes('username')) {
          setErrors({ username: errorMsg });
        } else if (errorMsg.toLowerCase().includes('email')) {
          setErrors({ email: errorMsg });
        }
      }
    } catch (err: any) {
      setGlobalError(err?.message || 'Network error updating staff member.');
    } finally {
      setSaving(false);
    }
  });

  const handleConfirmDeactivate = useGuardedPress(async () => {
    if (!id) return;
    setStatusToggling(true);
    setModalError(null);
    try {
      const res = await staffService.toggleStatus(id as string, false);
      if (res.success && res.data) {
        setIsActive(false);
        setStaff(res.data);
        setDeactivateModalVisible(false);
        setSuccessInfo({
          visible: true,
          title: 'Account Deactivated',
          message: `${fullName} is now deactivated and will not be able to log in.`,
          redirectOnClose: true,
        });
      } else {
        setModalError(res.error || 'Failed to deactivate account.');
      }
    } catch (err: any) {
      setModalError(err?.message || 'Network error deactivating account.');
    } finally {
      setStatusToggling(false);
    }
  });

  const handleConfirmReactivate = useGuardedPress(async () => {
    if (!id) return;
    setStatusToggling(true);
    setModalError(null);
    try {
      const res = await staffService.toggleStatus(id as string, true);
      if (res.success && res.data) {
        setIsActive(true);
        setStaff(res.data);
        setReactivateModalVisible(false);
        setSuccessInfo({
          visible: true,
          title: 'Account Reactivated',
          message: `${fullName} is now active and has access to the system.`,
          redirectOnClose: true,
        });
      } else {
        setModalError(res.error || 'Failed to reactivate account.');
      }
    } catch (err: any) {
      setModalError(err?.message || 'Network error reactivating account.');
    } finally {
      setStatusToggling(false);
    }
  });

  const handleConfirmDelete = useGuardedPress(async () => {
    if (!id) return;
    setDeleting(true);
    setModalError(null);
    try {
      const res = await staffService.delete(id as string);
      if (res.success) {
        setDeleteModalVisible(false);
        setSuccessInfo({
          visible: true,
          title: 'Account Deleted',
          message: `${fullName} has been permanently deleted from the system.`,
          redirectOnClose: true,
        });
      } else {
        setModalError(res.error || 'Failed to delete account.');
      }
    } catch (err: any) {
      setModalError(err?.message || 'Network error deleting account.');
    } finally {
      setDeleting(false);
    }
  });

  const handleBack = () => {
    router.replace(ROUTES.STAFF);
  };

  const handleSuccessClose = () => {
    setSuccessInfo((prev) => ({ ...prev, visible: false }));
    if (successInfo.redirectOnClose) {
      router.replace(ROUTES.STAFF);
    }
  };

  if (loadingStaff) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <ScreenHeader variant="detail" title="Edit Staff" onBack={handleBack} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.navy} />
          <Text style={styles.loadingText}>Loading staff details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      {/* Header */}
      <ScreenHeader variant="detail" title="Edit Staff" onBack={handleBack} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Global Error Banner */}
          {globalError ? (
            <View style={styles.globalErrorBox}>
              <Ionicons name="alert-circle" size={18} color="#DC2626" />
              <Text style={styles.globalErrorText}>{globalError}</Text>
            </View>
          ) : null}

          {/* ─── Staff Summary Header Card ─── */}
          <View style={styles.profileCard}>
            <View style={styles.avatarSquare}>
              <Text style={styles.avatarInitials}>{getInitials(fullName || staff?.full_name || '')}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={1}>
                {fullName || staff?.full_name || 'Staff Member'}
              </Text>
              <Text style={styles.profileUsername} numberOfLines={1}>
                @{username ? username.replace(/^@/, '') : staff?.username}
              </Text>
              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.roleBadgeSquare,
                    role === 'admin' ? styles.roleBadgeAdmin : styles.roleBadgeAssistant,
                  ]}
                >
                  <Text
                    style={[
                      styles.roleBadgeText,
                      role === 'admin' ? styles.roleTextAdmin : styles.roleTextAssistant,
                    ]}
                  >
                    {role === 'admin' ? 'ADMIN' : 'STUDENT ASST.'}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusBadgeSquare,
                    isActive ? styles.statusBadgeActive : styles.statusBadgeInactive,
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: isActive ? '#16A34A' : '#94A3B8' },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusBadgeText,
                      { color: isActive ? '#15803D' : '#64748B' },
                    ]}
                  >
                    {isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* ─── Form Fields ─── */}

          {/* Full Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Full Name *</Text>
            <View style={[styles.inputWrapper, errors.fullName ? styles.inputError : null]}>
              <Ionicons name="person-outline" size={18} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
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
                placeholder="e.g. name@university.edu"
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
                placeholder="Username"
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

          {/* Reset Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Reset Password</Text>
            <View style={[styles.inputWrapper, errors.password ? styles.inputError : null]}>
              <Ionicons name="lock-closed-outline" size={18} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Leave blank to keep current password"
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
                  name="school"
                  size={16}
                  color={role === 'assistant' ? '#FFFFFF' : '#64748B'}
                />
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

          {/* ─── Actions Stack (Square buttons, height 48, perfectly aligned) ─── */}
          <View style={styles.actionsStack}>
            {/* Primary: Save Changes */}
            <Pressable
              onPress={handleSaveChanges}
              disabled={saving}
              style={({ pressed }) => [
                styles.buttonSquare,
                styles.btnPrimary,
                pressed && styles.btnPressed,
                saving && styles.btnDisabled,
              ]}
              accessibilityRole="button"
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.btnPrimaryText}>Save Changes</Text>
                </>
              )}
            </Pressable>

            {/* Secondary: Deactivate or Reactivate Account */}
            {isActive ? (
              <Pressable
                onPress={() => {
                  setModalError(null);
                  setDeactivateModalVisible(true);
                }}
                disabled={saving || statusToggling || deleting}
                style={({ pressed }) => [
                  styles.buttonSquare,
                  styles.btnDangerOutline,
                  pressed && styles.btnDangerOutlinePressed,
                ]}
                accessibilityRole="button"
              >
                <Ionicons name="ban-outline" size={18} color="#DC2626" />
                <Text style={styles.btnDangerOutlineText}>Deactivate Account</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => {
                  setModalError(null);
                  setReactivateModalVisible(true);
                }}
                disabled={saving || statusToggling || deleting}
                style={({ pressed }) => [
                  styles.buttonSquare,
                  styles.btnSuccessOutline,
                  pressed && styles.btnSuccessOutlinePressed,
                ]}
                accessibilityRole="button"
              >
                <Ionicons name="refresh-outline" size={18} color="#16A34A" />
                <Text style={styles.btnSuccessOutlineText}>Reactivate Account</Text>
              </Pressable>
            )}

            {/* Danger: Delete Account */}
            <Pressable
              onPress={() => {
                setModalError(null);
                setDeleteModalVisible(true);
              }}
              disabled={saving || statusToggling || deleting}
              style={({ pressed }) => [
                styles.deleteBtnSquare,
                pressed && styles.deleteBtnPressed,
              ]}
              accessibilityRole="button"
            >
              <Ionicons name="trash-outline" size={16} color="#DC2626" />
              <Text style={styles.deleteBtnText}>Delete Account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ─── Deactivate Bottom Sheet Modal ─── */}
      <Modal
        visible={deactivateModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeactivateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setDeactivateModalVisible(false)}
          />
          <View style={styles.modalSheetSquare}>
            <View style={styles.modalIconBoxWarning}>
              <Ionicons name="warning-outline" size={28} color="#D97706" />
            </View>

            <Text style={styles.sheetTitle}>Deactivate Account?</Text>
            <Text style={styles.sheetBody}>
              {fullName} will be unable to log in or access the system. You can reactivate this account
              at any time.
            </Text>

            {modalError ? (
              <View style={styles.modalErrorBox}>
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text style={styles.modalErrorText}>{modalError}</Text>
              </View>
            ) : null}

            <View style={styles.sheetActions}>
              <Pressable
                onPress={handleConfirmDeactivate}
                disabled={statusToggling}
                style={({ pressed }) => [
                  styles.buttonSquare,
                  styles.btnDangerSolid,
                  pressed && styles.btnPressed,
                  statusToggling && styles.btnDisabled,
                ]}
                accessibilityRole="button"
              >
                {statusToggling ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.btnPrimaryText}>Deactivate</Text>
                )}
              </Pressable>

              <Pressable
                onPress={() => setDeactivateModalVisible(false)}
                disabled={statusToggling}
                style={({ pressed }) => [
                  styles.buttonSquare,
                  styles.btnSecondary,
                  pressed && styles.btnSecondaryPressed,
                ]}
                accessibilityRole="button"
              >
                <Text style={styles.btnSecondaryText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Reactivate Bottom Sheet Modal ─── */}
      <Modal
        visible={reactivateModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setReactivateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setReactivateModalVisible(false)}
          />
          <View style={styles.modalSheetSquare}>
            <View style={styles.modalIconBoxSuccess}>
              <Ionicons name="refresh-outline" size={28} color="#16A34A" />
            </View>

            <Text style={styles.sheetTitle}>Reactivate Account?</Text>
            <Text style={styles.sheetBody}>
              {fullName} will immediately regain access to the system and be able to log in.
            </Text>

            {modalError ? (
              <View style={styles.modalErrorBox}>
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text style={styles.modalErrorText}>{modalError}</Text>
              </View>
            ) : null}

            <View style={styles.sheetActions}>
              <Pressable
                onPress={handleConfirmReactivate}
                disabled={statusToggling}
                style={({ pressed }) => [
                  styles.buttonSquare,
                  styles.btnPrimary,
                  pressed && styles.btnPressed,
                  statusToggling && styles.btnDisabled,
                ]}
                accessibilityRole="button"
              >
                {statusToggling ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.btnPrimaryText}>Reactivate</Text>
                )}
              </Pressable>

              <Pressable
                onPress={() => setReactivateModalVisible(false)}
                disabled={statusToggling}
                style={({ pressed }) => [
                  styles.buttonSquare,
                  styles.btnSecondary,
                  pressed && styles.btnSecondaryPressed,
                ]}
                accessibilityRole="button"
              >
                <Text style={styles.btnSecondaryText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Delete Confirmation Modal ─── */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setDeleteModalVisible(false)}
          />
          <View style={styles.modalSheetSquare}>
            <View style={styles.modalIconBoxDanger}>
              <Ionicons name="trash-outline" size={28} color="#DC2626" />
            </View>

            <Text style={styles.sheetTitle}>Delete Staff Account?</Text>
            <Text style={styles.sheetBody}>
              Are you sure you want to permanently delete {fullName}? This action cannot be undone.
            </Text>

            {modalError ? (
              <View style={styles.modalErrorBox}>
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text style={styles.modalErrorText}>{modalError}</Text>
              </View>
            ) : null}

            <View style={styles.sheetActions}>
              <Pressable
                onPress={handleConfirmDelete}
                disabled={deleting}
                style={({ pressed }) => [
                  styles.buttonSquare,
                  styles.btnDangerSolid,
                  pressed && styles.btnPressed,
                  deleting && styles.btnDisabled,
                ]}
                accessibilityRole="button"
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.btnPrimaryText}>Delete Permanently</Text>
                )}
              </Pressable>

              <Pressable
                onPress={() => setDeleteModalVisible(false)}
                disabled={deleting}
                style={({ pressed }) => [
                  styles.buttonSquare,
                  styles.btnSecondary,
                  pressed && styles.btnSecondaryPressed,
                ]}
                accessibilityRole="button"
              >
                <Text style={styles.btnSecondaryText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Success Notification Modal (Guaranteed Cross-Platform) ─── */}
      <Modal
        visible={successInfo.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleSuccessClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successCardSquare}>
            <View style={styles.successIconBox}>
              <Ionicons name="checkmark-sharp" size={32} color="#16A34A" />
            </View>

            <Text style={styles.successTitle}>{successInfo.title}</Text>
            <Text style={styles.successMessage}>{successInfo.message}</Text>

            <Pressable
              onPress={handleSuccessClose}
              style={({ pressed }) => [
                styles.buttonSquare,
                styles.btnPrimary,
                pressed && styles.btnPressed,
                { marginTop: 12 },
              ]}
              accessibilityRole="button"
            >
              <Text style={styles.btnPrimaryText}>Back to Staff List</Text>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
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
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 4,
    padding: 12,
    marginBottom: 18,
    gap: 10,
  },
  globalErrorText: {
    flex: 1,
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '500',
    lineHeight: 18,
  },

  /* Profile Overview Card */
  profileCard: {
    ...screenStyles.card,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 24,
    gap: 16,
  },
  avatarSquare: {
    width: 52,
    height: 52,
    borderRadius: 4,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  profileUsername: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  roleBadgeSquare: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadgeAdmin: {
    backgroundColor: '#EDE9FE',
  },
  roleBadgeAssistant: {
    backgroundColor: '#E0E7FF',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  roleTextAdmin: {
    color: '#6D28D9',
  },
  roleTextAssistant: {
    color: '#3730A3',
  },
  statusBadgeSquare: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 5,
  },
  statusBadgeActive: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgeInactive: {
    backgroundColor: '#F1F5F9',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  /* Field Groups */
  fieldGroup: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  inputWrapper: {
    height: 48,
    borderRadius: 8,
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    marginRight: 10,
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
    padding: 6,
    borderRadius: 4,
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

  /* Role Selector */
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    padding: 4,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    gap: 8,
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

  /* Action Buttons (Square & Aligned) */
  actionsStack: {
    marginTop: 12,
    gap: 12,
  },
  buttonSquare: {
    height: 48,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 8,
    width: '100%',
  },
  btnPrimary: {
    backgroundColor: '#0F172A',
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  btnPressed: {
    opacity: 0.85,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  btnSecondaryPressed: {
    backgroundColor: '#F8FAFC',
  },
  btnSecondaryText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
  },
  btnDangerOutline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DC2626',
  },
  btnDangerOutlinePressed: {
    backgroundColor: '#FEF2F2',
  },
  btnDangerOutlineText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },
  btnDangerSolid: {
    backgroundColor: '#DC2626',
  },
  btnSuccessOutline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#16A34A',
  },
  btnSuccessOutlinePressed: {
    backgroundColor: '#F0FDF4',
  },
  btnSuccessOutlineText: {
    color: '#16A34A',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteBtnSquare: {
    height: 44,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  deleteBtnPressed: {
    backgroundColor: '#FEF2F2',
  },
  deleteBtnText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalSheetSquare: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalIconBoxWarning: {
    width: 56,
    height: 56,
    borderRadius: 4,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalIconBoxSuccess: {
    width: 56,
    height: 56,
    borderRadius: 4,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalIconBoxDanger: {
    width: 56,
    height: 56,
    borderRadius: 4,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  sheetBody: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
    gap: 8,
    width: '100%',
  },
  modalErrorText: {
    flex: 1,
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
  },
  sheetActions: {
    width: '100%',
    gap: 10,
  },

  /* Success Notification Card */
  successCardSquare: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  successIconBox: {
    width: 56,
    height: 56,
    borderRadius: 4,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
});
