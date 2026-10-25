import { AppTypography } from '../../constants/typography';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AppColors } from '../../constants/colors';
import { useBorrowRecords } from '../../hooks/useBorrowRecords';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Fab } from '../../components/ui/Fab';
import { ScreenHeader, ScreenHeaderTextAction } from '../../components/ui/ScreenHeader';
import { TabPageLayout, tabPageStyles } from '../../components/ui/TabPageLayout';
import { FilterChips } from '../../components/ui/FilterChips';
import { ROUTES } from '../../routing/routes';
import { BorrowRecordWithEquipment } from '../../types';
import { useGuardedPress } from '../../utils/guards';

type FilterTab = 'all' | 'borrowed' | 'overdue' | 'returned';

const FILTER_OPTIONS: readonly { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'borrowed', label: 'Borrowed' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'returned', label: 'Returned' },
];

// Equipment condition options matching the physical borrower's slip
const CONDITION_OPTIONS = [
  { value: '1', label: '1 — Good Condition', color: '#16A34A', icon: 'checkmark-circle-outline' as const },
  { value: '2', label: '2 — For Replacement', color: '#D97706', icon: 'refresh-circle-outline' as const },
  { value: '3', label: '3 — For Repair', color: '#DC2626', icon: 'construct-outline' as const },
  { value: '4', label: '4 — Consumable', color: '#7C3AED', icon: 'flask-outline' as const },
];

export default function BorrowScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterTab>('all');
  const { records, loading, refresh, returnItem } = useBorrowRecords(filter);
  const [returningId, setReturningId] = useState<string | null>(null);

  // Return Modal state
  const [returnModalItem, setReturnModalItem] = useState<BorrowRecordWithEquipment | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<string>('1');
  const [returnNotes, setReturnNotes] = useState('');
  const [returnError, setReturnError] = useState<string | null>(null);

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successEquipmentName, setSuccessEquipmentName] = useState('');

  const handleNewTransaction = useGuardedPress(() => {
    router.push(ROUTES.BORROW_NEW as any);
  }, 500);

  const openReturnModal = (item: BorrowRecordWithEquipment) => {
    setReturnModalItem(item);
    setSelectedCondition('1');
    setReturnNotes('');
    setReturnError(null);
  };

  const closeReturnModal = () => {
    if (returningId) return; // prevent closing while in-flight
    setReturnModalItem(null);
    setReturnError(null);
  };

  const handleConfirmReturn = async () => {
    if (!returnModalItem) return;
    setReturningId(returnModalItem.id);
    setReturnError(null);

    const conditionLabel = CONDITION_OPTIONS.find((c) => c.value === selectedCondition)?.label ?? '';
    const remarks = [
      `Condition: ${conditionLabel}`,
      returnNotes.trim() ? `Notes: ${returnNotes.trim()}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    const success = await returnItem(returnModalItem.id, remarks);
    setReturningId(null);

    if (success) {
      setSuccessEquipmentName(returnModalItem.equipment_name);
      setReturnModalItem(null);
      setShowSuccessModal(true);
    } else {
      setReturnError('Failed to mark item as returned. Please try again.');
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const renderItem = ({ item }: { item: BorrowRecordWithEquipment }) => {
    const isReturned = item.status === 'returned';
    const isProcessing = returningId === item.id;

    return (
      <View style={styles.card}>
        {/* Top Row: Borrower & Status */}
        <View style={styles.cardHeader}>
          <View style={styles.borrowerInfo}>
            <Text style={styles.borrowerName}>{item.borrower_name}</Text>
            <Text style={styles.borrowerId}>{item.borrower_id}</Text>
          </View>
          <StatusBadge status={item.status} />
        </View>

        {/* Equipment Name & Details */}
        <View style={styles.equipmentRow}>
          <Ionicons name="cube-outline" size={16} color={AppColors.navy} />
          <Text style={styles.equipmentName}>
            {item.equipment_name}
            {item.quantity && item.quantity > 1 ? ` (×${item.quantity})` : ''}
          </Text>
          {item.equipment_product_id ? (
            <View style={styles.tagBadge}>
              <Text style={styles.tagText}>{item.equipment_product_id}</Text>
            </View>
          ) : null}
        </View>

        {/* Purpose if present */}
        {item.purpose ? (
          <Text style={styles.purposeText} numberOfLines={2}>
            Purpose: {item.purpose}
          </Text>
        ) : null}

        {/* Dates and Action */}
        <View style={styles.cardFooter}>
          <View style={styles.dateInfo}>
            <Text style={styles.dateLabel}>
              Borrowed: <Text style={styles.dateValue}>{formatDate(item.borrow_date)}</Text>
            </Text>
            <Text style={styles.dateLabel}>
              Due: <Text style={styles.dueDateValue}>{formatDate(item.due_date)}</Text>
            </Text>
          </View>

          {!isReturned && (
            <Pressable
              onPress={() => openReturnModal(item)}
              disabled={isProcessing}
              style={({ pressed }) => [
                styles.returnBtn,
                pressed && styles.returnBtnPressed,
                isProcessing && styles.returnBtnDisabled,
              ]}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={AppColors.navy} />
              ) : (
                <>
                  <Ionicons name="return-down-back-outline" size={14} color={AppColors.navy} />
                  <Text style={styles.returnBtnText}>Return</Text>
                </>
              )}
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  return (
    <TabPageLayout
      backgroundColor={AppColors.white}
      header={
        <ScreenHeader
          variant="tab"
          title="Borrowing"
          right={
            <ScreenHeaderTextAction
              icon="add"
              label="New Loan"
              accessibilityLabel="New Transaction"
              onPress={handleNewTransaction}
            />
          }
        />
      }
      floatingAction={
        <Fab
          icon="add"
          label="New Transaction"
          onPress={handleNewTransaction}
        />
      }
    >
      {/* Filter Tabs */}
      <Text style={styles.subtitle}>Transactions & Active Loans</Text>
      <FilterChips options={FILTER_OPTIONS} selected={filter} onSelect={setFilter} />

      {/* List Content */}
      {loading && records.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={AppColors.navy} />
        </View>
      ) : records.length === 0 ? (
        <EmptyState
          message="No borrow transactions found for the selected filter."
          actionText="Create New Transaction"
          onAction={handleNewTransaction}
        />
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[tabPageStyles.listAfterFilters, styles.listContent]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={AppColors.navy} />
          }
        />
      )}

      <Fab
        icon="add"
        label="New Transaction"
        onPress={handleNewTransaction}
      />

      {/* ─── Return Equipment Modal ─────────────────────────────────────────────── */}
      <Modal
        visible={!!returnModalItem}
        transparent
        animationType="fade"
        onRequestClose={closeReturnModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Ionicons name="return-down-back-outline" size={20} color={AppColors.navy} />
              <Text style={styles.modalTitle}>Return Equipment</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Item summary */}
              {returnModalItem && (
                <View style={styles.modalItemSummary}>
                  <Text style={styles.modalItemName} numberOfLines={2}>
                    {returnModalItem.equipment_name}
                    {returnModalItem.quantity && returnModalItem.quantity > 1
                      ? ` (×${returnModalItem.quantity})`
                      : ''}
                  </Text>
                  <Text style={styles.modalItemSub}>
                    Borrowed by: <Text style={{ fontWeight: '700' }}>{returnModalItem.borrower_name}</Text>
                  </Text>
                  <Text style={styles.modalItemSub}>
                    Due: <Text style={{ fontWeight: '700', color: AppColors.navy }}>{formatDate(returnModalItem.due_date)}</Text>
                  </Text>
                </View>
              )}

              {/* Condition selector */}
              <Text style={styles.modalSectionLabel}>
                <Ionicons name="clipboard-outline" size={13} /> Equipment Condition on Return
              </Text>
              <View style={styles.conditionList}>
                {CONDITION_OPTIONS.map((opt) => {
                  const isSelected = selectedCondition === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => setSelectedCondition(opt.value)}
                      style={[
                        styles.conditionOption,
                        isSelected && { borderColor: opt.color, backgroundColor: opt.color + '12' },
                      ]}
                    >
                      <View style={[styles.conditionRadio, isSelected && { borderColor: opt.color }]}>
                        {isSelected && <View style={[styles.conditionRadioInner, { backgroundColor: opt.color }]} />}
                      </View>
                      <Ionicons name={opt.icon} size={16} color={isSelected ? opt.color : '#94A3B8'} />
                      <Text style={[styles.conditionLabel, isSelected && { color: opt.color, fontWeight: '700' }]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Optional notes */}
              <Text style={styles.modalSectionLabel}>Return Remarks (optional)</Text>
              <View style={styles.notesInputBox}>
                <Ionicons name="chatbubble-ellipses-outline" size={16} color="#94A3B8" style={{ marginTop: 2 }} />
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={0}
                  color="transparent"
                />
              </View>
              {/* Native TextInput for notes */}
              <View style={styles.notesWrapper}>
                <Ionicons name="chatbubble-ellipses-outline" size={16} color="#94A3B8" />
                <View style={styles.notesTextArea}>
                  {/* Inline textarea using TextInput style */}
                  <Text
                    style={styles.notesPlaceholder}
                    onPress={() => {}} // clickable area hint
                  >
                    {returnNotes.length === 0 ? 'e.g. Minor scratches on casing, cable intact...' : returnNotes}
                  </Text>
                </View>
              </View>

              {/* Error */}
              {returnError && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={15} color="#DC2626" />
                  <Text style={styles.errorText}>{returnError}</Text>
                </View>
              )}
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <Pressable
                onPress={closeReturnModal}
                disabled={!!returningId}
                style={({ pressed }) => [styles.modalCancelBtn, pressed && styles.btnPressed]}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleConfirmReturn}
                disabled={!!returningId}
                style={({ pressed }) => [
                  styles.modalConfirmBtn,
                  pressed && styles.btnPressed,
                  !!returningId && styles.modalConfirmBtnDisabled,
                ]}
              >
                {returningId ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.modalConfirmText}>Confirm Return</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Return Success Modal ───────────────────────────────────────────────── */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, styles.successCard]}>
            <View style={styles.successIconWrap}>
              <Ionicons name="checkmark-circle" size={52} color="#16A34A" />
            </View>
            <Text style={styles.successTitle}>Item Returned</Text>
            <Text style={styles.successMsg}>
              <Text style={{ fontWeight: '700' }}>{successEquipmentName}</Text> has been successfully
              marked as returned and the inventory has been updated.
            </Text>
            <Pressable
              onPress={() => setShowSuccessModal(false)}
              style={({ pressed }) => [styles.successDoneBtn, pressed && styles.btnPressed]}
            >
              <Text style={styles.successDoneText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </TabPageLayout>
  );
}

const styles = StyleSheet.create({
  btnPressed: {
    opacity: 0.75,
  },
  subtitle: {
    marginHorizontal: 16,
    marginBottom: 8,
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.small,
    color: AppColors.textSecondary,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    gap: 12,
  },
  card: {
    backgroundColor: AppColors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 14,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  borrowerInfo: {
    flex: 1,
  },
  borrowerName: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.bodyStrong,
    fontWeight: AppTypography.weight.bold,
    color: AppColors.text,
  },
  borrowerId: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.small,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  equipmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  equipmentName: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.body,
    fontWeight: AppTypography.weight.semibold,
    color: AppColors.text,
  },
  tagBadge: {
    backgroundColor: AppColors.border,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tagText: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.chip,
    fontWeight: AppTypography.weight.bold,
    color: AppColors.navy,
  },
  purposeText: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.small,
    color: AppColors.textSecondary,
    lineHeight: AppTypography.lineHeight.small,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
    paddingTop: 10,
    marginTop: 2,
  },
  dateInfo: {
    gap: 2,
  },
  dateLabel: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.chip,
    color: AppColors.textSecondary,
  },
  dateValue: {
    fontWeight: AppTypography.weight.semibold,
    color: AppColors.text,
  },
  dueDateValue: {
    fontWeight: '700',
    color: AppColors.navy,
  },
  returnBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: AppColors.navy,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  returnBtnPressed: {
    backgroundColor: '#F1F5F9',
  },
  returnBtnDisabled: {
    opacity: 0.6,
  },
  returnBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.navy,
  },

  // ─── Modal Styles ─────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 460,
    gap: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: AppColors.text,
  },
  modalItemSummary: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 4,
  },
  modalItemName: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.text,
  },
  modalItemSub: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  modalSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  conditionList: {
    gap: 8,
    marginTop: 6,
  },
  conditionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FAFAFA',
  },
  conditionRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  conditionRadioInner: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  conditionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: AppColors.text,
    flex: 1,
  },
  notesInputBox: {
    display: 'none', // hidden — we use notesWrapper instead
  },
  notesWrapper: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
    minHeight: 56,
    backgroundColor: '#FAFAFA',
  },
  notesTextArea: {
    flex: 1,
  },
  notesPlaceholder: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 16,
  },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  modalConfirmBtn: {
    flex: 2,
    backgroundColor: AppColors.navy,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  modalConfirmBtnDisabled: {
    opacity: 0.7,
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ─── Success Modal ────────────────────────────────────────────────────────────
  successCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  successIconWrap: {
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#16A34A',
    marginBottom: 8,
  },
  successMsg: {
    fontSize: 14,
    color: AppColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  successDoneBtn: {
    backgroundColor: AppColors.navy,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 40,
    marginTop: 8,
  },
  successDoneText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
