import { screenStyles } from '../../components/ui/ScreenStyles';
import { AppTypography } from '../../constants/typography';
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
  Alert,
} from 'react-native';
import { authService } from '../../services/authService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { useDashboard } from '../../hooks/useDashboard';
import { AppColors } from '../../constants/colors';
import { RoleBadge } from '../../components/ui/RoleBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ROUTES } from '../../routing/routes';
import { useGuardedPress } from '../../utils/guards';
import { DashboardOverdueItem, DashboardRecentTransaction } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { TabPageLayout, tabPageStyles } from '../../components/ui/TabPageLayout';
import { Fab } from '../../components/ui/Fab';


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
  const [sectionsHeight, setSectionsHeight] = React.useState(0);
  // Keep both sections bounded by the navigator, even when a short screen cannot fit 80px each.
  const minSectionHeight = sectionsHeight > 0 ? Math.max(0, Math.min(80, (sectionsHeight - 20) / 2)) : 80;

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out of LabTrack?')) {
        authService.logout().then(() => {
          window.location.href = '/';
        });
      }
    } else {
      Alert.alert(
        'Log Out',
        'Are you sure you want to log out of LabTrack?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Log Out',
            style: 'destructive',
            onPress: async () => {
              await authService.logout();
              router.replace(ROUTES.LOGIN as any);
            },
          },
        ],
        { cancelable: true }
      );
    }
  };

  return (
    <TabPageLayout
      header={
        <ScreenHeader
          variant="tab"
          tone="navy"
          title={welcomeName}
          subtitle="WELCOME BACK"
          right={
            <View style={styles.headerRight}>
              <RoleBadge role={isAdmin ? 'admin' : 'assistant'} style={isAdmin ? styles.headerRoleBadge : undefined} />
              <Pressable
                onPress={handleLogout}
                style={({ pressed }) => [styles.logoutBtn, pressed && styles.logoutBtnPressed]}
                accessibilityRole="button"
                accessibilityLabel="Log out"
              >
                <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.75)" />
              </Pressable>
            </View>
          }
        />
      }
      backgroundColor={AppColors.background}
      floatingAction={
        <Fab
          icon="add"
          label="New Transaction"
          onPress={handleNewTransactionPress}
        />
      }
    >
      {/* ─── Fixed Content ─── */}
      {loading && !data ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.navy} />
        </View>
      ) : (
        <View style={[tabPageStyles.bodyGutters, styles.dashboardContent]}>
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
                <Ionicons name="cube-outline" size={20} color={AppColors.textSecondary} />
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
                <Ionicons name="repeat-outline" size={20} color={AppColors.blue} />
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
                <Ionicons name="alert-circle-outline" size={20} color={AppColors.red} />
              </View>
              <Text style={[styles.statNumber, styles.overdueNumber]}>{stats.total_overdue}</Text>
              <Text style={styles.statLabel}>Overdue</Text>
            </Pressable>
          </View>

          <View
            style={styles.sections}
            onLayout={({ nativeEvent }) => setSectionsHeight(nativeEvent.layout.height)}
          >
            {/* ─── Overdue Items Section ─── */}
            <View style={[styles.sectionContainer, { minHeight: minSectionHeight }]}>
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

              <ScrollView
                style={styles.sectionList}
                nestedScrollEnabled
                showsVerticalScrollIndicator
                contentContainerStyle={overdueItems.length === 0 ? styles.emptyListContent : styles.listContent}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={refresh}
                    colors={[AppColors.navy]}
                    tintColor={AppColors.navy}
                  />
                }
              >
                {overdueItems.length === 0 ? (
                  <EmptyState icon="checkmark-circle-outline" message="No overdue equipment items" style={styles.emptyCard} />
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
              </ScrollView>
            </View>

            {/* ─── Recent Transactions Section ─── */}
            <View style={[styles.sectionContainer, styles.lastSection, { minHeight: minSectionHeight }]}>
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

              <ScrollView
                style={styles.sectionList}
                nestedScrollEnabled
                showsVerticalScrollIndicator
                contentContainerStyle={recentTransactions.length === 0 ? styles.emptyListContent : styles.recentListContent}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={refresh}
                    colors={[AppColors.navy]}
                    tintColor={AppColors.navy}
                  />
                }
              >
                {recentTransactions.length === 0 ? (
                  <EmptyState icon="document-text-outline" message="No recent transactions" style={styles.emptyCard} />
                ) : (
                  recentTransactions.map((tx: DashboardRecentTransaction) => {
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
              </ScrollView>
            </View>
          </View>
        </View>
      )}
    </TabPageLayout>
  );
}

const styles = StyleSheet.create({
  dashboardContent: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  sections: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  sectionList: {
    flex: 1,
    minHeight: 0,
  },
  listContent: {
    paddingBottom: 16,
  },
  recentListContent: {
    paddingBottom: 90,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerRoleBadge: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.16)',
  },
  logoutBtn: {
    padding: 6,
    borderRadius: 8,
  },
  logoutBtnPressed: {
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexShrink: 0,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    ...screenStyles.card,
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  equipmentCard: {
    backgroundColor: AppColors.white,
    borderColor: AppColors.border,
  },
  borrowedCard: {
    backgroundColor: AppColors.white,
    borderColor: AppColors.border,
  },
  overdueCard: {
    backgroundColor: AppColors.white,
    borderColor: AppColors.border,
  },
  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  statIconContainer: {
    marginBottom: 10,
  },
  statNumber: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.display,
    fontWeight: AppTypography.weight.heavy,
    color: AppColors.navy,
    marginBottom: 4,
  },
  borrowedNumber: {
    color: AppColors.blue,
  },
  overdueNumber: {
    color: AppColors.red,
  },
  statLabel: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.small,
    fontWeight: AppTypography.weight.medium,
    color: AppColors.textSecondary,
  },
  sectionContainer: {
    flex: 1,
    minHeight: 80,
    overflow: 'hidden',
    marginBottom: 20,
  },
  lastSection: {
    marginBottom: 0,
  },
  sectionHeader: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.small,
    fontWeight: AppTypography.weight.bold,
    color: AppColors.textSecondary,
    letterSpacing: 0.6,
  },
  viewAllText: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.small,
    fontWeight: AppTypography.weight.semibold,
    color: AppColors.navy,
  },
  overdueItemCard: {
    ...screenStyles.card,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  redAccentStrip: {
    width: 3.5,
    height: '100%',
    minHeight: 36,
    backgroundColor: AppColors.red,
    borderRadius: 2,
    marginRight: 12,
  },
  transactionCard: {
    ...screenStyles.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemTitle: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.bodyStrong,
    fontWeight: AppTypography.weight.bold,
    color: AppColors.navy,
    marginBottom: 4,
  },
  itemBorrower: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.supporting,
    color: AppColors.textSecondary,
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  daysLateText: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.supporting,
    fontWeight: AppTypography.weight.bold,
    color: AppColors.red,
    marginBottom: 3,
  },
  dueDateText: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.chip,
    color: AppColors.textMuted,
  },
  dateText: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.chip,
    color: AppColors.textMuted,
  },
  emptyCard: {
    backgroundColor: AppColors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
