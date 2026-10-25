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

export default function RecordsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<TextInput>(null);

  const { transactions, loading, refreshing, refresh } = useRecords(filter);

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

        {/* Bottom line: TXN ID, Borrow Date, Due Date */}
        <View style={styles.cardFooter}>
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
      </TouchableOpacity>
    );
  };

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
          placeholder="Search by borrower name..."
          placeholderTextColor={AppColors.textMuted}
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
  txnCode: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.chip,
    fontWeight: AppTypography.weight.medium,
    color: AppColors.textMuted,
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
});
