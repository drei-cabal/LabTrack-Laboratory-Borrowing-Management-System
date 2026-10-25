import { AppTypography } from '../../constants/typography';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Button } from '../../components/ui/Button';
import { AppColors } from '../../constants/colors';
import { staffService } from '../../services/staffService';
import { useGuardedPress } from '../../utils/guards';
import { StaffEntity, StaffRole } from '../../types';

export default function EditStaffScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [, setStaff] = useState<StaffEntity | null>(null);
  const [loadingStaff, setLoadingStaff] = useState(true);

  // Form State
  const [fullName, setFullName] = useState('');
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    async function loadStaff() {
      setLoadingStaff(true);
      try {
        const res = await staffService.getById(id as string);
        if (isMounted && res.success && res.data) {
          setStaff(res.data);
          setFullName(res.data.full_name);
          setUsername(`@${res.data.username}`);
          setRole(res.data.role);
          setIsActive(res.data.is_active);
        } else if (isMounted) {
          Alert.alert('Error', res.error || 'Failed to load staff details.', [
            { text: 'Go Back', onPress: () => router.back() },
          ]);
        }
      } catch (err: any) {
        if (isMounted) {
          Alert.alert('Error', err?.message || 'Network error loading staff.', [
            { text: 'Go Back', onPress: () => router.back() },
          ]);
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

    const cleanUser = username.replace(/^@/, '').trim();
    if (!cleanUser || cleanUser.length < 3) {
      errs.username = 'Username is required (minimum 3 characters).';
    }

    if (password && password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveChanges = useGuardedPress(async () => {
    if (!id || !validate()) return;

    setSaving(true);
    setErrors({});

    try {
      const cleanUser = username.replace(/^@/, '').trim().toLowerCase();
      const payload: any = {
        full_name: fullName.trim(),
        username: cleanUser,
        role,
      };

      if (password.trim().length > 0) {
        payload.password = password.trim();
      }

      const res = await staffService.update(id as string, payload);
      if (res.success && res.data) {
        setStaff(res.data);
        setPassword('');
        Alert.alert('Success', 'Staff member updated successfully.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        const errorMsg = res.error || 'Failed to update staff member.';
        Alert.alert('Error', errorMsg);
        if (errorMsg.toLowerCase().includes('username')) {
          setErrors({ username: errorMsg });
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Network error updating staff.');
    } finally {
      setSaving(false);
    }
  });

  const handleConfirmDeactivate = useGuardedPress(async () => {
    if (!id) return;
    setStatusToggling(true);
    try {
      const res = await staffService.toggleStatus(id as string, false);
      if (res.success && res.data) {
        setIsActive(false);
        setStaff(res.data);
        setDeactivateModalVisible(false);
        Alert.alert('Account Deactivated', `${fullName} has been deactivated.`, [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Cannot Deactivate', res.error || 'Failed to deactivate account.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Network error deactivating account.');
    } finally {
      setStatusToggling(false);
    }
  });

  const handleConfirmReactivate = useGuardedPress(async () => {
    if (!id) return;
    setStatusToggling(true);
    try {
      const res = await staffService.toggleStatus(id as string, true);
      if (res.success && res.data) {
        setIsActive(true);
        setStaff(res.data);
        setReactivateModalVisible(false);
        Alert.alert('Account Reactivated', `${fullName} has been reactivated.`, [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Error', res.error || 'Failed to reactivate account.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Network error reactivating account.');
    } finally {
      setStatusToggling(false);
    }
  });

  const handleConfirmDelete = useGuardedPress(async () => {
    if (!id) return;
    setDeleting(true);
    try {
      const res = await staffService.delete(id as string);
      if (res.success) {
        setDeleteModalVisible(false);
        Alert.alert('Account Deleted', `${fullName} has been permanently removed.`, [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Cannot Delete', res.error || 'Failed to delete account.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Network error deleting account.');
    } finally {
      setDeleting(false);
    }
  });

  if (loadingStaff) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <ScreenHeader title="Edit Staff" variant="detail" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.navy} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScreenHeader title="Edit Staff" variant="detail" />

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

          {/* Username */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Username</Text>
            <View style={[styles.inputWrapper, errors.username ? styles.inputError : null]}>
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

          {/* Actions Stack */}
          <View style={styles.actionsStack}>
            {/* Primary: Save Changes */}
            <Button
              title="Save Changes"
              onPress={handleSaveChanges}
              loading={saving}
              fullWidth
            />

            {/* Secondary: Deactivate or Reactivate Account */}
            {isActive ? (
              <Button
                title="Deactivate Account"
                variant="danger-outline"
                onPress={() => setDeactivateModalVisible(true)}
                fullWidth
              />
            ) : (
              <Button
                title="Reactivate Account"
                variant="outline"
                onPress={() => setReactivateModalVisible(true)}
                fullWidth
              />
            )}

            {/* Danger: Delete Account */}
            <Button title="Delete Account" variant="destructive" onPress={() => setDeleteModalVisible(true)} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ─── Deactivate Bottom Sheet Modal (Figma Screen 5) ─── */}
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
          <View style={styles.modalSheet}>
            {/* Top Drag Handle Indicator */}
            <View style={styles.sheetHandle} />

            <Text style={styles.sheetTitle}>Deactivate Account?</Text>
            <Text style={styles.sheetBody}>
              {fullName} will be unable to log in. You can reactivate this account at any time from
              the staff list.
            </Text>

            <View style={styles.sheetActions}>
              <Button
                title="Deactivate"
                variant="danger"
                onPress={handleConfirmDeactivate}
                loading={statusToggling}
                fullWidth
              />
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setDeactivateModalVisible(false)}
                fullWidth
              />
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
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />

            <Text style={styles.sheetTitle}>Reactivate Account?</Text>
            <Text style={styles.sheetBody}>
              {fullName} will be able to log in and access the system.
            </Text>

            <View style={styles.sheetActions}>
              <Button
                title="Reactivate"
                variant="primary"
                onPress={handleConfirmReactivate}
                loading={statusToggling}
                fullWidth
              />
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setReactivateModalVisible(false)}
                fullWidth
              />
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
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />

            <Text style={styles.sheetTitle}>Delete Account?</Text>
            <Text style={styles.sheetBody}>
              Are you sure you want to permanently delete {fullName}? This action cannot be undone.
            </Text>

            <View style={styles.sheetActions}>
              <Button
                title="Delete Permanently"
                variant="danger"
                onPress={handleConfirmDelete}
                loading={deleting}
                fullWidth
              />
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setDeleteModalVisible(false)}
                fullWidth
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  actionsStack: {
    marginTop: 16,
    gap: 12,
  },

  // Modal / Bottom Sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  modalSheet: {
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.detailTitle,
    fontWeight: AppTypography.weight.bold,
    color: AppColors.navy,
    marginBottom: 10,
  },
  sheetBody: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.body,
    color: AppColors.textSecondary,
    lineHeight: AppTypography.lineHeight.body,
    marginBottom: 24,
  },
  sheetActions: {
    gap: 10,
  },
});
