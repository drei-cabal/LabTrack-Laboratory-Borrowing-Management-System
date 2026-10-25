import { AppTypography } from '../../constants/typography';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AppColors } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import { useBorrowRecords } from '../../hooks/useBorrowRecords';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { TabPageLayout, tabPageStyles } from '../../components/ui/TabPageLayout';
import { FilterChips } from '../../components/ui/FilterChips';
import { Fab } from '../../components/ui/Fab';
import { ScreenHeader, ScreenHeaderTextAction } from '../../components/ui/ScreenHeader';
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

export default function BorrowScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterTab>('all');
  const { records, loading, refresh, returnItem } = useBorrowRecords(filter);
  const [returningId, setReturningId] = useState<string | null>(null);

  const handleNewTransaction = useGuardedPress(() => {
    router.push(ROUTES.BORROW_NEW as any);
  }, 500);

  const handleReturnPress = (item: BorrowRecordWithEquipment) => {
    Alert.alert(
      'Return Equipment',
      `Confirm return of "${item.equipment_name}" borrowed by ${item.borrower_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Return',
          onPress: async () => {
            setReturningId(item.id);
            const success = await returnItem(item.id);
            setReturningId(null);
            if (success) {
              Alert.alert('Success', 'Item has been marked as returned.');
            } else {
              Alert.alert('Error', 'Failed to mark item as returned.');
            }
          },
        },
      ]
    );
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
            <Button
              title="Return"
              variant="secondary"
              size="sm"
              fullWidth={false}
              onPress={() => handleReturnPress(item)}
              disabled={returningId === item.id}
              loading={returningId === item.id}
            />
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
    </TabPageLayout>
  );
}

const styles = StyleSheet.create({
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
    fontWeight: AppTypography.weight.bold,
    color: AppColors.navy,
  },
});
