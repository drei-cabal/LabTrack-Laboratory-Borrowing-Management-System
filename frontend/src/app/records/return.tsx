import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { AppColors } from '../../constants/colors';
import { recordService } from '../../services/recordService';
import { ROUTES } from '../../routing/routes';
import { formatDateTimeDisplay, getTodayIso } from '../../utils/date';
import { useGuardedPress } from '../../utils/guards';
import type { TransactionSummary } from '../../types';

export default function ReturnItemScreen() {
  const router = useRouter();
  const { preselectedCode } = useLocalSearchParams<{ preselectedCode?: string }>();

  const [transactions, setTransactions] = useState<TransactionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTxCode, setSelectedTxCode] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  // Form fields
  const [dateTimeReturned, setDateTimeReturned] = useState('');
  const [remarks, setRemarks] = useState('All units returned in good working condition.');

  const handleSelectTransaction = useCallback((tx: TransactionSummary) => {
    setSelectedTxCode(tx.transaction_code);
    const activeIds = new Set(
      tx.items.filter((i) => i.status !== 'returned').map((i) => i.id)
    );
    setSelectedItemIds(activeIds);
  }, []);

  const fetchActiveTransactions = useCallback(async () => {
    try {
      setLoading(true);
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
        Alert.alert('Error', res.error || 'Failed to fetch active transactions.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to fetch transactions.');
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

  const executeReturn = async () => {
    if (!selectedTxCode) return;
    try {
      setSubmitting(true);
      const todayIso = getTodayIso();

      const res = await recordService.processReturn({
        transaction_code: selectedTxCode,
        record_ids: Array.from(selectedItemIds),
        return_date: todayIso,
        return_remarks: remarks.trim() || 'All units returned in good working condition.',
      });

      if (res.success) {
        Alert.alert(
          'Return Completed',
          'The items have been marked as returned and inventory has been restored.',
          [
            {
              text: 'OK',
              onPress: () => {
                router.replace(ROUTES.RECORDS as any);
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', res.error || 'Failed to process return.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'An error occurred during return.');
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm Return with confirmation dialog guard and double-tap prevention
  const handleConfirmReturn = useGuardedPress(() => {
    if (!selectedTxCode) {
      Alert.alert('Selection Required', 'Please select a transaction to return.');
      return;
    }

    if (selectedItemIds.size === 0) {
      Alert.alert('Selection Required', 'Please select at least one item to return.');
      return;
    }

    const borrower = selectedTransaction?.borrower_name || 'the borrower';
    const count = selectedItemIds.size;

    Alert.alert(
      'Confirm Equipment Return',
      `Are you sure you want to mark ${count} item(s) as returned for ${borrower}?\n\nThis will restore the units to available inventory.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Return',
          style: 'default',
          onPress: executeReturn,
        },
      ]
    );
  }, 700);

  const isButtonDisabled = !selectedTxCode || selectedItemIds.size === 0 || submitting;

  const renderBadge = (status: TransactionSummary['status']) => {
    let bg = '#DBEAFE';
    let text = '#2563EB';
    let label = '• Borrowed';

    if (status === 'overdue') {
      bg = '#FEE2E2';
      text = '#DC2626';
      label = '• Overdue';
    }

    return (
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Text style={[styles.badgeText, { color: text }]}>{label}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Return Item</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Section 1: Find Transaction */}
          <Text style={styles.sectionHeading}>Find Transaction</Text>

          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Borrower name or transaction ID..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={AppColors.navy} />
              <Text style={styles.loadingText}>Loading active loans...</Text>
            </View>
          ) : filteredTransactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No active borrow transactions found.</Text>
            </View>
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
                    {renderBadge(tx.status)}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Section 2: SELECT ITEMS TO RETURN */}
          {selectedTransaction && (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeadingUpper}>SELECT ITEMS TO RETURN</Text>
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
                          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
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

          {/* Section 3: Date / Time Returned */}
          <View style={styles.sectionBlock}>
            <Text style={styles.fieldLabel}>Date / Time Returned</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={dateTimeReturned}
                onChangeText={setDateTimeReturned}
                placeholder="e.g. Sep 18, 2026 — 14:32"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* Section 4: Condition / Remarks */}
          <View style={styles.sectionBlock}>
            <Text style={styles.fieldLabel}>Condition / Remarks</Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <TextInput
                style={styles.textArea}
                value={remarks}
                onChangeText={setRemarks}
                placeholder="All units returned in good working condition."
                placeholderTextColor="#94A3B8"
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
                color={selectedItemIds.size > 0 ? '#16A34A' : '#EAB308'}
              />
              <Text style={styles.statusHintText}>
                {selectedItemIds.size > 0
                  ? `${selectedItemIds.size} item(s) selected for return`
                  : 'Select at least one item above to proceed'}
              </Text>
            </View>
          )}

          {/* Bottom Action Button */}
          <TouchableOpacity
            style={[styles.confirmBtn, isButtonDisabled && styles.confirmBtnDisabled]}
            activeOpacity={0.85}
            disabled={isButtonDisabled}
            onPress={handleConfirmReturn}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.confirmBtnText}>Confirm Return</Text>
            )}
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeadingUpper: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  toggleAllBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  toggleAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.navy,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  transactionList: {
    marginBottom: 16,
    gap: 8,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  txCardSelected: {
    borderColor: '#0F172A',
    backgroundColor: '#F8FAFC',
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
    borderColor: '#0F172A',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0F172A',
  },
  txInfo: {
    flex: 1,
  },
  txBorrower: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  txCode: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  sectionBlock: {
    marginBottom: 18,
  },
  itemsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  itemTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  itemQty: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 6,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
  },
  textInput: {
    height: 44,
    fontSize: 14,
    color: '#0F172A',
  },
  textAreaContainer: {
    paddingVertical: 8,
  },
  textArea: {
    minHeight: 70,
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
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  confirmBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  confirmBtnDisabled: {
    opacity: 0.45,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: '#64748B',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
  },
});
