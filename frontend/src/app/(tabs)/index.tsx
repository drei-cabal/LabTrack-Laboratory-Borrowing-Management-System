import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDashboard } from '../../hooks/useDashboard';
import { AppColors } from '../../constants/colors';
import { ROUTES } from '../../routing/routes';
import { useGuardedPress } from '../../utils/guards';
import { DashboardOverdueItem, DashboardRecentTransaction } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';


function formatWelcomeName(name?: string, username?: string): string {
  if (!name && !username) return 'Team Member';
  const raw = (name || username || '').trim();

  // "Prof. Eduardo Cruz" -> "Prof. Cruz"
  if (/^prof\.?\s+/i.test(raw)) {
    const parts = raw.split(/\s+/);
    return `${parts[0]} ${parts[parts.length - 1]}`;
  }

  // "Karen Dela Cruz" -> "Karen D.C."
  const parts = raw.split(/\s+/);
  if (parts.length >= 3) {
    const initials = parts
      .slice(1)
      .map((p) => p[0].toUpperCase() + '.')
      .join('');
    return `${parts[0]} ${initials}`;
  }

  return raw;
}

export default function HomeScreen() {
  const router = useRouter();
  const { data, loading, refreshing, refresh, currentUser } = useDashboard();

  const handleNewTransactionPress = useGuardedPress(() => {
    router.push(ROUTES.BORROW_NEW as any);
  });

  const handleEquipmentPress = useGuardedPress(() => {
    router.push(ROUTES.EQUIPMENT as any);
  });

  const handleBorrowedPress = useGuardedPress(() => {
    router.push(ROUTES.RECORDS as any);
  });

  const handleOverduePress = useGuardedPress(() => {
    router.push(ROUTES.RECORDS as any);
  });

  const handleViewAllRecordsPress = useGuardedPress(() => {
    router.push(ROUTES.RECORDS as any);
  });

  const handleRecordItemPress = useGuardedPress((code: string) => {
    router.push(ROUTES.RECORD_DETAIL(code) as any);
  });

  const isAdmin = currentUser?.role === 'admin';
  const welcomeName = formatWelcomeName(currentUser?.full_name, currentUser?.username);

  const stats = data?.stats ?? {
    total_equipment: 0,
    total_borrowed: 0,
    total_overdue: 0,
  };
  const overdueItems = data?.overdue_items ?? [];
  const recentTransactions = data?.recent_transactions ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* ─── Top Header Banner (Dark Navy) ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.welcomeRow}>
          <View style={styles.welcomeTextContainer}>
            <Text style={styles.welcomeLabel}>WELCOME BACK</Text>
            <Text style={styles.welcomeName} numberOfLines={1}>
              {welcomeName}
            </Text>
          </View>

          {/* Role Badge */}
          <View style={[styles.roleBadge, isAdmin ? styles.adminBadge : styles.asstBadge]}>
            <Text style={[styles.roleBadgeText, isAdmin ? styles.adminBadgeText : styles.asstBadgeText]}>
              {isAdmin ? 'ADMIN' : 'ASST.'}
            </Text>
          </View>
        </View>
      </View>

      {/* ─── Scrollable Content ─── */}
      {loading && !data ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.navy} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              colors={[AppColors.navy]}
              tintColor={AppColors.navy}
            />
          }
        >
          {/* ─── Stat Cards (3 Columns) ─── */}
          <View style={styles.statsRow}>
            {/* Equipment Card */}
            <Pressable
              onPress={handleEquipmentPress}
              style={({ pressed }) => [styles.statCard, styles.equipmentCard, pressed && styles.cardPressed]}
              accessibilityRole="button"
              accessibilityLabel="View equipment"
            >
              <View style={styles.statIconContainer}>
                <Ionicons name="cube-outline" size={20} color="#64748B" />
              </View>
              <Text style={styles.statNumber}>{stats.total_equipment}</Text>
              <Text style={styles.statLabel}>Equipment</Text>
            </Pressable>

            {/* Borrowed Card */}
            <Pressable
              onPress={handleBorrowedPress}
              style={({ pressed }) => [styles.statCard, styles.borrowedCard, pressed && styles.cardPressed]}
              accessibilityRole="button"
              accessibilityLabel="View borrowed records"
            >
              <View style={styles.statIconContainer}>
                <Ionicons name="repeat-outline" size={20} color="#2563EB" />
              </View>
              <Text style={[styles.statNumber, styles.borrowedNumber]}>{stats.total_borrowed}</Text>
              <Text style={styles.statLabel}>Borrowed</Text>
            </Pressable>

            {/* Overdue Card */}
            <Pressable
              onPress={handleOverduePress}
              style={({ pressed }) => [styles.statCard, styles.overdueCard, pressed && styles.cardPressed]}
              accessibilityRole="button"
              accessibilityLabel="View overdue records"
            >
              <View style={styles.statIconContainer}>
                <Ionicons name="alert-circle-outline" size={20} color="#DC2626" />
              </View>
              <Text style={[styles.statNumber, styles.overdueNumber]}>{stats.total_overdue}</Text>
              <Text style={styles.statLabel}>Overdue</Text>
            </Pressable>
          </View>

          {/* ─── Overdue Items Section ─── */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>OVERDUE ITEMS</Text>
              <Pressable
                onPress={handleOverduePress}
                hitSlop={8}
                accessibilityRole="button"
              >
                <Text style={styles.viewAllText}>View All</Text>
              </Pressable>
            </View>

            {overdueItems.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="checkmark-circle-outline" size={24} color="#16A34A" />
                <Text style={styles.emptyCardText}>No overdue equipment items</Text>
              </View>
            ) : (
              overdueItems.map((item: DashboardOverdueItem) => (
                <Pressable
                  key={item.id}
                  onPress={() => handleRecordItemPress(item.transaction_code)}
                  style={({ pressed }) => [
                    styles.overdueItemCard,
                    pressed && styles.cardPressed,
                  ]}
                  accessibilityRole="button"
                >
                  {/* Left Red Accent Strip */}
                  <View style={styles.redAccentStrip} />

                  {/* Item & Borrower Details */}
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.itemBorrower} numberOfLines={1}>
                      {item.borrower_name}
                    </Text>
                  </View>

                  {/* Right Days Late & Due Date */}
                  <View style={styles.itemRight}>
                    <Text style={styles.daysLateText}>{item.days_late_label}</Text>
                    <Text style={styles.dueDateText}>Due {item.due_date}</Text>
                  </View>
                </Pressable>
              ))
            )}
          </View>

          {/* ─── Recent Transactions Section ─── */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>RECENT TRANSACTIONS</Text>
              <Pressable
                onPress={handleViewAllRecordsPress}
                hitSlop={8}
                accessibilityRole="button"
              >
                <Text style={styles.viewAllText}>View All</Text>
              </Pressable>
            </View>

            {recentTransactions.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="document-text-outline" size={24} color="#94A3B8" />
                <Text style={styles.emptyCardText}>No recent transactions</Text>
              </View>
            ) : (
              recentTransactions.map((tx: DashboardRecentTransaction) => {
                const isOverdue = tx.status === 'overdue';
                const isReturned = tx.status === 'returned';

                let statusColor = '#2563EB';
                let statusBg = '#EFF6FF';
                let statusLabel = 'Borrowed';

                if (isOverdue) {
                  statusColor = '#DC2626';
                  statusBg = '#FEF2F2';
                  statusLabel = 'Overdue';
                } else if (isReturned) {
                  statusColor = '#16A34A';
                  statusBg = '#F0FDF4';
                  statusLabel = 'Returned';
                }

                return (
                  <Pressable
                    key={tx.id}
                    onPress={() => handleRecordItemPress(tx.transaction_code)}
                    style={({ pressed }) => [
                      styles.transactionCard,
                      pressed && styles.cardPressed,
                    ]}
                    accessibilityRole="button"
                  >
                    {/* Item & Borrower */}
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle} numberOfLines={1}>
                        {tx.title}
                      </Text>
                      <Text style={styles.itemBorrower} numberOfLines={1}>
                        {tx.borrower_name}
                      </Text>
                    </View>

                    {/* Status Pill & Date */}
                    <View style={styles.itemRight}>
                      <StatusBadge status={tx.status} />
                      <Text style={styles.dateText}>{tx.borrow_date}</Text>
                    </View>
                  </Pressable>

                );
              })
            )}
          </View>
        </ScrollView>
      )}

      {/* ─── Floating Action Button (FAB) ─── */}
      <Pressable
        onPress={handleNewTransactionPress}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        accessibilityRole="button"
        accessibilityLabel="New Transaction"
      >
        <Ionicons name="add" size={18} color="#FFFFFF" />
        <Text style={styles.fabText}>New Transaction</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerBanner: {
    backgroundColor: AppColors.navy,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 22,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  welcomeTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  welcomeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  welcomeName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  adminBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  asstBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  adminBadgeText: {
    color: '#FFFFFF',
  },
  asstBadgeText: {
    color: '#E2E8F0',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 90, // Leave room for FAB and tabs
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  equipmentCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  borrowedCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
  },
  overdueCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  statIconContainer: {
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: AppColors.navy,
    marginBottom: 4,
  },
  borrowedNumber: {
    color: '#2563EB',
  },
  overdueNumber: {
    color: '#DC2626',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  sectionContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.6,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.navy,
  },
  overdueItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  redAccentStrip: {
    width: 3.5,
    height: '100%',
    minHeight: 36,
    backgroundColor: '#DC2626',
    borderRadius: 2,
    marginRight: 12,
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.navy,
    marginBottom: 4,
  },
  itemBorrower: {
    fontSize: 13,
    color: '#64748B',
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  daysLateText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 3,
  },
  dueDateText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
    marginBottom: 3,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  emptyCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyCardText: {
    fontSize: 13,
    color: '#64748B',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.navy,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  fabPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
