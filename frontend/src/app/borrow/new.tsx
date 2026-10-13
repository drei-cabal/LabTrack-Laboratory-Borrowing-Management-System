import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { AppColors } from '../../constants/colors';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { StepIndicator } from '../../components/borrow/StepIndicator';
import { useEquipment } from '../../hooks/useEquipment';
import { borrowService } from '../../services/borrowService';
import { EquipmentWithDetails, BorrowItemInput } from '../../types';
import { ROUTES } from '../../routing/routes';

interface SelectedItemState {
  equipment: EquipmentWithDetails;
  quantity: number;
}

export default function NewBorrowTransactionScreen() {
  const router = useRouter();
  const { items: equipmentList, loading: loadingEquipment } = useEquipment();

  // Multi-step state: 1, 2, 3, 4
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Borrower Info
  const [borrowerName, setBorrowerName] = useState('Carlos Mendoza');
  const [borrowerId, setBorrowerId] = useState('2023-00456');
  const [purpose, setPurpose] = useState('EE201 Lab Experiment 4 — RLC Circuits');
  const [errorsStep1, setErrorsStep1] = useState<Record<string, string>>({});

  // Step 2: Selected Items (map by equipment_id)
  const [selectedItems, setSelectedItems] = useState<Map<string, SelectedItemState>>(new Map());

  // Step 3: Loan Period
  const [loanPeriodDays, setLoanPeriodDays] = useState('3');

  // Step 4: Photo & Submission
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Date calculation
  const today = new Date();
  const daysNum = Math.max(1, parseInt(loanPeriodDays, 10) || 3);
  const returnDate = new Date(today.getTime() + daysNum * 86_400_000);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // ─── Step Navigation ────────────────────────────────────────────────────────

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace(ROUTES.BORROW as any);
      }
    }
  };

  const handleNextStep1 = () => {
    const errs: Record<string, string> = {};
    if (!borrowerName.trim()) errs.borrowerName = 'Borrower name is required';
    if (!borrowerId.trim()) errs.borrowerId = 'Student/Staff ID is required';
    if (!purpose.trim()) errs.purpose = 'Purpose is required';

    if (Object.keys(errs).length > 0) {
      setErrorsStep1(errs);
      return;
    }
    setErrorsStep1({});
    setCurrentStep(2);
  };

  const handleNextStep2 = () => {
    if (selectedItems.size === 0) {
      Alert.alert('No Items Selected', 'Please select at least one equipment item to borrow.');
      return;
    }
    setCurrentStep(3);
  };

  const handleNextStep3 = () => {
    const days = parseInt(loanPeriodDays, 10);
    if (isNaN(days) || days < 1) {
      Alert.alert('Invalid Loan Period', 'Please enter a valid loan duration in days (minimum 1 day).');
      return;
    }
    setCurrentStep(4);
  };

  // ─── Step 2: Equipment selection logic ──────────────────────────────────────

  const toggleItemSelection = (item: EquipmentWithDetails) => {
    setSelectedItems((prev) => {
      const next = new Map(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        if (item.available_quantity <= 0) {
          Alert.alert('Out of Stock', `"${item.name}" has no available units.`);
          return prev;
        }
        next.set(item.id, { equipment: item, quantity: 1 });
      }
      return next;
    });
  };

  const updateItemQuantity = (equipmentId: string, delta: number) => {
    setSelectedItems((prev) => {
      const next = new Map(prev);
      const current = next.get(equipmentId);
      if (!current) return prev;

      const newQty = current.quantity + delta;
      if (newQty <= 0) {
        next.delete(equipmentId);
      } else if (newQty > current.equipment.available_quantity) {
        Alert.alert(
          'Maximum Available Reached',
          `Only ${current.equipment.available_quantity} unit(s) of "${current.equipment.name}" available.`
        );
      } else {
        next.set(equipmentId, { ...current, quantity: newQty });
      }
      return next;
    });
  };

  const removeItem = (equipmentId: string) => {
    setSelectedItems((prev) => {
      const next = new Map(prev);
      next.delete(equipmentId);
      return next;
    });
  };

  // ─── Step 4: Photo capture logic ────────────────────────────────────────────

  const handleCapturePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        // Fallback to media library if camera permission is rejected
        const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (libraryPermission.status !== 'granted') {
          Alert.alert('Permission Denied', 'Camera or gallery permission is required to attach photo proof.');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.6,
        });
        if (!result.canceled && result.assets[0]) {
          setPhotoUri(result.assets[0].uri);
        }
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.6,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch {
      // If camera fails on simulator or web, use photo library
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.6,
        });
        if (!result.canceled && result.assets[0]) {
          setPhotoUri(result.assets[0].uri);
        }
      } catch (err: any) {
        Alert.alert('Error', err?.message || 'Could not access camera or library.');
      }
    }
  };

  // ─── Step 4: Approve Transaction ───────────────────────────────────────────

  const executeApproveTransaction = async () => {
    try {
      setSubmitting(true);

      const itemsPayload: BorrowItemInput[] = Array.from(selectedItems.values()).map((s) => ({
        equipment_id: s.equipment.id,
        quantity: s.quantity,
      }));

      const res = await borrowService.createTransaction({
        borrower_name: borrowerName.trim(),
        borrower_id: borrowerId.trim(),
        purpose: purpose.trim(),
        items: itemsPayload,
        loan_period_days: daysNum,
        authorized_by: 'Admin Cruz',
        photo_proof: photoUri || undefined,
      });

      if (res.success) {
        Alert.alert('Transaction Approved', 'The borrow transaction has been successfully recorded.', [
          {
            text: 'View Transactions',
            onPress: () => router.replace(ROUTES.BORROW as any),
          },
        ]);
      } else {
        Alert.alert('Transaction Failed', res.error || 'Failed to record borrow transaction.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveTransaction = () => {
    if (submitting) return;

    Alert.alert(
      'Approve Borrow Transaction',
      `Confirm checkout of ${selectedItems.size} equipment type(s) for ${borrowerName.trim()} (${daysNum} days)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: executeApproveTransaction,
        },
      ]
    );
  };

  // ─── Step Title ─────────────────────────────────────────────────────────────

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return 'Borrower Info';
      case 2:
        return 'Select Items';
      case 3:
        return 'Loan Period';
      case 4:
        return 'Review & Approve';
      default:
        return 'Borrow';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Screen Header with Back Arrow */}
      <ScreenHeader
        title="New Transaction"
        showBack
        onBack={handleBack}
      />

      {/* Progress Indicator 1/4 -> 4/4 */}
      <StepIndicator
        currentStep={currentStep}
        totalSteps={4}
        title={getStepTitle()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ═══════════════════════════════════════════════════════════════════
              STEP 1: BORROWER INFO
             ═══════════════════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <View style={styles.stepContainer}>
              <Input
                label="Borrower Name"
                placeholder="e.g. Carlos Mendoza"
                value={borrowerName}
                onChangeText={(val) => {
                  setBorrowerName(val);
                  if (errorsStep1.borrowerName) setErrorsStep1((p) => ({ ...p, borrowerName: '' }));
                }}
                error={errorsStep1.borrowerName}
              />

              <Input
                label="Student / Staff ID"
                placeholder="e.g. 2023-00456"
                value={borrowerId}
                onChangeText={(val) => {
                  setBorrowerId(val);
                  if (errorsStep1.borrowerId) setErrorsStep1((p) => ({ ...p, borrowerId: '' }));
                }}
                error={errorsStep1.borrowerId}
              />

              <Input
                label="Purpose"
                placeholder="e.g. EE201 Lab Experiment 4 — RLC Circuits"
                value={purpose}
                onChangeText={(val) => {
                  setPurpose(val);
                  if (errorsStep1.purpose) setErrorsStep1((p) => ({ ...p, purpose: '' }));
                }}
                error={errorsStep1.purpose}
                multiline
                numberOfLines={3}
              />

              <Button
                title="Next"
                variant="primary"
                onPress={handleNextStep1}
                style={styles.nextBtn}
              />
            </View>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              STEP 2: SELECT ITEMS
             ═══════════════════════════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.instructionText}>
                Tap an item to add it to the transaction.
              </Text>

              {loadingEquipment ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={AppColors.navy} />
                </View>
              ) : (
                <View style={styles.itemListContainer}>
                  {equipmentList.map((item) => {
                    const isSelected = selectedItems.has(item.id);
                    const isAvailable = item.available_quantity > 0;

                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => isAvailable && toggleItemSelection(item)}
                        style={({ pressed }) => [
                          styles.itemCard,
                          isSelected && styles.itemCardSelected,
                          !isAvailable && styles.itemCardDisabled,
                          pressed && isAvailable && styles.itemCardPressed,
                        ]}
                      >
                        <View style={styles.itemCardLeft}>
                          {/* Checkbox icon */}
                          <View
                            style={[
                              styles.checkbox,
                              isSelected && styles.checkboxSelected,
                              !isAvailable && styles.checkboxDisabled,
                            ]}
                          >
                            {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                          </View>

                          <View style={styles.itemCardInfo}>
                            <Text
                              style={[
                                styles.itemName,
                                !isAvailable && styles.itemNameDisabled,
                              ]}
                            >
                              {item.name}
                            </Text>
                            <Text style={styles.itemAvailText}>
                              {item.available_quantity}/{item.total_quantity} avail.
                            </Text>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {/* Selected Items summary section with steppers */}
              {selectedItems.size > 0 && (
                <View style={styles.selectedSection}>
                  <Text style={styles.selectedHeader}>
                    SELECTED ({selectedItems.size})
                  </Text>

                  {Array.from(selectedItems.values()).map((selected) => (
                    <View key={selected.equipment.id} style={styles.selectedRow}>
                      <Text style={styles.selectedItemName} numberOfLines={1}>
                        {selected.equipment.name}
                      </Text>

                      <View style={styles.stepperContainer}>
                        <Pressable
                          onPress={() => updateItemQuantity(selected.equipment.id, -1)}
                          style={({ pressed }) => [
                            styles.stepperBtn,
                            pressed && styles.stepperBtnPressed,
                          ]}
                          hitSlop={6}
                        >
                          <Ionicons name="remove" size={16} color={AppColors.navy} />
                        </Pressable>

                        <Text style={styles.stepperValue}>{selected.quantity}</Text>

                        <Pressable
                          onPress={() => updateItemQuantity(selected.equipment.id, 1)}
                          style={({ pressed }) => [
                            styles.stepperBtn,
                            pressed && styles.stepperBtnPressed,
                          ]}
                          hitSlop={6}
                        >
                          <Ionicons name="add" size={16} color={AppColors.navy} />
                        </Pressable>

                        <Pressable
                          onPress={() => removeItem(selected.equipment.id)}
                          style={({ pressed }) => [
                            styles.deleteItemBtn,
                            pressed && styles.deleteItemBtnPressed,
                          ]}
                          hitSlop={6}
                        >
                          <Ionicons name="close" size={14} color="#EF4444" />
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              <Button
                title="Next"
                variant="primary"
                onPress={handleNextStep2}
                disabled={selectedItems.size === 0}
                style={styles.nextBtn}
              />
            </View>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              STEP 3: LOAN PERIOD
             ═══════════════════════════════════════════════════════════════════ */}
          {currentStep === 3 && (
            <View style={styles.stepContainer}>
              <Input
                label="Loan Period (days)"
                keyboardType="numeric"
                value={loanPeriodDays}
                onChangeText={setLoanPeriodDays}
                placeholder="3"
              />

              {/* Computed Dates Card */}
              <View style={styles.datesCard}>
                <Text style={styles.datesHeader}>COMPUTED DATES</Text>
                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>Date Borrowed</Text>
                  <Text style={styles.dateValue}>{formatDate(today)}</Text>
                </View>
                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>Expected Return</Text>
                  <Text style={styles.dateValueBold}>{formatDate(returnDate)}</Text>
                </View>
              </View>

              <Button
                title="Next"
                variant="primary"
                onPress={handleNextStep3}
                style={styles.nextBtn}
              />
            </View>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              STEP 4: PHOTO & REVIEW
             ═══════════════════════════════════════════════════════════════════ */}
          {currentStep === 4 && (
            <View style={styles.stepContainer}>
              {/* Photo Proof Section */}
              <View style={styles.photoSection}>
                <Text style={styles.sectionTitle}>Photo Proof</Text>

                {photoUri ? (
                  <View style={styles.photoPreviewContainer}>
                    <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                    <Pressable
                      onPress={() => setPhotoUri(null)}
                      style={styles.photoRemoveBadge}
                    >
                      <Ionicons name="close" size={14} color="#FFFFFF" />
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.cameraBox}>
                    <Ionicons name="camera-outline" size={28} color={AppColors.navy} />
                    <Text style={styles.cameraText}>
                      Capture photo of items with borrower present
                    </Text>
                    <Pressable
                      onPress={handleCapturePhoto}
                      style={({ pressed }) => [
                        styles.openCameraBtn,
                        pressed && styles.openCameraBtnPressed,
                      ]}
                    >
                      <Text style={styles.openCameraBtnText}>Open Camera</Text>
                    </Pressable>
                  </View>
                )}
              </View>

              {/* Summary Card */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>SUMMARY</Text>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Borrower</Text>
                  <Text style={styles.summaryValue}>{borrowerName}</Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>ID</Text>
                  <Text style={styles.summaryValue}>{borrowerId}</Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Purpose</Text>
                  <Text style={styles.summaryValue} numberOfLines={2}>
                    {purpose}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Items</Text>
                  <Text style={styles.summaryValue}>
                    {Array.from(selectedItems.values())
                      .map((s) => `${s.equipment.name} ×${s.quantity}`)
                      .join(', ')}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Due Date</Text>
                  <Text style={styles.summaryValueBold}>{formatDate(returnDate)}</Text>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Authorized By</Text>
                  <Text style={styles.summaryValue}>Admin Cruz</Text>
                </View>
              </View>

              <Button
                title="Approve Transaction"
                variant="primary"
                onPress={handleApproveTransaction}
                loading={submitting}
                style={styles.nextBtn}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  stepContainer: {
    width: '100%',
  },
  nextBtn: {
    marginTop: 24,
  },
  instructionText: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginBottom: 16,
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  itemListContainer: {
    gap: 10,
    marginBottom: 24,
  },
  itemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemCardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: AppColors.navy,
  },
  itemCardDisabled: {
    opacity: 0.5,
    backgroundColor: '#F1F5F9',
  },
  itemCardPressed: {
    opacity: 0.85,
  },
  itemCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxSelected: {
    backgroundColor: AppColors.navy,
    borderColor: AppColors.navy,
  },
  checkboxDisabled: {
    backgroundColor: '#E2E8F0',
    borderColor: '#CBD5E1',
  },
  itemCardInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.text,
  },
  itemNameDisabled: {
    color: AppColors.textMuted,
  },
  itemAvailText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  selectedSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  selectedHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  selectedRow: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  selectedItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.text,
    flex: 1,
    marginRight: 8,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnPressed: {
    backgroundColor: '#E2E8F0',
  },
  stepperValue: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.text,
    minWidth: 18,
    textAlign: 'center',
  },
  deleteItemBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  deleteItemBtnPressed: {
    backgroundColor: '#FECACA',
  },
  datesCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 12,
    marginTop: 8,
  },
  datesHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: AppColors.textSecondary,
    letterSpacing: 0.8,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 13,
    color: AppColors.textSecondary,
  },
  dateValue: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.text,
  },
  dateValueBold: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.navy,
  },
  photoSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.text,
    marginBottom: 10,
  },
  cameraBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    gap: 8,
  },
  cameraText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    textAlign: 'center',
    maxWidth: 220,
  },
  openCameraBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 6,
  },
  openCameraBtnPressed: {
    backgroundColor: '#F1F5F9',
  },
  openCameraBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.text,
  },
  photoPreviewContainer: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoRemoveBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 10,
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: AppColors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
    width: 90,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.text,
    flex: 1,
    textAlign: 'right',
  },
  summaryValueBold: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.navy,
    flex: 1,
    textAlign: 'right',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
});
