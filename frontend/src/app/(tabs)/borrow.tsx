import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AppColors } from '../../constants/colors';
import { useBorrowRecords } from '../../hooks/useBorrowRecords';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { ROUTES } from '../../routing/routes';
import { BorrowRecordWithEquipment } from '../../types';
import { useGuardedPress } from '../../utils/guards';

type FilterTab = 'all' | 'borrowed' | 'overdue' | 'returned';

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
            <Pressable
              onPress={() => handleReturnPress(item)}
              disabled={returningId === item.id}
              style={({ pressed }) => [
                styles.returnBtn,
                pressed && styles.returnBtnPressed,
                returningId === item.id && styles.returnBtnDisabled,
              ]}
            >
              {returningId === item.id ? (
                <ActivityIndicator size="small" color={AppColors.navy} />
              ) : (
                <Text style={styles.returnBtnText}>Return</Text>
              )}
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Borrowing</Text>
          <Text style={styles.headerSubtitle}>Transactions & Active Loans</Text>
        </View>

        <Pressable
          onPress={handleNewTransaction}
          style={({ pressed }) => [styles.headerAddBtn, pressed && styles.btnPressed]}
          accessibilityRole="button"
          accessibilityLabel="New Transaction"
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.headerAddText}>New Loan</Text>
        </Pressable>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabContainer}>
        {(['all', 'borrowed', 'overdue', 'returned'] as FilterTab[]).map((tab) => {
          const isActive = filter === tab;
          const label = tab.charAt(0).toUpperCase() + tab.slice(1);
          return (
            <Pressable
              key={tab}
              onPress={() => setFilter(tab)}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

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
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={AppColors.navy} />
          }
        />
      )}

      {/* Floating Action Button */}
      <Pressable
        onPress={handleNewTransaction}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        accessibilityRole="button"
        accessibilityLabel="New Transaction"
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.fabText}>New Transaction</Text>
      </Pressable>
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: AppColors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  headerAddBtn: {
    backgroundColor: AppColors.navy,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  btnPressed: {
    opacity: 0.85,
  },
  headerAddText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 14,
    gap: 8,
  },
  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  tabButtonActive: {
    backgroundColor: AppColors.navy,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 12,
  },
  card: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.text,
  },
  borrowerId: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  equipmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  equipmentName: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.text,
  },
  tagBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: AppColors.navy,
  },
  purposeText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
    marginTop: 2,
  },
  dateInfo: {
    gap: 2,
  },
  dateLabel: {
    fontSize: 11,
    color: AppColors.textSecondary,
  },
  dateValue: {
    fontWeight: '600',
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
    paddingHorizontal: 14,
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    backgroundColor: AppColors.navy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    gap: 6,
  },
  fabPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
