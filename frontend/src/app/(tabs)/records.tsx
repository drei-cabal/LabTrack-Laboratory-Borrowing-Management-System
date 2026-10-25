import { AppTypography } from '../../constants/typography';
import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AppColors } from '../../constants/colors';
import { EmptyState } from '../../components/ui/EmptyState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { TabPageLayout, tabPageStyles } from '../../components/ui/TabPageLayout';
import { FilterChips } from '../../components/ui/FilterChips';
import { Fab } from '../../components/ui/Fab';
import { ScreenHeader, ScreenHeaderIconAction } from '../../components/ui/ScreenHeader';
import { useRecords } from '../../hooks/useRecords';
import { ROUTES } from '../../routing/routes';
import { formatDateDisplay } from '../../utils/date';
import { useGuardedPress } from '../../utils/guards';
import type { TransactionSummary } from '../../types';

type FilterType = 'all' | 'borrowed' | 'returned' | 'overdue';

const FILTER_TABS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'borrowed', label: 'Borrowed' },
  { key: 'returned', label: 'Returned' },
  { key: 'overdue', label: 'Overdue' },
];

// Equipment condition options matching the physical borrower's slip
const CONDITION_OPTIONS = [
  { value: '1', label: '1 — Good Condition', color: '#16A34A', icon: 'checkmark-circle-outline' as const },
  { value: '2', label: '2 — For Replacement', color: '#D97706', icon: 'refresh-circle-outline' as const },
  { value: '3', label: '3 — For Repair', color: '#DC2626', icon: 'construct-outline' as const },
  { value: '4', label: '4 — Consumable', color: '#7C3AED', icon: 'flask-outline' as const },
];

export default function RecordsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<TextInput>(null);

  const { transactions, loading, refreshing, refresh, processReturn } = useRecords(filter);

  // Return Modal states
  const [returnModalTx, setReturnModalTx] = useState<TransactionSummary | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [selectedCondition, setSelectedCondition] = useState<string>('1');
  const [returnRemarks, setReturnRemarks] = useState('All units returned in good working condition.');
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);

  // Success Receipt Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successTx, setSuccessTx] = useState<TransactionSummary | null>(null);

  // Client-side quick filter for fast response
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Status filter
      if (filter !== 'all') {
        if (tx.status !== filter) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchBorrower = tx.borrower_name.toLowerCase().includes(q);
        const matchCode = tx.transaction_code.toLowerCase().includes(q);
        const matchId = tx.borrower_id.toLowerCase().includes(q);
        const matchItems = tx.items.some((i) => i.equipment_name.toLowerCase().includes(q));
        return matchBorrower || matchCode || matchId || matchItems;
      }
      return true;
    });
  }, [transactions, filter, searchQuery]);

  const handleCardPress = useGuardedPress((tx: TransactionSummary) => {
    router.push(ROUTES.RECORD_DETAIL(tx.transaction_code) as any);
  }, 400);

  const handleReturnPress = useGuardedPress(() => {
    router.push(ROUTES.RECORD_RETURN as any);
  }, 500);

  const openReturnModal = (tx: TransactionSummary) => {
    setReturnModalTx(tx);
    // Preselect unreturned items
    const unreturned = tx.items.filter((i) => i.status !== 'returned').map((i) => i.id);
    setSelectedItemIds(new Set(unreturned.length > 0 ? unreturned : tx.items.map((i) => i.id)));
    setSelectedCondition('1');
    setReturnRemarks('All units returned in good working condition.');
    setReturnError(null);
  };

  const closeReturnModal = () => {
    if (submittingReturn) return;
    setReturnModalTx(null);
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
    if (!returnModalTx || selectedItemIds.size === 0) return;
    setSubmittingReturn(true);
    setReturnError(null);

    const conditionLabel = CONDITION_OPTIONS.find((c) => c.value === selectedCondition)?.label ?? '1 — Good Condition';
    const compiledRemarks = [
      `Condition: ${conditionLabel}`,
      returnRemarks.trim() ? `Remarks: ${returnRemarks.trim()}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    try {
      const success = await processReturn({
        transaction_code: returnModalTx.transaction_code,
        record_ids: Array.from(selectedItemIds),
        return_date: new Date().toISOString().split('T')[0],
        return_remarks: compiledRemarks,
      });

      if (success) {
        setSuccessTx(returnModalTx);
        setReturnModalTx(null);
        setShowSuccessModal(true);
      } else {
        setReturnError('Failed to process return. Please check your network or try again.');
      }
    } catch (err: any) {
      setReturnError(err?.message || 'An error occurred while processing return.');
    } finally {
      setSubmittingReturn(false);
    }
  };

  const renderCard = ({ item }: { item: TransactionSummary }) => {
    const isOverdue = item.status === 'overdue';
    const isReturned = item.status === 'returned';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => handleCardPress(item)}
      >
        {/* Top line: Borrower Name + Badge */}
        <View style={styles.cardHeader}>
          <Text style={styles.borrowerName}>{item.borrower_name}</Text>
          <StatusBadge status={item.status} />
        </View>

        {/* Middle line: Items Summary */}
        <View style={styles.itemsRow}>
          <Text style={styles.itemsSummary} numberOfLines={1}>
            {item.items_summary}
          </Text>
        </View>

        {/* Bottom line: TXN ID, Borrow Date, Due Date, and Quick Return Button */}
        <View style={styles.cardFooter}>
          <View style={styles.cardFooterLeft}>
            <Text style={styles.txnCode}>{item.transaction_code}</Text>
            <Text style={styles.borrowDate}>{formatDateDisplay(item.borrow_date)}</Text>
            {isReturned ? (
              <Text style={styles.returnedDate}>
                Returned {formatDateDisplay(item.return_date || item.borrow_date)}
              </Text>
            ) : (
              <Text style={[styles.dueDate, isOverdue && styles.overdueDueDate]}>
                Due {formatDateDisplay(item.due_date)}
              </Text>
            )}
          </View>

          {!isReturned && (
            <TouchableOpacity
              style={styles.cardReturnBtn}
              activeOpacity={0.8}
              onPress={(e) => {
                e.stopPropagation?.();
                openReturnModal(item);
              }}
            >
              <Ionicons name="arrow-undo-outline" size={13} color="#FFFFFF" />
              <Text style={styles.cardReturnBtnText}>Return</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const unreturnedModalItems = returnModalTx
    ? returnModalTx.items.filter((i) => i.status !== 'returned')
    : [];

  return (
    <TabPageLayout
      backgroundColor={AppColors.background}
      header={
        <ScreenHeader
          variant="tab"
          title="Records"
          right={
            <ScreenHeaderIconAction
              icon="search-outline"
              label="Search records"
              onPress={() => searchInputRef.current?.focus()}
            />
          }
        />
      }
      floatingAction={
        <Fab
          icon="arrow-undo-outline"
          label="Return Item"
          onPress={handleReturnPress}
        />
      }
    >
      {/* Search Input Bar */}
      <View style={[tabPageStyles.searchFrame, styles.searchContainer]}>
        <Ionicons name="search-outline" size={18} color={AppColors.textMuted} style={tabPageStyles.searchIcon} />
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder="Search by borrower name, ID, or item..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color={AppColors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <FilterChips options={FILTER_TABS} selected={filter} onSelect={setFilter} />

      {/* Transactions List */}
      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={AppColors.navy} />
          <Text style={styles.loadingText}>Loading records...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.transaction_code}
          renderItem={renderCard}
          keyboardDismissMode="on-drag"
          contentContainerStyle={[
            tabPageStyles.listAfterFilters,
            filteredTransactions.length === 0 && styles.listEmptyContent,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              colors={[AppColors.navy]}
              tintColor={AppColors.navy}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="document-text-outline"
              title="No Records Found"
              message={searchQuery
                ? 'No matching borrower or transaction ID found.'
                : `There are currently no ${filter !== 'all' ? filter : ''} transactions.`}
              style={styles.emptyState}
            />
          }
        />
      )}

      <Fab
        icon="arrow-undo-outline"
        label="Return Item"
        onPress={handleReturnPress}
      />

      {/* ─── RETURN EQUIPMENT MODAL ────────────────────────────────────────────── */}
      <Modal
        visible={!!returnModalTx}
        transparent
        animationType="fade"
        onRequestClose={closeReturnModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Header */}
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
              {/* Transaction Summary Card */}
              {returnModalTx && (
                <View style={styles.modalTxSummary}>
                  <Text style={styles.modalBorrowerName}>{returnModalTx.borrower_name}</Text>
                  <Text style={styles.modalTxCode}>
                    TXN: <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700' }}>{returnModalTx.transaction_code}</Text>
                  </Text>
                  <Text style={styles.modalDueDate}>
                    Due Date: <Text style={{ fontWeight: '700', color: AppColors.navy }}>{formatDateDisplay(returnModalTx.due_date)}</Text>
                  </Text>
                </View>
              )}

              {/* Items checklist */}
              <Text style={styles.modalSectionLabel}>Items to Return ({selectedItemIds.size}/{unreturnedModalItems.length})</Text>
              <View style={styles.itemsBox}>
                {unreturnedModalItems.map((item) => {
                  const isChecked = selectedItemIds.has(item.id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.itemRow}
                      activeOpacity={0.7}
                      onPress={() => toggleItemCheckbox(item.id)}
                    >
                      <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                        {isChecked && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
                      </View>
                      <View style={styles.itemRowText}>
                        <Text style={styles.itemRowName}>{item.equipment_name}</Text>
                        <Text style={styles.itemRowSub}>
                          {item.equipment_brand || 'Standard'} • Qty: {item.quantity || 1}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Condition Legend Radio Selector */}
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

              {/* Error Box */}
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

      {/* ─── RETURN SUCCESS RECEIPT MODAL ────────────────────────────────────── */}
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
              The items have been marked as returned and inventory has been officially restored.
            </Text>

            {successTx && (
              <View style={styles.successReceiptBox}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Transaction</Text>
                  <Text style={styles.receiptValBold}>{successTx.transaction_code}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Borrower</Text>
                  <Text style={styles.receiptVal}>{successTx.borrower_name}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Status</Text>
                  <Text style={[styles.receiptValBold, { color: '#16A34A' }]}>Returned</Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.successDoneBtn}
              onPress={() => {
                setShowSuccessModal(false);
                setSuccessTx(null);
              }}
            >
              <Text style={styles.successDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </TabPageLayout>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    backgroundColor: AppColors.white,
    borderColor: AppColors.border,
  },
  searchInput: {
    flex: 1,
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.body,
    color: AppColors.text,
    height: '100%',
  },
  clearBtn: {
    padding: 4,
  },
  listEmptyContent: {
    flexGrow: 1,
  },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  borrowerName: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.bodyStrong,
    fontWeight: AppTypography.weight.bold,
    color: AppColors.text,
  },
  itemsRow: {
    marginBottom: 10,
  },
  itemsSummary: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.supporting,
    color: AppColors.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: AppColors.background,
  },
  cardFooterLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  txnCode: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  borrowDate: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.chip,
    color: AppColors.textMuted,
  },
  dueDate: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.chip,
    fontWeight: AppTypography.weight.semibold,
    color: AppColors.textSecondary,
  },
  overdueDueDate: {
    color: AppColors.red,
    fontWeight: AppTypography.weight.bold,
  },
  returnedDate: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.chip,
    fontWeight: AppTypography.weight.semibold,
    color: AppColors.green,
  },
  cardReturnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0F172A',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  cardReturnBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 10,
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.supporting,
    color: AppColors.textSecondary,
  },
  emptyState: {
    flex: 1,
  },

  // ─── Return Modal Styles ──────────────────────────────────────────────────
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
  modalTxSummary: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 12,
    gap: 4,
  },
  modalBorrowerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalTxCode: {
    fontSize: 12,
    color: '#64748B',
  },
  modalDueDate: {
    fontSize: 12,
    color: '#64748B',
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
  itemRow: {
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
  itemRowText: {
    flex: 1,
  },
  itemRowName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  itemRowSub: {
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

  // ─── Success Modal Styles ─────────────────────────────────────────────────
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
    paddingHorizontal: 12,
  },
  successReceiptBox: {
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
    paddingHorizontal: 48,
  },
  successDoneText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
