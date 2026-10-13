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
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AppColors } from '../../constants/colors';
import { Fab } from '../../components/ui/Fab';
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

  const renderBadge = (status: TransactionSummary['status']) => {
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
          {renderBadge(item.status)}
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
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Records</Text>
        <TouchableOpacity
          style={styles.headerSearchBtn}
          onPress={() => {
            searchInputRef.current?.focus();
          }}
        >
          <Ionicons name="search-outline" size={20} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color="#94A3B8" style={styles.searchIcon} />
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder="Search by borrower name..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabsRow}>
        {FILTER_TABS.map((tab) => {
          const isActive = filter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
              onPress={() => setFilter(tab.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

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
            styles.listContent,
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
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Records Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'No matching borrower or transaction ID found.'
                  : `There are currently no ${filter !== 'all' ? filter : ''} transactions.`}
              </Text>
            </View>
          }
        />
      )}

      <Fab
        icon="arrow-undo-outline"
        label="Return Item"
        onPress={handleReturnPress}
      />
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  headerSearchBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 42,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    height: '100%',
  },
  clearBtn: {
    padding: 4,
  },
  filterTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: '#F8FAFC',
  },
  filterTab: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterTabActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 90,
  },
  listEmptyContent: {
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
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
  itemsRow: {
    marginBottom: 10,
  },
  itemsSummary: {
    fontSize: 13,
    color: '#64748B',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  txnCode: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
  },
  borrowDate: {
    fontSize: 11,
    color: '#94A3B8',
  },
  dueDate: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  overdueDueDate: {
    color: '#DC2626',
    fontWeight: '700',
  },
  returnedDate: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16A34A',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});
