import { AppTypography } from '../../constants/typography';
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppColors } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
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


  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
        <ScreenHeader variant="detail" title="Transaction Detail" onBack={handleBackPress} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={AppColors.navy} />
          <Text style={styles.loadingText}>Loading transaction...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !transaction) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
        <ScreenHeader variant="detail" title="Transaction Detail" onBack={handleBackPress} />
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={AppColors.red} />
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorSubtitle}>{error || 'Transaction not found.'}</Text>
          <Button title="Retry" variant="secondary" fullWidth={false} onPress={() => fetchDetail()} style={styles.retryBtn} />
        </View>
      </SafeAreaView>
    );
  }

  const isReturned = transaction.status === 'returned';

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <ScreenHeader variant="detail" title="Transaction Detail" onBack={handleBackPress} />

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
            <StatusBadge status={transaction.status} />
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
          <Button
            title="Return Items"
            onPress={handleReturnPress}
            icon={<Ionicons name="arrow-undo-outline" size={18} color={AppColors.white} />}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
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
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.detailTitle,
    fontWeight: AppTypography.weight.bold,
    color: AppColors.text,
    marginBottom: 2,
  },
  txnCode: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.small,
    fontWeight: AppTypography.weight.medium,
    color: AppColors.textMuted,
  },
  sectionLabel: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.chip,
    fontWeight: AppTypography.weight.bold,
    color: AppColors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  fieldLabel: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.supporting,
    color: AppColors.textSecondary,
    width: 100,
  },
  fieldValue: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.supporting,
    color: AppColors.text,
    flex: 1,
    textAlign: 'right',
  },
  fieldValueBold: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.supporting,
    fontWeight: AppTypography.weight.bold,
    color: AppColors.text,
    flex: 1,
    textAlign: 'right',
  },
  fieldValueWrap: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.supporting,
    color: AppColors.text,
    flex: 1,
    textAlign: 'right',
    lineHeight: AppTypography.lineHeight.supporting,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.background,
  },
  itemRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.body,
    fontWeight: AppTypography.weight.semibold,
    color: AppColors.text,
  },
  itemSub: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.small,
    color: AppColors.textMuted,
    marginTop: 2,
  },
  itemQty: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.body,
    fontWeight: AppTypography.weight.bold,
    color: AppColors.text,
  },
  overdueText: {
    color: AppColors.red,
    fontWeight: AppTypography.weight.bold,
  },
  returnedText: {
    color: AppColors.green,
    fontWeight: AppTypography.weight.semibold,
  },
  remarksText: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.supporting,
    color: '#334155',
    lineHeight: AppTypography.lineHeight.body,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.body,
    color: AppColors.textSecondary,
  },
  errorTitle: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.detailTitle,
    fontWeight: AppTypography.weight.bold,
    color: AppColors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  errorSubtitle: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.body,
    color: AppColors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: { marginTop: 20 },
});
