import React, { useState, useMemo } from 'react';
import { AppTypography } from '../../constants/typography';
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
  TextInput,
  Modal,
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
import { useStaff } from '../../hooks/useStaff';
import { borrowService } from '../../services/borrowService';
import { EquipmentWithDetails, BorrowItemInput } from '../../types';
import { ROUTES } from '../../routing/routes';

interface SelectedItemState {
  equipment: EquipmentWithDetails;
  quantity: number;
}

type BorrowerRole = 'Student' | 'Faculty' | 'Staff' | 'Researcher';
type EquipmentFilterTab = 'all' | 'available' | 'selected';

const BORROWER_ROLES: BorrowerRole[] = ['Student', 'Faculty', 'Staff', 'Researcher'];

const DURATION_PRESETS = [
  { label: '1 Day (Overnight)', days: 1 },
  { label: '3 Days (Standard)', days: 3 },
  { label: '7 Days (1 Week)', days: 7 },
  { label: '14 Days (Extended)', days: 14 },
];

const SCHEDULE_PRESETS = [
  { label: 'Today — Morning (8:00 AM – 12:00 PM)', value: 'Today — Morning (8:00 AM – 12:00 PM)', icon: 'sunny-outline' as const },
  { label: 'Today — Afternoon (1:00 PM – 5:00 PM)', value: 'Today — Afternoon (1:00 PM – 5:00 PM)', icon: 'partly-sunny-outline' as const },
  { label: 'Today — Full Day (8:00 AM – 5:00 PM)', value: 'Today — Full Day (8:00 AM – 5:00 PM)', icon: 'time-outline' as const },
  { label: 'Tomorrow — Morning (8:00 AM – 12:00 PM)', value: 'Tomorrow — Morning (8:00 AM – 12:00 PM)', icon: 'sunny-outline' as const },
  { label: 'Tomorrow — Afternoon (1:00 PM – 5:00 PM)', value: 'Tomorrow — Afternoon (1:00 PM – 5:00 PM)', icon: 'partly-sunny-outline' as const },
  { label: 'Tomorrow — Full Day (8:00 AM – 5:00 PM)', value: 'Tomorrow — Full Day (8:00 AM – 5:00 PM)', icon: 'time-outline' as const },
  { label: 'MWF Schedule (8:30 AM – 11:30 AM)', value: 'MWF Schedule (8:30 AM – 11:30 AM)', icon: 'calendar-outline' as const },
  { label: 'TTH Schedule (1:30 PM – 4:30 PM)', value: 'TTH Schedule (1:30 PM – 4:30 PM)', icon: 'calendar-outline' as const },
  { label: 'Saturday Lab (8:00 AM – 1:00 PM)', value: 'Saturday Lab (8:00 AM – 1:00 PM)', icon: 'calendar-outline' as const },
  { label: 'Custom Schedule / Specific Date...', value: '__custom__', icon: 'create-outline' as const },
];

const COURSE_PRESETS = ['BS EE', 'BS CpE', 'BS ECE', 'BS ME', 'BS CE', 'BS CS'];
const PURPOSE_PRESETS = [
  'Lab Experiment / Practical',
  'Capstone / Thesis Project',
  'Class Lecture & Demo',
  'Faculty Research',
];

function showNotice(title: string, message: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

export default function NewBorrowTransactionScreen() {
  const router = useRouter();
  const { items: equipmentList, loading: loadingEquipment } = useEquipment();
  const { staff: staffList } = useStaff();

  // Multi-step: 1: Borrower, 2: Select Items, 3: Schedule, 4: Review & Approve
  const [currentStep, setCurrentStep] = useState<number>(1);

  // ─── Step 1: Borrower Information ───────────────────────────────────────────
  const [borrowerRole, setBorrowerRole] = useState<BorrowerRole>('Student');
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerId, setBorrowerId] = useState('');
  const [department, setDepartment] = useState('');
  const [course, setCourse] = useState('');
  const [subject, setSubject] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [scheduleDate, setScheduleDate] = useState('Today — Morning (8:00 AM – 12:00 PM)');
  const [customScheduleText, setCustomScheduleText] = useState('');
  const [isCustomSchedule, setIsCustomSchedule] = useState(false);
  const [showScheduleDropdown, setShowScheduleDropdown] = useState(false);
  const [contactNumber, setContactNumber] = useState('');
  const [purpose, setPurpose] = useState('');
  const [errorsStep1, setErrorsStep1] = useState<Record<string, string>>({});

  // ─── Step 2: Equipment Selection ────────────────────────────────────────────
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [equipmentFilter, setEquipmentFilter] = useState<EquipmentFilterTab>('all');
  const [selectedItems, setSelectedItems] = useState<Map<string, SelectedItemState>>(new Map());

  // ─── Step 3: Loan Period & Schedule ─────────────────────────────────────────
  const [loanPeriodDays, setLoanPeriodDays] = useState('3');
  const [customDaysActive, setCustomDaysActive] = useState(false);
  const [handlingNotes, setHandlingNotes] = useState('');

  // ─── Step 4: Approval & Review ──────────────────────────────────────────────
  const [authorizedBy, setAuthorizedBy] = useState('Admin Cruz');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [acknowledgedPolicy, setAcknowledgedPolicy] = useState(true);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Confirmation modal state (cross-platform, works on Web & Native)
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // ─── Approval Success State ─────────────────────────────────────────────────
  const [approvedSuccessData, setApprovedSuccessData] = useState<{
    transactionCode: string;
    borrowerName: string;
    totalItems: number;
    dueDateStr: string;
    approver: string;
  } | null>(null);

  // Active staff list for approver selection
  const activeStaff = useMemo(() => {
    return staffList.filter((s) => s.is_active);
  }, [staffList]);

  // Loan period days number
  const daysNum = Math.max(1, parseInt(loanPeriodDays, 10) || 1);
  const today = new Date();
  const returnDate = new Date(today.getTime() + daysNum * 86_400_000);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // ─── Filtered Equipment List ────────────────────────────────────────────────
  const filteredEquipment = useMemo(() => {
    return equipmentList.filter((item) => {
      // Filter tab
      if (equipmentFilter === 'available' && item.available_quantity <= 0) {
        return false;
      }
      if (equipmentFilter === 'selected' && !selectedItems.has(item.id)) {
        return false;
      }

      // Search query
      if (equipmentSearch.trim()) {
        const query = equipmentSearch.trim().toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesBrand = (item.brand || '').toLowerCase().includes(query);
        const matchesModel = (item.model || '').toLowerCase().includes(query);
        const matchesTag = (item.product_id || '').toLowerCase().includes(query);
        return matchesName || matchesBrand || matchesModel || matchesTag;
      }

      return true;
    });
  }, [equipmentList, equipmentFilter, selectedItems, equipmentSearch]);

  const totalSelectedUnits = useMemo(() => {
    let count = 0;
    for (const item of selectedItems.values()) {
      count += item.quantity;
    }
    return count;
  }, [selectedItems]);

  // ─── Step Navigation Handlers ───────────────────────────────────────────────
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
    if (!purpose.trim()) errs.purpose = 'Purpose of borrowing is required';

    if (Object.keys(errs).length > 0) {
      setErrorsStep1(errs);
      return;
    }
    setErrorsStep1({});
    setCurrentStep(2);
  };

  const handleNextStep2 = () => {
    if (selectedItems.size === 0) {
      showNotice('No Equipment Selected', 'Please select at least one piece of equipment to borrow.');
      return;
    }
    setCurrentStep(3);
  };

  const handleNextStep3 = () => {
    const days = parseInt(loanPeriodDays, 10);
    if (isNaN(days) || days < 1) {
      showNotice('Invalid Loan Duration', 'Please enter a valid loan duration (minimum 1 day).');
      return;
    }
    setCurrentStep(4);
  };

  // ─── Equipment Selection Handlers ───────────────────────────────────────────
  const toggleItemSelection = (item: EquipmentWithDetails) => {
    setSelectedItems((prev) => {
      const next = new Map(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        if (item.available_quantity <= 0) {
          showNotice('Out of Stock', `"${item.name}" currently has 0 available units.`);
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
        showNotice(
          'Maximum Stock Limit',
          `Only ${current.equipment.available_quantity} unit(s) of "${current.equipment.name}" currently available.`
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

  // ─── Photo Capture Handlers ─────────────────────────────────────────────────
  const handleCapturePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (libraryPermission.status !== 'granted') {
          showNotice('Permission Denied', 'Camera or photo library permission is required to attach proof.');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.7,
        });
        if (!result.canceled && result.assets[0]) {
          setPhotoUri(result.assets[0].uri);
        }
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch {
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.7,
        });
        if (!result.canceled && result.assets[0]) {
          setPhotoUri(result.assets[0].uri);
        }
      } catch (err: any) {
        showNotice('Error', err?.message || 'Could not access camera or library.');
      }
    }
  };

  // ─── Approve Transaction Execution ──────────────────────────────────────────
  const executeApproveTransaction = async () => {
    try {
      setSubmitting(true);
      setSubmissionError(null);

      const itemsPayload: BorrowItemInput[] = Array.from(selectedItems.values()).map((s) => ({
        equipment_id: s.equipment.id,
        quantity: s.quantity,
      }));

      // Assemble structured notes matching the physical Borrower's Slip fields
      const notesParts: string[] = [];
      if (borrowerRole) notesParts.push(`Role: ${borrowerRole}`);
      if (department.trim()) notesParts.push(`College/Office: ${department.trim()}`);
      if (course.trim()) notesParts.push(`Course: ${course.trim()}`);
      if (subject.trim()) notesParts.push(`Subject: ${subject.trim()}`);
      if (subjectCode.trim()) notesParts.push(`Code: ${subjectCode.trim()}`);
      if (teacherName.trim()) notesParts.push(`Teacher: ${teacherName.trim()}`);
      if (scheduleDate.trim()) notesParts.push(`Schedule: ${scheduleDate.trim()}`);
      if (contactNumber.trim()) notesParts.push(`Contact: ${contactNumber.trim()}`);
      if (handlingNotes.trim()) notesParts.push(`Condition Notes: ${handlingNotes.trim()}`);
      if (approvalNotes.trim()) notesParts.push(`Approval Notes: ${approvalNotes.trim()}`);
      const compiledNotes = notesParts.join(' | ');

      const res = await borrowService.createTransaction({
        borrower_name: borrowerName.trim(),
        borrower_id: borrowerId.trim(),
        purpose: purpose.trim(),
        items: itemsPayload,
        loan_period_days: daysNum,
        authorized_by: authorizedBy.trim() || 'Admin Cruz',
        photo_proof: photoUri || undefined,
        notes: compiledNotes || undefined,
      });

      if (res.success && res.data && res.data.length > 0) {
        const createdRecords = res.data;
        const generatedCode = createdRecords[0]?.transaction_code || 'TXN-RECORD';

        setShowConfirmModal(false);
        setApprovedSuccessData({
          transactionCode: generatedCode,
          borrowerName: borrowerName.trim(),
          totalItems: totalSelectedUnits,
          dueDateStr: formatDate(returnDate),
          approver: authorizedBy.trim() || 'Admin Cruz',
        });
      } else {
        const err = res.error || 'Failed to approve and record borrow transaction.';
        setSubmissionError(err);
        showNotice('Approval Failed', err);
      }
    } catch (err: any) {
      const errMsg = err?.message || 'An unexpected error occurred while approving the transaction.';
      setSubmissionError(errMsg);
      showNotice('Error', errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprovePress = () => {
    if (submitting) return;

    if (!acknowledgedPolicy) {
      setSubmissionError('Please confirm ID verification and borrower acknowledgment checkbox before approving.');
      return;
    }

    setSubmissionError(null);
    setShowConfirmModal(true);
  };

  const handleResetForm = () => {
    setApprovedSuccessData(null);
    setShowConfirmModal(false);
    setCurrentStep(1);
    setBorrowerName('');
    setBorrowerId('');
    setDepartment('');
    setCourse('');
    setSubject('');
    setSubjectCode('');
    setTeacherName('');
    setScheduleDate('Today — Morning (8:00 AM – 12:00 PM)');
    setCustomScheduleText('');
    setIsCustomSchedule(false);
    setShowScheduleDropdown(false);
    setContactNumber('');
    setPurpose('');
    setSelectedItems(new Map());
    setLoanPeriodDays('3');
    setCustomDaysActive(false);
    setHandlingNotes('');
    setApprovalNotes('');
    setPhotoUri(null);
    setSubmissionError(null);
  };

  // ─── Step Title ─────────────────────────────────────────────────────────────
  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return 'Borrower Information';
      case 2:
        return 'Select Equipment';
      case 3:
        return 'Schedule & Loan Details';
      case 4:
        return 'Review & Approve';
      default:
        return 'New Transaction';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Screen Header */}
      <ScreenHeader
        title="New Transaction"
        variant="detail"
        onBack={handleBack}
      />

      {/* Progress Step Indicator */}
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
              STEP 1: BORROWER INFORMATION
             ═══════════════════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <View style={styles.stepContainer}>
              <View style={styles.sectionHeaderBox}>
                <Ionicons name="person-circle-outline" size={22} color={AppColors.navy} />
                <Text style={styles.sectionHeading}>Borrower Details</Text>
              </View>

              {/* Borrower Role Selector */}
              <Text style={styles.fieldLabel}>Borrower Role</Text>
              <View style={styles.roleChipsRow}>
                {BORROWER_ROLES.map((role) => {
                  const isSelected = borrowerRole === role;
                  return (
                    <Pressable
                      key={role}
                      onPress={() => setBorrowerRole(role)}
                      style={[styles.roleChip, isSelected && styles.roleChipSelected]}
                    >
                      <Text style={[styles.roleChipText, isSelected && styles.roleChipTextSelected]}>
                        {role}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Input
                label="Full Name *"
                placeholder="e.g. Carlos Mendoza"
                value={borrowerName}
                onChangeText={(val) => {
                  setBorrowerName(val);
                  if (errorsStep1.borrowerName) setErrorsStep1((p) => ({ ...p, borrowerName: '' }));
                }}
                error={errorsStep1.borrowerName}
              />

              <Input
                label="Student / Staff ID Number *"
                placeholder="e.g. 2023-00456"
                value={borrowerId}
                onChangeText={(val) => {
                  setBorrowerId(val);
                  if (errorsStep1.borrowerId) setErrorsStep1((p) => ({ ...p, borrowerId: '' }));
                }}
                error={errorsStep1.borrowerId}
              />

              <Input
                label="College / Office / Department"
                placeholder="e.g. College of Engineering"
                value={department}
                onChangeText={setDepartment}
              />

              <Input
                label="Contact Number / Email"
                placeholder="e.g. +63 912 345 6789 or cmendoza@univ.edu"
                keyboardType="email-address"
                value={contactNumber}
                onChangeText={setContactNumber}
              />

              {/* ── Academic / Course Information ─────────────────────────── */}
              <View style={styles.sectionHeaderBox}>
                <Ionicons name="school-outline" size={20} color={AppColors.navy} />
                <Text style={styles.sectionHeading}>Academic / Course Information</Text>
              </View>

              <Input
                label="Course"
                placeholder="e.g. BS Electrical Engineering"
                value={course}
                onChangeText={setCourse}
              />

              {/* Quick Course Presets */}
              <View style={styles.quickChipsRow}>
                {COURSE_PRESETS.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setCourse(c)}
                    style={[styles.quickChip, course === c && styles.quickChipActive]}
                  >
                    <Text style={[styles.quickChipText, course === c && styles.quickChipTextActive]}>
                      {c}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Subject name + code on same row */}
              <View style={styles.rowFields}>
                <View style={styles.rowFieldFlex}>
                  <Input
                    label="Subject"
                    placeholder="e.g. Circuit Analysis"
                    value={subject}
                    onChangeText={setSubject}
                  />
                </View>
                <View style={styles.rowFieldShort}>
                  <Input
                    label="Subject Code"
                    placeholder="e.g. EE201"
                    value={subjectCode}
                    onChangeText={setSubjectCode}
                  />
                </View>
              </View>

              <Input
                label="Name of Teacher / Supervisor"
                placeholder="e.g. Prof. Maria Santos"
                value={teacherName}
                onChangeText={setTeacherName}
              />

              {/* ── Schedule / Date of Use (Dropdown & Quick Presets) ─────────── */}
              <View style={styles.scheduleFieldGroup}>
                <Text style={styles.fieldLabel}>Schedule / Date of Use</Text>
                <Pressable
                  onPress={() => setShowScheduleDropdown(true)}
                  style={styles.dropdownTrigger}
                >
                  <View style={styles.dropdownTriggerContent}>
                    <Ionicons name="time-outline" size={18} color={AppColors.navy} />
                    <Text
                      style={[
                        styles.dropdownTriggerText,
                        !scheduleDate && styles.dropdownTriggerPlaceholder,
                      ]}
                      numberOfLines={1}
                    >
                      {scheduleDate || 'Select laboratory schedule or date...'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={18} color="#64748B" />
                </Pressable>

                {/* Quick Schedule 1-tap pills */}
                <View style={styles.quickChipsRow}>
                  <Pressable
                    onPress={() => {
                      setScheduleDate('Today — Morning (8:00 AM – 12:00 PM)');
                      setIsCustomSchedule(false);
                    }}
                    style={[
                      styles.quickChip,
                      scheduleDate.startsWith('Today — Morning') && styles.quickChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.quickChipText,
                        scheduleDate.startsWith('Today — Morning') && styles.quickChipTextActive,
                      ]}
                    >
                      Today 8–12 AM
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setScheduleDate('Today — Afternoon (1:00 PM – 5:00 PM)');
                      setIsCustomSchedule(false);
                    }}
                    style={[
                      styles.quickChip,
                      scheduleDate.startsWith('Today — Afternoon') && styles.quickChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.quickChipText,
                        scheduleDate.startsWith('Today — Afternoon') && styles.quickChipTextActive,
                      ]}
                    >
                      Today 1–5 PM
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setScheduleDate('Tomorrow — Morning (8:00 AM – 12:00 PM)');
                      setIsCustomSchedule(false);
                    }}
                    style={[
                      styles.quickChip,
                      scheduleDate.startsWith('Tomorrow — Morning') && styles.quickChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.quickChipText,
                        scheduleDate.startsWith('Tomorrow — Morning') && styles.quickChipTextActive,
                      ]}
                    >
                      Tomorrow 8–12 AM
                    </Text>
                  </Pressable>
                </View>

                {/* Custom schedule input if custom is chosen */}
                {isCustomSchedule && (
                  <View style={{ marginTop: 8 }}>
                    <Input
                      label="Specific Custom Schedule"
                      placeholder="e.g. Oct 20, 2026 8:00 AM – 11:30 AM (Lab 304)"
                      value={customScheduleText}
                      onChangeText={(val) => {
                        setCustomScheduleText(val);
                        setScheduleDate(val);
                      }}
                    />
                  </View>
                )}
              </View>

              {/* ── Purpose ───────────────────────────────────────────────── */}
              <View style={styles.sectionHeaderBox}>
                <Ionicons name="document-text-outline" size={20} color={AppColors.navy} />
                <Text style={styles.sectionHeading}>Purpose of Borrowing</Text>
              </View>

              {/* Quick Purpose Pills */}
              <View style={styles.quickChipsRow}>
                {PURPOSE_PRESETS.map((p) => (
                  <Pressable
                    key={p}
                    onPress={() => {
                      setPurpose(p);
                      if (errorsStep1.purpose) setErrorsStep1((prev) => ({ ...prev, purpose: '' }));
                    }}
                    style={[styles.quickChip, purpose === p && styles.quickChipActive]}
                  >
                    <Text style={[styles.quickChipText, purpose === p && styles.quickChipTextActive]}>
                      {p}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Input
                label="Purpose *"
                placeholder="e.g. EE201 Lab Experiment 4 — RLC Circuits & Signal Analysis"
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
                title="Continue to Equipment Selection"
                variant="primary"
                onPress={handleNextStep1}
                style={styles.actionBtn}
              />
            </View>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              STEP 2: SELECT EQUIPMENT
             ═══════════════════════════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <View style={styles.stepContainer}>
              {/* Search Bar */}
              <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={18} color="#64748B" />
                <TextInput
                  placeholder="Search equipment by name, brand, or tag..."
                  placeholderTextColor="#94A3B8"
                  value={equipmentSearch}
                  onChangeText={setEquipmentSearch}
                  style={styles.searchInput}
                  clearButtonMode="while-editing"
                />
                {equipmentSearch.length > 0 && (
                  <Pressable onPress={() => setEquipmentSearch('')} hitSlop={6}>
                    <Ionicons name="close-circle" size={16} color="#94A3B8" />
                  </Pressable>
                )}
              </View>

              {/* Filter Tabs */}
              <View style={styles.filterTabsRow}>
                {(
                  [
                    { key: 'all', label: 'All Items' },
                    { key: 'available', label: 'In Stock' },
                    { key: 'selected', label: `Selected (${selectedItems.size})` },
                  ] as { key: EquipmentFilterTab; label: string }[]
                ).map((tab) => {
                  const isActive = equipmentFilter === tab.key;
                  return (
                    <Pressable
                      key={tab.key}
                      onPress={() => setEquipmentFilter(tab.key)}
                      style={[styles.filterTab, isActive && styles.filterTabActive]}
                    >
                      <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                        {tab.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Selected Summary Pill */}
              {selectedItems.size > 0 && (
                <View style={styles.selectedCountBanner}>
                  <Ionicons name="cube" size={16} color={AppColors.navy} />
                  <Text style={styles.selectedCountBannerText}>
                    <Text style={{ fontWeight: '700' }}>{selectedItems.size}</Text> equipment type(s) selected (
                    <Text style={{ fontWeight: '700' }}>{totalSelectedUnits}</Text> unit(s) total)
                  </Text>
                </View>
              )}

              {/* Equipment Item Cards */}
              {loadingEquipment ? (
                <View style={styles.centerContainer}>
                  <ActivityIndicator size="small" color={AppColors.navy} />
                  <Text style={styles.loadingText}>Loading equipment inventory...</Text>
                </View>
              ) : filteredEquipment.length === 0 ? (
                <View style={styles.emptyItemsBox}>
                  <Ionicons name="file-tray-outline" size={32} color="#94A3B8" />
                  <Text style={styles.emptyItemsTitle}>No equipment found</Text>
                  <Text style={styles.emptyItemsSub}>
                    Try modifying your search or filter settings.
                  </Text>
                </View>
              ) : (
                <View style={styles.equipmentList}>
                  {filteredEquipment.map((item) => {
                    const isSelected = selectedItems.has(item.id);
                    const selectedState = selectedItems.get(item.id);
                    const isAvailable = item.available_quantity > 0;

                    return (
                      <View
                        key={item.id}
                        style={[
                          styles.equipmentCard,
                          isSelected && styles.equipmentCardSelected,
                          !isAvailable && styles.equipmentCardDisabled,
                        ]}
                      >
                        <Pressable
                          onPress={() => isAvailable && toggleItemSelection(item)}
                          style={styles.equipmentCardMain}
                        >
                          <View
                            style={[
                              styles.checkbox,
                              isSelected && styles.checkboxSelected,
                              !isAvailable && styles.checkboxDisabled,
                            ]}
                          >
                            {isSelected && <Ionicons name="checkmark" size={14} color={AppColors.white} />}
                          </View>

                          <View style={styles.equipmentMeta}>
                            <View style={styles.equipmentTitleRow}>
                              <Text
                                style={[
                                  styles.equipmentName,
                                  !isAvailable && styles.equipmentNameDisabled,
                                ]}
                                numberOfLines={1}
                              >
                                {item.name}
                              </Text>
                              {item.product_id ? (
                                <View style={styles.tagBadge}>
                                  <Text style={styles.tagBadgeText}>{item.product_id}</Text>
                                </View>
                              ) : null}
                            </View>

                            {(item.brand || item.model) && (
                              <Text style={styles.equipmentSub} numberOfLines={1}>
                                {[item.brand, item.model].filter(Boolean).join(' • ')}
                              </Text>
                            )}

                            <View style={styles.equipmentStockRow}>
                              <View
                                style={[
                                  styles.stockDot,
                                  { backgroundColor: isAvailable ? '#16A34A' : '#DC2626' },
                                ]}
                              />
                              <Text style={styles.equipmentStockText}>
                                {item.available_quantity} of {item.total_quantity} available
                              </Text>
                            </View>
                          </View>
                        </Pressable>

                        {/* Quantity Stepper (visible when selected) */}
                        {isSelected && selectedState && (
                          <View style={styles.itemStepperRow}>
                            <Text style={styles.stepperLabel}>Requested Qty:</Text>
                            <View style={styles.stepperControls}>
                              <Pressable
                                onPress={() => updateItemQuantity(item.id, -1)}
                                style={({ pressed }) => [
                                  styles.stepperBtn,
                                  pressed && styles.stepperBtnPressed,
                                ]}
                                hitSlop={6}
                              >
                                <Ionicons name="remove" size={16} color={AppColors.navy} />
                              </Pressable>

                              <Text style={styles.stepperCount}>{selectedState.quantity}</Text>

                              <Pressable
                                onPress={() => updateItemQuantity(item.id, 1)}
                                style={({ pressed }) => [
                                  styles.stepperBtn,
                                  pressed && styles.stepperBtnPressed,
                                  selectedState.quantity >= item.available_quantity &&
                                    styles.stepperBtnDisabled,
                                ]}
                                disabled={selectedState.quantity >= item.available_quantity}
                                hitSlop={6}
                              >
                                <Ionicons name="add" size={16} color={AppColors.navy} />
                              </Pressable>

                              <Pressable
                                onPress={() => removeItem(item.id)}
                                style={({ pressed }) => [
                                  styles.removeBtn,
                                  pressed && styles.removeBtnPressed,
                                ]}
                                hitSlop={6}
                              >
                                <Ionicons name="trash-outline" size={14} color="#EF4444" />
                              </Pressable>
                            </View>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}

              <Button
                title={
                  selectedItems.size === 0
                    ? 'Select Equipment to Continue'
                    : `Proceed with ${selectedItems.size} Selected Item(s)`
                }
                variant="primary"
                onPress={handleNextStep2}
                disabled={selectedItems.size === 0}
                style={styles.actionBtn}
              />
            </View>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              STEP 3: SCHEDULE & LOAN DETAILS
             ═══════════════════════════════════════════════════════════════════ */}
          {currentStep === 3 && (
            <View style={styles.stepContainer}>
              <View style={styles.sectionHeaderBox}>
                <Ionicons name="calendar-outline" size={22} color={AppColors.navy} />
                <Text style={styles.sectionHeading}>Loan Duration & Schedule</Text>
              </View>

              {/* Quick Duration Presets */}
              <Text style={styles.fieldLabel}>Loan Duration Preset</Text>
              <View style={styles.durationPresetsGrid}>
                {DURATION_PRESETS.map((preset) => {
                  const isMatch = !customDaysActive && loanPeriodDays === String(preset.days);
                  return (
                    <Pressable
                      key={preset.days}
                      onPress={() => {
                        setLoanPeriodDays(String(preset.days));
                        setCustomDaysActive(false);
                      }}
                      style={[styles.presetCard, isMatch && styles.presetCardActive]}
                    >
                      <Text style={[styles.presetDaysNumber, isMatch && styles.presetTextActive]}>
                        {preset.days} {preset.days === 1 ? 'Day' : 'Days'}
                      </Text>
                      <Text style={[styles.presetLabel, isMatch && styles.presetTextActive]}>
                        {preset.label.split('(')[1]?.replace(')', '') || 'Preset'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                onPress={() => setCustomDaysActive(true)}
                style={[styles.customDaysBtn, customDaysActive && styles.customDaysBtnActive]}
              >
                <Ionicons
                  name={customDaysActive ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={customDaysActive ? AppColors.navy : '#64748B'}
                />
                <Text
                  style={[
                    styles.customDaysBtnText,
                    customDaysActive && styles.customDaysBtnTextActive,
                  ]}
                >
                  Custom Duration
                </Text>
              </Pressable>

              {customDaysActive && (
                <Input
                  label="Number of Days *"
                  keyboardType="numeric"
                  value={loanPeriodDays}
                  onChangeText={setLoanPeriodDays}
                  placeholder="e.g. 5"
                />
              )}

              {/* Computed Schedule Card */}
              <View style={styles.datesCard}>
                <View style={styles.dateCardHeader}>
                  <Ionicons name="time-outline" size={18} color={AppColors.navy} />
                  <Text style={styles.datesHeader}>TRANSACTION TIMELINE</Text>
                </View>

                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>Borrow / Issue Date</Text>
                  <Text style={styles.dateValue}>{formatDate(today)} (Today)</Text>
                </View>

                <View style={styles.dateDivider} />

                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>Expected Return Deadline</Text>
                  <Text style={styles.dateValueBold}>{formatDate(returnDate)}</Text>
                </View>
                <Text style={styles.dateHint}>
                  Items returned after {formatDate(returnDate)} will be flagged automatically as Overdue.
                </Text>
              </View>

              {/* Handling / Condition Notes */}
              <Input
                label="Equipment Condition / Accessories Handed"
                placeholder="e.g. Handed with power cable and calibration test leads in working order"
                value={handlingNotes}
                onChangeText={setHandlingNotes}
                multiline
                numberOfLines={2}
              />

              <Button
                title="Review & Approve Transaction"
                variant="primary"
                onPress={handleNextStep3}
                style={styles.actionBtn}
              />
            </View>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              STEP 4: REVIEW & APPROVE TRANSACTION
             ═══════════════════════════════════════════════════════════════════ */}
          {currentStep === 4 && (
            <View style={styles.stepContainer}>
              {/* Approval Header Card */}
              <View style={styles.approvalBanner}>
                <View style={styles.approvalStatusPill}>
                  <View style={styles.approvalStatusDot} />
                  <Text style={styles.approvalStatusText}>Ready for Approval</Text>
                </View>
                <Text style={styles.approvalBannerTitle}>Final Transaction Review</Text>
                <Text style={styles.approvalBannerSub}>
                  Verify all details before authorizing release of laboratory equipment.
                </Text>
              </View>

              {/* Inline Error Banner if present */}
              {submissionError && (
                <View style={styles.errorBannerBox}>
                  <Ionicons name="alert-circle" size={18} color="#DC2626" />
                  <Text style={styles.errorBannerText}>{submissionError}</Text>
                </View>
              )}

              {/* Organized Summary Card */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>TRANSACTION DETAILS</Text>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Borrower</Text>
                  <View style={styles.summaryValueCol}>
                    <Text style={styles.summaryValueBold}>{borrowerName}</Text>
                    <Text style={styles.summaryValueSub}>
                      {borrowerRole} • ID: {borrowerId}
                    </Text>
                    {department.trim() ? (
                      <Text style={styles.summaryValueSub}>{department}</Text>
                    ) : null}
                  </View>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Purpose</Text>
                  <Text style={styles.summaryValueText} numberOfLines={2}>
                    {purpose}
                  </Text>
                </View>

                <View style={styles.summaryDivider} />

                <Text style={styles.summaryTitle}>EQUIPMENT TO ISSUE ({selectedItems.size} items)</Text>
                <View style={styles.summaryItemsTable}>
                  {Array.from(selectedItems.values()).map((s) => (
                    <View key={s.equipment.id} style={styles.summaryItemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.summaryItemName}>{s.equipment.name}</Text>
                        {s.equipment.product_id ? (
                          <Text style={styles.summaryItemTag}>{s.equipment.product_id}</Text>
                        ) : null}
                      </View>
                      <View style={styles.summaryItemQtyBadge}>
                        <Text style={styles.summaryItemQtyText}>×{s.quantity}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Schedule</Text>
                  <View style={styles.summaryValueCol}>
                    <Text style={styles.summaryValueText}>
                      Borrowed: {formatDate(today)}
                    </Text>
                    <Text style={styles.summaryDueHighlight}>
                      Due: {formatDate(returnDate)} ({daysNum} {daysNum === 1 ? 'day' : 'days'})
                    </Text>
                  </View>
                </View>
              </View>

              {/* Approving Authority Section */}
              <View style={styles.approverSection}>
                <Text style={styles.sectionTitle}>Authorizing Officer</Text>
                <Text style={styles.approverInstruction}>
                  Select or specify the staff member authorizing this loan:
                </Text>

                {activeStaff.length > 0 && (
                  <View style={styles.staffChipsRow}>
                    {activeStaff.map((st) => {
                      const isSelected = authorizedBy === st.full_name;
                      return (
                        <Pressable
                          key={st.id}
                          onPress={() => setAuthorizedBy(st.full_name)}
                          style={[styles.staffChip, isSelected && styles.staffChipSelected]}
                        >
                          <Ionicons
                            name={isSelected ? 'checkmark-circle' : 'person-outline'}
                            size={14}
                            color={isSelected ? '#FFFFFF' : AppColors.navy}
                          />
                          <Text style={[styles.staffChipText, isSelected && styles.staffChipTextSelected]}>
                            {st.full_name} ({st.role})
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}

                <Input
                  label="Authorizing Officer Name"
                  placeholder="e.g. Admin Cruz"
                  value={authorizedBy}
                  onChangeText={setAuthorizedBy}
                />

                <Input
                  label="Authorization Remarks / Notes (Optional)"
                  placeholder="e.g. Inspected and tested with student; borrower briefed on lab rules."
                  value={approvalNotes}
                  onChangeText={setApprovalNotes}
                />
              </View>

              {/* Photo Proof Section */}
              <View style={styles.photoSection}>
                <View style={styles.photoHeaderRow}>
                  <Text style={styles.sectionTitle}>Handover Photo Proof (Optional)</Text>
                  {photoUri && (
                    <Pressable onPress={() => setPhotoUri(null)}>
                      <Text style={styles.photoClearLink}>Remove</Text>
                    </Pressable>
                  )}
                </View>

                {photoUri ? (
                  <View style={styles.photoPreviewContainer}>
                    <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                    <Pressable
                      onPress={handleCapturePhoto}
                      style={styles.changePhotoBadge}
                    >
                      <Ionicons name="camera" size={14} color="#FFFFFF" />
                      <Text style={styles.changePhotoText}>Change</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.cameraBox}>
                    <Ionicons name="camera-outline" size={32} color={AppColors.navy} />
                    <Text style={styles.cameraTitle}>Attach Physical Proof</Text>
                    <Text style={styles.cameraText}>
                      Capture a photo of the equipment with the borrower during handover.
                    </Text>
                    <Pressable
                      onPress={handleCapturePhoto}
                      style={({ pressed }) => [
                        styles.openCameraBtn,
                        pressed && styles.openCameraBtnPressed,
                      ]}
                    >
                      <Ionicons name="camera" size={16} color={AppColors.navy} />
                      <Text style={styles.openCameraBtnText}>Take Photo / Browse</Text>
                    </Pressable>
                  </View>
                )}
              </View>

              {/* Borrower Verification & Acknowledgment Checkbox */}
              <Pressable
                onPress={() => {
                  setAcknowledgedPolicy((prev) => !prev);
                  if (submissionError) setSubmissionError(null);
                }}
                style={styles.acknowledgmentBox}
              >
                <View
                  style={[
                    styles.checkbox,
                    acknowledgedPolicy && styles.checkboxSelected,
                  ]}
                >
                  {acknowledgedPolicy && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                </View>
                <Text style={styles.acknowledgmentText}>
                  I confirm that the borrower presented official identification, the equipment units were inspected, and the borrower agrees to laboratory accountability.
                </Text>
              </Pressable>

              {/* Approve Transaction Button */}
              <Button
                title={submitting ? 'Approving Transaction...' : 'Approve & Issue Equipment'}
                variant="primary"
                onPress={handleApprovePress}
                loading={submitting}
                disabled={submitting}
                style={styles.actionBtn}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ═══════════════════════════════════════════════════════════════════════
          CONFIRMATION MODAL (Cross-Platform)
         ═══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showConfirmModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.confirmModalCard}>
            <View style={styles.confirmIconCircle}>
              <Ionicons name="shield-checkmark-outline" size={32} color={AppColors.navy} />
            </View>

            <Text style={styles.confirmModalTitle}>Confirm Equipment Issue</Text>
            <Text style={styles.confirmModalSub}>
              Are you sure you want to approve and record this borrow transaction?
            </Text>

            <View style={styles.confirmDetailsBox}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Borrower</Text>
                <Text style={styles.receiptValue}>{borrowerName} ({borrowerId})</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Total Equipment</Text>
                <Text style={styles.receiptValue}>{totalSelectedUnits} unit(s) ({selectedItems.size} type(s))</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Return Deadline</Text>
                <Text style={styles.receiptValueDue}>{formatDate(returnDate)} ({daysNum} days)</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Authorizer</Text>
                <Text style={styles.receiptValue}>{authorizedBy.trim() || 'Admin Cruz'}</Text>
              </View>
            </View>

            <View style={styles.modalActionButtons}>
              <Button
                title={submitting ? 'Approving...' : 'Confirm & Issue Equipment'}
                variant="primary"
                onPress={executeApproveTransaction}
                loading={submitting}
                disabled={submitting}
              />
              <Button
                title="Review Details"
                variant="secondary"
                onPress={() => setShowConfirmModal(false)}
                disabled={submitting}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════
          APPROVAL SUCCESS RECEIPT MODAL
         ═══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={approvedSuccessData !== null}
        animationType="fade"
        transparent
        onRequestClose={() => {}}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.successModalCard}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark" size={36} color="#FFFFFF" />
            </View>

            <Text style={styles.successModalTitle}>Transaction Approved!</Text>
            <Text style={styles.successModalSub}>
              The equipment items have been officially checked out and assigned to the borrower.
            </Text>

            {approvedSuccessData && (
              <View style={styles.receiptBox}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Transaction Code</Text>
                  <View style={styles.codeBadge}>
                    <Text style={styles.codeBadgeText}>
                      {approvedSuccessData.transactionCode}
                    </Text>
                  </View>
                </View>

                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Borrower</Text>
                  <Text style={styles.receiptValue}>{approvedSuccessData.borrowerName}</Text>
                </View>

                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Total Units</Text>
                  <Text style={styles.receiptValue}>{approvedSuccessData.totalItems} unit(s)</Text>
                </View>

                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Due Date</Text>
                  <Text style={styles.receiptValueDue}>{approvedSuccessData.dueDateStr}</Text>
                </View>

                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Authorized By</Text>
                  <Text style={styles.receiptValue}>{approvedSuccessData.approver}</Text>
                </View>
              </View>
            )}

            <View style={styles.modalActionButtons}>
              <Button
                title="View in Records"
                variant="primary"
                onPress={() => {
                  const code = approvedSuccessData?.transactionCode;
                  setApprovedSuccessData(null);
                  if (code) {
                    router.replace(ROUTES.RECORD_DETAIL(code) as any);
                  } else {
                    router.replace(ROUTES.RECORDS as any);
                  }
                }}
              />

              <Button
                title="Back to Borrow List"
                variant="secondary"
                onPress={() => {
                  setApprovedSuccessData(null);
                  router.replace(ROUTES.BORROW as any);
                }}
              />

              <Pressable onPress={handleResetForm} style={styles.newLoanLink}>
                <Text style={styles.newLoanLinkText}>+ Create Another Loan</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════
          SCHEDULE / DATE OF USE DROPDOWN MODAL
         ═══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showScheduleDropdown}
        animationType="fade"
        transparent
        onRequestClose={() => setShowScheduleDropdown(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowScheduleDropdown(false)}>
          <Pressable style={styles.dropdownModalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.dropdownModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="time-outline" size={20} color={AppColors.navy} />
                <Text style={styles.dropdownModalTitle}>Select Laboratory Schedule</Text>
              </View>
              <Pressable onPress={() => setShowScheduleDropdown(false)} hitSlop={8}>
                <Ionicons name="close" size={20} color="#64748B" />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              {SCHEDULE_PRESETS.map((item) => {
                const isSelected =
                  item.value === '__custom__'
                    ? isCustomSchedule
                    : !isCustomSchedule && scheduleDate === item.value;

                return (
                  <Pressable
                    key={item.label}
                    onPress={() => {
                      if (item.value === '__custom__') {
                        setIsCustomSchedule(true);
                        if (!customScheduleText) {
                          setCustomScheduleText('Oct 16, 2026 8:00 AM – 11:30 AM');
                          setScheduleDate('Oct 16, 2026 8:00 AM – 11:30 AM');
                        } else {
                          setScheduleDate(customScheduleText);
                        }
                      } else {
                        setIsCustomSchedule(false);
                        setScheduleDate(item.value);
                      }
                      setShowScheduleDropdown(false);
                    }}
                    style={[
                      styles.dropdownOption,
                      isSelected && styles.dropdownOptionSelected,
                    ]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={isSelected ? AppColors.navy : '#64748B'}
                    />
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        isSelected && styles.dropdownOptionTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={18} color={AppColors.navy} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 48,
  },
  stepContainer: {
    width: '100%',
  },
  actionBtn: {
    marginTop: 24,
  },
  sectionHeaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.text,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.text,
    marginBottom: 8,
  },
  roleChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  roleChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  roleChipSelected: {
    backgroundColor: AppColors.navy,
    borderColor: AppColors.navy,
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  roleChipTextSelected: {
    color: '#FFFFFF',
  },

  // Step 2 Styles
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: AppColors.text,
    padding: 0,
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  filterTabActive: {
    backgroundColor: AppColors.navy,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  selectedCountBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  selectedCountBannerText: {
    fontSize: 12,
    color: AppColors.navy,
  },
  centerContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  emptyItemsBox: {
    paddingVertical: 36,
    alignItems: 'center',
    gap: 6,
  },
  emptyItemsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.text,
  },
  emptyItemsSub: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  equipmentList: {
    gap: 10,
    marginBottom: 16,
  },
  equipmentCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  equipmentCardSelected: {
    backgroundColor: '#F0F9FF',
    borderColor: AppColors.navy,
  },
  equipmentCardDisabled: {
    opacity: 0.5,
    backgroundColor: AppColors.background,
  },
  equipmentCardMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
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
    marginTop: 2,
  },
  checkboxSelected: {
    backgroundColor: AppColors.navy,
    borderColor: AppColors.navy,
  },
  checkboxDisabled: {
    backgroundColor: AppColors.border,
    borderColor: '#CBD5E1',
  },
  equipmentMeta: {
    flex: 1,
    gap: 2,
  },
  equipmentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  equipmentName: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.text,
    flex: 1,
  },
  equipmentNameDisabled: {
    color: AppColors.textMuted,
  },
  tagBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: AppColors.navy,
  },
  equipmentSub: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  equipmentStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  equipmentStockText: {
    fontSize: 11,
    color: AppColors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  itemStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    marginTop: 10,
  },
  stepperLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnPressed: {
    backgroundColor: AppColors.border,
  },
  stepperBtnDisabled: {
    opacity: 0.4,
  },
  stepperCount: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.text,
    minWidth: 18,
    textAlign: 'center',
  },
  removeBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  removeBtnPressed: {
    backgroundColor: '#FECACA',
  },

  // Step 3 Styles
  durationPresetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  presetCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    gap: 2,
  },
  presetCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: AppColors.navy,
  },
  presetDaysNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.text,
  },
  presetLabel: {
    fontSize: 11,
    color: AppColors.textSecondary,
  },
  presetTextActive: {
    color: AppColors.navy,
  },
  customDaysBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    paddingVertical: 4,
  },
  customDaysBtnActive: {
    opacity: 1,
  },
  customDaysBtnText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  customDaysBtnTextActive: {
    color: AppColors.navy,
  },
  datesCard: {
    backgroundColor: AppColors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 16,
    gap: 10,
    marginBottom: 16,
  },
  dateCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  datesHeader: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.chip,
    fontWeight: AppTypography.weight.bold,
    color: AppColors.textSecondary,
    letterSpacing: 0.8,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateLabel: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.supporting,
    color: AppColors.textSecondary,
  },
  dateValue: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.supporting,
    fontWeight: AppTypography.weight.semibold,
    color: AppColors.text,
  },
  dateValueBold: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.supporting,
    fontWeight: AppTypography.weight.bold,
    color: AppColors.navy,
  },
  dateDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dateHint: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 2,
  },

  // Step 4 Styles
  approvalBanner: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
  },
  approvalStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  approvalStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  approvalStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  approvalBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.text,
  },
  approvalBannerSub: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  errorBannerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
    flex: 1,
  },
  summaryCard: {
    backgroundColor: AppColors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 16,
    gap: 10,
    marginBottom: 16,
  },
  summaryTitle: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.chip,
    fontWeight: AppTypography.weight.bold,
    color: AppColors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  summaryLabel: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.small,
    color: AppColors.textSecondary,
    width: 80,
  },
  summaryValueCol: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 2,
  },
  summaryValueBold: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.text,
    textAlign: 'right',
  },
  summaryValueSub: {
    fontSize: 11,
    color: AppColors.textSecondary,
    textAlign: 'right',
  },
  summaryValueText: {
    fontSize: 13,
    fontWeight: '500',
    color: AppColors.text,
    flex: 1,
    textAlign: 'right',
  },
  summaryDueHighlight: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.navy,
    textAlign: 'right',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: AppColors.border,
    marginVertical: 4,
  },
  summaryItemsTable: {
    gap: 6,
  },
  summaryItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  summaryItemName: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.text,
  },
  summaryItemTag: {
    fontSize: 10,
    color: AppColors.textSecondary,
  },
  summaryItemQtyBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  summaryItemQtyText: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.navy,
  },
  approverSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.text,
    marginBottom: 4,
  },
  approverInstruction: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginBottom: 10,
  },
  staffChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  staffChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  staffChipSelected: {
    backgroundColor: AppColors.navy,
    borderColor: AppColors.navy,
  },
  staffChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.text,
  },
  staffChipTextSelected: {
    color: '#FFFFFF',
  },
  photoSection: {
    marginBottom: 16,
  },
  photoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  photoClearLink: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  cameraBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    gap: 6,
  },
  cameraTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.text,
  },
  cameraText: {
    fontSize: 11,
    color: AppColors.textSecondary,
    textAlign: 'center',
    maxWidth: 260,
  },
  openCameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop: 6,
  },
  openCameraBtnPressed: {
    backgroundColor: '#F1F5F9',
  },
  openCameraBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.navy,
  },
  photoPreviewContainer: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  changePhotoBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  changePhotoText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  acknowledgmentBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  acknowledgmentText: {
    fontSize: 12,
    color: AppColors.text,
    flex: 1,
    lineHeight: 18,
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  confirmIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  confirmModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  confirmModalSub: {
    fontSize: 12,
    color: AppColors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  confirmDetailsBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 8,
    marginBottom: 18,
  },
  successModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  successModalSub: {
    fontSize: 13,
    color: AppColors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  receiptBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 10,
    marginBottom: 20,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  receiptValue: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.text,
  },
  receiptValueDue: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.navy,
  },
  codeBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  codeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.navy,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  modalActionButtons: {
    width: '100%',
    gap: 10,
  },
  newLoanLink: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newLoanLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.navy,
  },
  // ─── Row layout for side-by-side fields ─────────────────────────────────────
  rowFields: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  rowFieldFlex: {
    flex: 2,
  },
  rowFieldShort: {
    flex: 1,
  },
  // ─── Schedule Dropdown & Presets ───────────────────────────────────────────
  scheduleFieldGroup: {
    marginBottom: 16,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dropdownTriggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dropdownTriggerText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.text,
  },
  dropdownTriggerPlaceholder: {
    color: '#94A3B8',
    fontWeight: '400',
  },
  dropdownModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
    marginBottom: 8,
  },
  dropdownModalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.text,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  dropdownOptionSelected: {
    backgroundColor: '#EFF6FF',
  },
  dropdownOptionText: {
    fontSize: 13,
    color: AppColors.text,
    flex: 1,
  },
  dropdownOptionTextSelected: {
    color: AppColors.navy,
    fontWeight: '700',
  },
  // ─── Quick Presets Row & Chips ─────────────────────────────────────────────
  quickChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
    marginBottom: 10,
  },
  quickChip: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickChipActive: {
    backgroundColor: AppColors.navy,
    borderColor: AppColors.navy,
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  quickChipTextActive: {
    color: '#FFFFFF',
  },
});
