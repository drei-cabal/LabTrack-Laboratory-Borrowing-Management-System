import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
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

export default function TransactionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [transaction, setTransaction] = useState<TransactionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleReturnPress = useGuardedPress(() => {
    if (!transaction) return;
    router.push({
      pathname: ROUTES.RECORD_RETURN as any,
      params: { preselectedCode: transaction.transaction_code },
    });
  }, 600);

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
          <Text style={styles.sectionLabel}>BORROWER</Text>
          <View style={styles.row}>
            <Text style={styles.fieldLabel}>Student ID</Text>
            <Text style={styles.fieldValueBold}>{transaction.borrower_id}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.fieldLabel}>Purpose</Text>
            <Text style={styles.fieldValueWrap}>{transaction.purpose || '—'}</Text>
          </View>
        </View>

        {/* ITEMS Section */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>ITEMS</Text>
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
              <Text style={styles.itemQty}>×{item.quantity || 1}</Text>
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
            <Text style={styles.fieldLabel}>Due</Text>
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
            <Text style={styles.fieldLabel}>Returned</Text>
            <Text style={[styles.fieldValue, isReturned && styles.returnedText]}>
              {transaction.return_date ? formatDateDisplay(transaction.return_date) : 'Pending'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.fieldLabel}>Authorized By</Text>
            <Text style={styles.fieldValue}>{transaction.authorized_by || 'Admin Cruz'}</Text>
          </View>
        </View>

        {/* REMARKS Section */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>REMARKS</Text>
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
            onPress={handleReturnPress}
          >
            <Ionicons name="arrow-undo-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.actionBtnText}>Return Items</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
    fontWeight: '500',
    color: '#94A3B8',
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
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 13,
    color: '#64748B',
    width: 100,
  },
  fieldValue: {
    fontSize: 13,
    color: '#0F172A',
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
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
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
    color: '#94A3B8',
    marginTop: 2,
  },
  itemQty: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  overdueText: {
    color: '#DC2626',
    fontWeight: '700',
  },
  returnedText: {
    color: '#16A34A',
    fontWeight: '600',
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
});
