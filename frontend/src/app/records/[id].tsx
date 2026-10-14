import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppColors } from '../../constants/colors';
import { recordService } from '../../services/recordService';
import { ROUTES } from '../../routing/routes';
import { formatDateDisplay } from '../../utils/date';
import { useGuardedPress } from '../../utils/guards';
import type { TransactionSummary } from '../../types';

// Equipment condition options matching the physical borrower's slip
const CONDITION_OPTIONS = [
  { value: '1', label: '1 — Good Condition', color: '#16A34A', icon: 'checkmark-circle-outline' as const },
  { value: '2', label: '2 — For Replacement', color: '#D97706', icon: 'refresh-circle-outline' as const },
  { value: '3', label: '3 — For Repair', color: '#DC2626', icon: 'construct-outline' as const },
  { value: '4', label: '4 — Consumable', color: '#7C3AED', icon: 'flask-outline' as const },
];

export default function TransactionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [transaction, setTransaction] = useState<TransactionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Return Modal states
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [selectedCondition, setSelectedCondition] = useState('1');
  const [returnRemarks, setReturnRemarks] = useState('All units returned in good working condition.');
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const fetchDetail = useCallback(
    async (isPullToRefresh = false) => {
      if (!id) return;
      try {
        if (isPullToRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);
        const res = await recordService.getTransactionByCode(id);
        if (res.success && res.data) {
          setTransaction(res.data);
          // Set active items for return
          const unreturned = res.data.items.filter((i) => i.status !== 'returned').map((i) => i.id);
          setSelectedItemIds(new Set(unreturned.length > 0 ? unreturned : res.data.items.map((i) => i.id)));
        } else {
          setError(res.error || 'Transaction not found.');
        }
      } catch (err: any) {
        setError(err?.message || 'Error loading transaction details.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const openReturnModal = () => {
    if (!transaction) return;
    const unreturned = transaction.items.filter((i) => i.status !== 'returned').map((i) => i.id);
    setSelectedItemIds(new Set(unreturned.length > 0 ? unreturned : transaction.items.map((i) => i.id)));
    setSelectedCondition('1');
    setReturnRemarks('All units returned in good working condition.');
    setReturnError(null);
    setShowReturnModal(true);
  };

  const closeReturnModal = () => {
    if (submittingReturn) return;
    setShowReturnModal(false);
    setReturnError(null);
  };

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

  const executeReturn = async () => {
    if (!transaction || selectedItemIds.size === 0) return;
    try {
      setSubmittingReturn(true);
      setReturnError(null);

      const conditionLabel = CONDITION_OPTIONS.find((c) => c.value === selectedCondition)?.label ?? '1 — Good Condition';
      const compiledRemarks = [
        `Condition: ${conditionLabel}`,
        returnRemarks.trim() ? `Remarks: ${returnRemarks.trim()}` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      const res = await recordService.processReturn({
        transaction_code: transaction.transaction_code,
        record_ids: Array.from(selectedItemIds),
        return_date: new Date().toISOString().split('T')[0],
        return_remarks: compiledRemarks,
      });

      if (res.success) {
        setShowReturnModal(false);
        setShowSuccessModal(true);
        // Refresh details
        await fetchDetail(true);
      } else {
        setReturnError(res.error || 'Failed to process return.');
      }
    } catch (err: any) {
      setReturnError(err?.message || 'An error occurred during return.');
    } finally {
      setSubmittingReturn(false);
    }
  };

  const handleBackPress = useGuardedPress(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(ROUTES.RECORDS as any);
    }
  }, 400);

  const renderBadge = (status?: TransactionSummary['status']) => {
    let bg = '#DBEAFE';
    let text = '#2563EB';
    let label = '• Borrowed';

    if (status === 'overdue') {
      bg = '#FEE2E2';
      text = '#DC2626';
      label = '• Overdue';
    } else if (status === 'returned') {
      bg = '#DCFCE7';
      text = '#16A34A';
      label = '• Returned';
    }

    return (
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Text style={[styles.badgeText, { color: text }]}>{label}</Text>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction Detail</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={AppColors.navy} />
          <Text style={styles.loadingText}>Loading transaction...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !transaction) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction Detail</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color="#DC2626" />
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorSubtitle}>{error || 'Transaction not found.'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchDetail()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isReturned = transaction.status === 'returned';
  const unreturnedItems = transaction.items.filter((i) => i.status !== 'returned');

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Detail</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchDetail(true)}
            colors={[AppColors.navy]}
            tintColor={AppColors.navy}
          />
        }
      >
        {/* Header Summary Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.nameContainer}>
              <Text style={styles.borrowerName}>{transaction.borrower_name}</Text>
              <Text style={styles.txnCode}>{transaction.transaction_code}</Text>
            </View>
            {renderBadge(transaction.status)}
          </View>
        </View>

        {/* BORROWER Section */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>BORROWER DETAILS</Text>
          <View style={styles.row}>
            <Text style={styles.fieldLabel}>Student / Staff ID</Text>
            <Text style={styles.fieldValueBold}>{transaction.borrower_id}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.fieldLabel}>Purpose</Text>
            <Text style={styles.fieldValueWrap}>{transaction.purpose || '—'}</Text>
          </View>
        </View>

        {/* ITEMS Section */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>ITEMS BORROWED</Text>
          {transaction.items.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.itemRow,
                index === transaction.items.length - 1 && styles.itemRowLast,
              ]}
            >
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.equipment_name}</Text>
                {item.equipment_brand ? (
                  <Text style={styles.itemSub}>
                    {item.equipment_brand} {item.equipment_model || ''}
                  </Text>
                ) : null}
              </View>
              <View style={{ alignItems: 'flex-end', gap: 2 }}>
                <Text style={styles.itemQty}>×{item.quantity || 1}</Text>
                <View
                  style={[
                    styles.itemStatusPill,
                    { backgroundColor: item.status === 'returned' ? '#DCFCE7' : '#DBEAFE' },
                  ]}
                >
                  <Text
                    style={[
                      styles.itemStatusPillText,
                      { color: item.status === 'returned' ? '#16A34A' : '#2563EB' },
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* TIMELINE Section */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>TIMELINE</Text>
          <View style={styles.row}>
            <Text style={styles.fieldLabel}>Borrowed</Text>
            <Text style={styles.fieldValue}>{formatDateDisplay(transaction.borrow_date)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.fieldLabel}>Due Date</Text>
            <Text
              style={[
                styles.fieldValue,
                transaction.status === 'overdue' && styles.overdueText,
              ]}
            >
              {formatDateDisplay(transaction.due_date)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.fieldLabel}>Returned Date</Text>
            <Text style={[styles.fieldValue, isReturned && styles.returnedText]}>
              {transaction.return_date ? formatDateDisplay(transaction.return_date) : 'Pending Return'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.fieldLabel}>Authorized By</Text>
            <Text style={styles.fieldValue}>{transaction.authorized_by || 'Admin Cruz'}</Text>
          </View>
        </View>

        {/* REMARKS Section */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>REMARKS & NOTES</Text>
          <Text style={styles.remarksText}>
            {transaction.return_remarks ||
              transaction.notes ||
              (isReturned ? 'All items returned in good condition.' : 'No remarks recorded.')}
          </Text>
        </View>

        {/* Action Button for returning items */}
        {!isReturned && (
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.8}
            onPress={openReturnModal}
          >
            <Ionicons name="arrow-undo-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.actionBtnText}>Return Items</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* ─── RETURN MODAL ────────────────────────────────────────────────────── */}
      <Modal
        visible={showReturnModal}
        transparent
        animationType="fade"
        onRequestClose={closeReturnModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Ionicons name="arrow-undo-circle-outline" size={22} color={AppColors.navy} />
                <Text style={styles.modalTitle}>Return Equipment</Text>
              </View>
              <TouchableOpacity onPress={closeReturnModal} hitSlop={8}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {/* Items checklist */}
              <Text style={styles.modalSectionLabel}>Items to Return ({selectedItemIds.size}/{unreturnedItems.length})</Text>
              <View style={styles.itemsBox}>
                {unreturnedItems.map((item) => {
                  const isChecked = selectedItemIds.has(item.id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.modalItemRow}
                      activeOpacity={0.7}
                      onPress={() => toggleItemCheckbox(item.id)}
                    >
                      <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                        {isChecked && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
                      </View>
                      <View style={styles.modalItemText}>
                        <Text style={styles.modalItemName}>{item.equipment_name}</Text>
                        <Text style={styles.modalItemSub}>
                          {item.equipment_brand || 'Standard'} • Qty: {item.quantity || 1}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Condition Options */}
              <Text style={styles.modalSectionLabel}>Condition on Return (Borrower Slip Legend)</Text>
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

              {/* Remarks */}
              <Text style={styles.modalSectionLabel}>Remarks / Inspection Notes</Text>
              <TextInput
                style={styles.remarksInput}
                value={returnRemarks}
                onChangeText={setReturnRemarks}
                placeholder="e.g. Returned clean and tested working..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={2}
              />

              {returnError && (
                <View style={styles.modalErrorBox}>
                  <Ionicons name="alert-circle" size={16} color="#DC2626" />
                  <Text style={styles.modalErrorText}>{returnError}</Text>
                </View>
              )}
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActionButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={closeReturnModal}
                disabled={submittingReturn}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  selectedItemIds.size === 0 && styles.modalBtnDisabled,
                ]}
                onPress={executeReturn}
                disabled={submittingReturn || selectedItemIds.size === 0}
              >
                {submittingReturn ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.modalConfirmText}>Confirm Return</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── SUCCESS RECEIPT MODAL ───────────────────────────────────────────── */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, styles.successModalCard]}>
            <View style={styles.successIconWrap}>
              <Ionicons name="checkmark-circle" size={54} color="#16A34A" />
            </View>
            <Text style={styles.successModalTitle}>Return Completed!</Text>
            <Text style={styles.successModalSub}>
              The items have been officially marked as returned and inventory has been restored.
            </Text>

            <TouchableOpacity
              style={styles.successDoneBtn}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.successDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameContainer: {
    flex: 1,
  },
  borrowerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  txnCode: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  fieldLabel: {
    fontSize: 13,
    color: '#64748B',
    width: 120,
  },
  fieldValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  fieldValueBold: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    textAlign: 'right',
  },
  fieldValueWrap: {
    fontSize: 13,
    color: '#0F172A',
    flex: 1,
    textAlign: 'right',
    lineHeight: 18,
  },
  overdueText: {
    color: '#DC2626',
    fontWeight: '700',
  },
  returnedText: {
    color: '#16A34A',
    fontWeight: '600',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  itemSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  itemQty: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  itemStatusPillText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  remarksText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
  },
  actionBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
    marginBottom: 4,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
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
    maxWidth: 460,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 12,
    marginBottom: 12,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  itemsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    marginBottom: 14,
    gap: 8,
  },
  modalItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  modalItemText: {
    flex: 1,
  },
  modalItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  modalItemSub: {
    fontSize: 11,
    color: '#64748B',
  },
  conditionOptionsList: {
    gap: 6,
    marginBottom: 14,
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
  remarksInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 52,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  modalErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  modalErrorText: {
    fontSize: 12,
    color: '#DC2626',
    flex: 1,
  },
  modalActionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
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
    fontSize: 13,
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
    flexDirection: 'row',
    gap: 6,
  },
  modalBtnDisabled: {
    opacity: 0.5,
  },
  modalConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
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
  successDoneBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 48,
  },
  successDoneText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
