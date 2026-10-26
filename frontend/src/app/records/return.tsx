import { screenStyles } from '../../components/ui/ScreenStyles';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AppTypography } from '../../constants/typography';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { AppColors } from '../../constants/colors';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { recordService } from '../../services/recordService';
import { ROUTES } from '../../routing/routes';
import { formatDateTimeDisplay, getTodayIso } from '../../utils/date';
import { useGuardedPress } from '../../utils/guards';
import type { TransactionSummary } from '../../types';

// Equipment condition options matching the physical borrower's slip
const CONDITION_OPTIONS = [
  { value: '1', label: '1 — Good Condition', color: '#16A34A', icon: 'checkmark-circle-outline' as const },
  { value: '2', label: '2 — For Replacement', color: '#D97706', icon: 'refresh-circle-outline' as const },
  { value: '3', label: '3 — For Repair', color: '#DC2626', icon: 'construct-outline' as const },
  { value: '4', label: '4 — Consumable', color: '#7C3AED', icon: 'flask-outline' as const },
];

export default function ReturnItemScreen() {
  const router = useRouter();
  const { preselectedCode } = useLocalSearchParams<{ preselectedCode?: string }>();

  const [transactions, setTransactions] = useState<TransactionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTxCode, setSelectedTxCode] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  // Form fields
  const [dateTimeReturned, setDateTimeReturned] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('1');
  const [remarks, setRemarks] = useState('All units returned in good working condition.');

  // Modal dialog states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{
    code: string;
    borrower: string;
    itemCount: number;
  } | null>(null);

  const handleSelectTransaction = useCallback((tx: TransactionSummary) => {
    setSelectedTxCode(tx.transaction_code);
    const activeIds = new Set(
      tx.items.filter((i) => i.status !== 'returned').map((i) => i.id)
    );
    setSelectedItemIds(activeIds);
    setErrorMessage(null);
  }, []);

  const fetchActiveTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await recordService.getTransactions('active');
      if (res.success && res.data) {
        setTransactions(res.data);

        // Preselect if passed from detail or route params
        if (preselectedCode) {
          const match = res.data.find((t) => t.transaction_code === preselectedCode);
          if (match) {
            handleSelectTransaction(match);
          }
        }
      } else {
        setTransactions([]);
        setErrorMessage(res.error || 'Failed to fetch active transactions.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to fetch transactions.');
    } finally {
      setLoading(false);
    }
  }, [handleSelectTransaction, preselectedCode]);

  useEffect(() => {
    setDateTimeReturned(formatDateTimeDisplay());
    fetchActiveTransactions();
  }, [fetchActiveTransactions]);

  const toggleItemCheckbox = (itemId: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const selectedTransaction = useMemo(
    () => transactions.find((t) => t.transaction_code === selectedTxCode),
    [transactions, selectedTxCode]
  );

  const unreturnedItems = useMemo(
    () => selectedTransaction?.items.filter((i) => i.status !== 'returned') || [],
    [selectedTransaction]
  );

  const allSelected = unreturnedItems.length > 0 && selectedItemIds.size === unreturnedItems.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(unreturnedItems.map((i) => i.id)));
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      tx.borrower_name.toLowerCase().includes(q) ||
      tx.transaction_code.toLowerCase().includes(q) ||
      tx.borrower_id.toLowerCase().includes(q)
    );
  });

  // Back button handler to always navigate back reliably
  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(ROUTES.RECORDS as any);
    }
  };

  const handleOpenConfirm = useGuardedPress(() => {
    if (!selectedTxCode) {
      setErrorMessage('Please select a transaction to return.');
      return;
    }

    if (selectedItemIds.size === 0) {
      setErrorMessage('Please select at least one item to return.');
      return;
    }

    setErrorMessage(null);
    setShowConfirmModal(true);
  }, 500);

  const executeReturn = async () => {
    if (!selectedTxCode) return;
    try {
      setSubmitting(true);
      setErrorMessage(null);
      const todayIso = getTodayIso();

      const conditionLabel = CONDITION_OPTIONS.find((c) => c.value === selectedCondition)?.label ?? '1 — Good Condition';
      const compiledRemarks = [
        `Condition: ${conditionLabel}`,
        remarks.trim() ? `Remarks: ${remarks.trim()}` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      const res = await recordService.processReturn({
        transaction_code: selectedTxCode,
        record_ids: Array.from(selectedItemIds),
        return_date: todayIso,
        return_remarks: compiledRemarks,
      });

      if (res.success) {
        setShowConfirmModal(false);
        setSuccessInfo({
          code: selectedTxCode,
          borrower: selectedTransaction?.borrower_name || 'Borrower',
          itemCount: selectedItemIds.size,
        });
        setShowSuccessModal(true);
      } else {
        setErrorMessage(res.error || 'Failed to process return.');
        setShowConfirmModal(false);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An error occurred during return.');
      setShowConfirmModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const isButtonDisabled = !selectedTxCode || selectedItemIds.size === 0 || submitting;

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <ScreenHeader variant="detail" title="Return Equipment" onBack={handleBackPress} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {errorMessage && (
            <View style={styles.globalErrorBox}>
              <Ionicons name="alert-circle" size={18} color="#DC2626" />
              <Text style={styles.globalErrorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Section 1: Find Transaction */}
          <Text style={styles.sectionHeading}>1. Find Active Loan</Text>

          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color={AppColors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Borrower name or transaction ID..."
              placeholderTextColor={AppColors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={AppColors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={AppColors.navy} />
              <Text style={styles.loadingText}>Loading active loans...</Text>
            </View>
          ) : filteredTransactions.length === 0 ? (
            <EmptyState message="No active borrow transactions found." style={styles.emptyContainer} />
          ) : (
            <View style={styles.transactionList}>
              {filteredTransactions.map((tx) => {
                const isSelected = selectedTxCode === tx.transaction_code;
                return (
                  <TouchableOpacity
                    key={tx.transaction_code}
                    style={[
                      styles.txCard,
                      isSelected && styles.txCardSelected,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => handleSelectTransaction(tx)}
                  >
                    <View style={styles.radioContainer}>
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                    </View>
                    <View style={styles.txInfo}>
                      <Text style={styles.txBorrower}>{tx.borrower_name}</Text>
                      <Text style={styles.txCode}>{tx.transaction_code}</Text>
                    </View>
                    <StatusBadge status={tx.status} />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Section 2: SELECT ITEMS TO RETURN */}
          {selectedTransaction && (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeadingUpper}>2. SELECT ITEMS TO RETURN</Text>
                {unreturnedItems.length > 1 && (
                  <TouchableOpacity onPress={toggleSelectAll} style={styles.toggleAllBtn}>
                    <Text style={styles.toggleAllText}>
                      {allSelected ? 'Deselect All' : 'Select All'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.itemsCard}>
                {unreturnedItems.map((item, index) => {
                  const isChecked = selectedItemIds.has(item.id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.itemCheckboxRow,
                        index === 0 && { paddingTop: 0 },
                      ]}
                      activeOpacity={0.8}
                      onPress={() => toggleItemCheckbox(item.id)}
                    >
                      <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                        {isChecked && (
                          <Ionicons name="checkmark" size={14} color={AppColors.white} />
                        )}
                      </View>
                      <Text style={styles.itemTitle}>{item.equipment_name}</Text>
                      <Text style={styles.itemQty}>×{item.quantity || 1}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Section 3: EQUIPMENT CONDITION (Borrower Slip Legend) */}
          {selectedTransaction && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeadingUpper}>3. EQUIPMENT CONDITION ON RETURN</Text>
              <View style={styles.conditionOptionsList}>
                {CONDITION_OPTIONS.map((opt) => {
                  const isSelected = selectedCondition === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.conditionCard,
                        isSelected && { borderColor: opt.color, backgroundColor: opt.color + '12' },
                      ]}
                      activeOpacity={0.8}
                      onPress={() => setSelectedCondition(opt.value)}
                    >
                      <View style={[styles.conditionRadio, isSelected && { borderColor: opt.color }]}>
                        {isSelected && <View style={[styles.conditionRadioDot, { backgroundColor: opt.color }]} />}
                      </View>
                      <Ionicons name={opt.icon} size={16} color={isSelected ? opt.color : '#64748B'} />
                      <Text style={[styles.conditionCardText, isSelected && { color: opt.color, fontWeight: '700' }]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Section 4: Date / Time Returned */}
          <View style={styles.sectionBlock}>
            <Text style={styles.fieldLabel}>Date / Time Returned</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={dateTimeReturned}
                onChangeText={setDateTimeReturned}
                placeholder="e.g. Oct 16, 2026 — 14:32"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* Section 5: Condition / Remarks */}
          <View style={styles.sectionBlock}>
            <Text style={styles.fieldLabel}>Inspection Remarks / Notes</Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <TextInput
                style={styles.textArea}
                value={remarks}
                onChangeText={setRemarks}
                placeholder="All units returned in good working condition."
                placeholderTextColor={AppColors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Selection summary hint */}
          {selectedTransaction && (
            <View style={styles.statusHint}>
              <Ionicons
                name={selectedItemIds.size > 0 ? 'checkmark-circle' : 'alert-circle'}
                size={16}
                color={selectedItemIds.size > 0 ? AppColors.green : '#EAB308'}
              />
              <Text style={styles.statusHintText}>
                {selectedItemIds.size > 0
                  ? `${selectedItemIds.size} item(s) selected for return`
                  : 'Select at least one item above to proceed'}
              </Text>
            </View>
          )}

          {/* Bottom Action Button */}
          <Button
            title="Confirm Return"
            disabled={isButtonDisabled}
            onPress={handleOpenConfirm}
            loading={submitting}
            style={styles.confirmBtn}
          />
        </ScrollView>

        {/* ─── CONFIRMATION MODAL (CROSS-PLATFORM) ─────────────────────────── */}
        <Modal
          visible={showConfirmModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowConfirmModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.confirmIconWrap}>
                <Ionicons name="help-circle-outline" size={44} color={AppColors.navy} />
              </View>
              <Text style={styles.modalConfirmTitle}>Confirm Equipment Return</Text>
              <Text style={styles.modalConfirmSub}>
                Are you sure you want to mark {selectedItemIds.size} item(s) as returned for{' '}
                <Text style={{ fontWeight: '700', color: '#0F172A' }}>
                  {selectedTransaction?.borrower_name}
                </Text>
                ? This will officially restore the units to available inventory.
              </Text>

              <View style={styles.modalActionButtons}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setShowConfirmModal(false)}
                  disabled={submitting}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalConfirmBtn}
                  onPress={executeReturn}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalConfirmBtnText}>Confirm Return</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ─── SUCCESS RECEIPT MODAL ───────────────────────────────────────── */}
        <Modal
          visible={showSuccessModal}
          transparent
          animationType="fade"
          onRequestClose={() => {}}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, styles.successModalCard]}>
              <View style={styles.successIconWrap}>
                <Ionicons name="checkmark-circle" size={54} color="#16A34A" />
              </View>
              <Text style={styles.successModalTitle}>Return Completed!</Text>
              <Text style={styles.successModalSub}>
                The equipment items have been marked as returned and inventory has been officially restored.
              </Text>

              {successInfo && (
                <View style={styles.receiptBox}>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Transaction Code</Text>
                    <Text style={styles.receiptValBold}>{successInfo.code}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Borrower</Text>
                    <Text style={styles.receiptVal}>{successInfo.borrower}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Items Returned</Text>
                    <Text style={styles.receiptValBold}>{successInfo.itemCount} unit(s)</Text>
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={styles.successDoneBtn}
                onPress={() => {
                  setShowSuccessModal(false);
                  router.replace(ROUTES.RECORDS as any);
                }}
              >
                <Text style={styles.successDoneText}>Back to Records</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    ...screenStyles.screen,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  globalErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  globalErrorText: {
    fontSize: 13,
    color: '#DC2626',
    flex: 1,
  },
  sectionHeading: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.body,
    fontWeight: AppTypography.weight.bold,
    color: AppColors.text,
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeadingUpper: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.chip,
    fontWeight: AppTypography.weight.bold,
    color: AppColors.textSecondary,
    letterSpacing: 0.8,
  },
  toggleAllBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  toggleAllText: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.small,
    fontWeight: AppTypography.weight.semibold,
    color: AppColors.navy,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.body,
    color: AppColors.text,
  },
  transactionList: {
    marginBottom: 16,
    gap: 8,
  },
  txCard: {
    ...screenStyles.card,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  txCardSelected: {
    borderColor: AppColors.text,
    backgroundColor: AppColors.background,
  },
  radioContainer: {
    marginRight: 10,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: AppColors.text,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AppColors.text,
  },
  txInfo: {
    flex: 1,
  },
  txBorrower: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.body,
    fontWeight: AppTypography.weight.bold,
    color: AppColors.text,
  },
  txCode: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.chip,
    color: AppColors.textMuted,
    marginTop: 1,
  },
  sectionBlock: {
    marginBottom: 18,
  },
  itemsCard: {
    ...screenStyles.card,
    padding: 14,
    gap: 12,
  },
  itemCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: AppColors.text,
    borderColor: AppColors.text,
  },
  itemTitle: {
    flex: 1,
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.body,
    fontWeight: AppTypography.weight.semibold,
    color: AppColors.text,
  },
  itemQty: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.body,
    fontWeight: AppTypography.weight.bold,
    color: AppColors.textSecondary,
  },
  conditionOptionsList: {
    gap: 6,
    marginTop: 8,
  },
  conditionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#FAFAFA',
  },
  conditionRadio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  conditionRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  conditionCardText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  fieldLabel: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.supporting,
    fontWeight: AppTypography.weight.semibold,
    color: AppColors.text,
    marginBottom: 6,
  },
  inputContainer: {
    backgroundColor: AppColors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 12,
  },
  textInput: {
    height: 44,
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.body,
    color: AppColors.text,
  },
  textAreaContainer: {
    paddingVertical: 8,
  },
  textArea: {
    minHeight: 65,
    fontSize: 14,
    color: '#0F172A',
  },
  statusHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  statusHintText: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.small,
    color: AppColors.textSecondary,
    fontWeight: AppTypography.weight.medium,
  },
  confirmBtn: { marginTop: 4 },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.supporting,
    color: AppColors.textSecondary,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
  },

  // ─── Modal Styles ──────────────────────────────────────────────────────────
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
    borderRadius: 16,
    padding: 24,
  },
  confirmIconWrap: {
    alignItems: 'center',
    marginBottom: 10,
  },
  modalConfirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalConfirmSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalActionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  modalConfirmBtn: {
    flex: 2,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // ─── Success Modal Styles ──────────────────────────────────────────────────
  successModalCard: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  successIconWrap: {
    marginBottom: 10,
  },
  successModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#16A34A',
    marginBottom: 6,
  },
  successModalSub: {
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 8,
    marginBottom: 18,
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
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 40,
  },
  successDoneText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
