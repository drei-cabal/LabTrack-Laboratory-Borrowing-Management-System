import { screenStyles } from '../../components/ui/ScreenStyles';
import React, { useState, useMemo } from 'react';
import { AppTypography } from '../../constants/typography';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { TabPageLayout, tabPageStyles } from '../../components/ui/TabPageLayout';
import { ScreenHeader, ScreenHeaderTextAction } from '../../components/ui/ScreenHeader';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStaff } from '../../hooks/useStaff';
import { AppColors } from '../../constants/colors';
import { ROUTES } from '../../routing/routes';
import { getInitials, formatUsername } from '../../utils/staffUtils';
import { StaffEntity } from '../../types';
import { useGuardedPress } from '../../utils/guards';

export default function StaffScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const { staff, loading, refreshing, refresh } = useStaff();

  const handleAddPress = useGuardedPress(() => {
    router.push(ROUTES.STAFF_ADD as any);
  });

  const handleEditPress = useGuardedPress((id: string) => {
    router.push(ROUTES.STAFF_EDIT(id) as any);
  });

  const filteredStaff = useMemo(() => {
    if (!searchQuery.trim()) return staff;
    const q = searchQuery.trim().toLowerCase();
    return staff.filter((item) => {
      const matchName = item.full_name.toLowerCase().includes(q);
      const matchUsername = item.username.toLowerCase().includes(q);
      const matchEmail = (item.email || '').toLowerCase().includes(q);
      const matchRole = item.role.toLowerCase().includes(q);
      return matchName || matchUsername || matchEmail || matchRole;
    });
  }, [staff, searchQuery]);

  const renderStaffItem = ({ item }: { item: StaffEntity }) => {
    const initials = getInitials(item.full_name);
    const isInactive = !item.is_active;

    return (
      <Pressable
        onPress={() => handleEditPress(item.id)}
        style={({ pressed }) => [
          styles.staffCard,
          pressed && styles.staffCardPressed,
          isInactive && styles.staffCardInactive,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Edit ${item.full_name}`}
      >
        {/* Left Initials Avatar (Square) */}
        <View style={[styles.avatar, isInactive && styles.avatarInactive]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        {/* Center Details */}
        <View style={styles.staffDetails}>
          <View style={styles.nameHeaderRow}>
            <Text style={[styles.staffName, isInactive && styles.staffNameInactive]} numberOfLines={1}>
              {item.full_name}
            </Text>
            {/* Square Role & Status Badges */}
            <View style={styles.badgeRow}>
              <View style={[styles.squareBadge, item.role === 'admin' ? styles.adminBadge : styles.asstBadge]}>
                <Text style={[styles.squareBadgeText, item.role === 'admin' ? styles.adminBadgeText : styles.asstBadgeText]}>
                  {item.role === 'admin' ? 'ADMIN' : 'STAFF'}
                </Text>
              </View>

              {isInactive ? (
                <View style={[styles.squareBadge, styles.inactiveBadge]}>
                  <Text style={styles.inactiveBadgeText}>INACTIVE</Text>
                </View>
              ) : (
                <View style={[styles.squareBadge, styles.activeBadge]}>
                  <Text style={styles.activeBadgeText}>ACTIVE</Text>
                </View>
              )}
            </View>
          </View>

          {/* Username */}
          <Text style={styles.staffUsername} numberOfLines={1}>
            {formatUsername(item.username)}
          </Text>

          {/* Email */}
          <View style={styles.emailRow}>
            <Ionicons name="mail-outline" size={13} color="#64748B" />
            <Text style={styles.staffEmail} numberOfLines={1}>
              {item.email || `${item.username.toLowerCase()}@university.edu`}
            </Text>
          </View>
        </View>

        {/* Right Action (Square Button) */}
        <View style={styles.editBtnSquare}>
          <Ionicons name="chevron-forward" size={16} color="#64748B" />
        </View>
      </Pressable>
    );
  };

  const renderEmptyState = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconSquare}>
          <Ionicons name="person-outline" size={32} color="#94A3B8" />
        </View>
        <Text style={styles.emptyTitle}>
          {searchQuery ? 'No matching staff found.' : 'No staff accounts yet.'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {searchQuery
            ? 'Try searching with a different name, username, or email.'
            : 'Add team members to grant laboratory access and borrowing management.'}
        </Text>
        {!searchQuery && (
          <Pressable
            onPress={handleAddPress}
            style={({ pressed }) => [styles.emptyAddBtn, pressed && styles.emptyAddBtnPressed]}
            accessibilityRole="button"
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.emptyAddBtnText}>Add Staff Member</Text>
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <TabPageLayout
      backgroundColor={AppColors.background}
      header={
        <ScreenHeader
          variant="tab"
          title="Manage Staff"
          subtitle={`${staff.length} registered laboratory personnel`}
          right={<ScreenHeaderTextAction icon="add" label="Add Staff" onPress={handleAddPress} />}
        />
      }
    >
      {/* Search Bar */}
      <View style={[tabPageStyles.searchFrame, styles.searchBar]}>
        <Ionicons name="search-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, or username..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </Pressable>
        )}
      </View>

      {/* Main Content */}
      {loading && staff.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.navy} />
          <Text style={styles.loadingText}>Loading staff directory...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredStaff}
          keyExtractor={(item) => item.id}
          renderItem={renderStaffItem}
          contentContainerStyle={[
            tabPageStyles.listWithoutControls,
            filteredStaff.length === 0 && styles.listContentEmpty,
          ]}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              colors={[AppColors.navy]}
              tintColor={AppColors.navy}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </TabPageLayout>
  );
}

const styles = StyleSheet.create({
  btnPressed: {
    opacity: 0.85,
  },
  searchBar: {
    backgroundColor: AppColors.white,
    borderColor: AppColors.border,
  },
  searchInput: {
    flex: 1,
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.body,
    color: AppColors.text,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: AppColors.textSecondary,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  staffCard: {
    ...screenStyles.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  staffCardPressed: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  staffCardInactive: {
    backgroundColor: '#FAFAFA',
    borderColor: '#E2E8F0',
    opacity: 0.85,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 4, // Square design
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarInactive: {
    backgroundColor: '#64748B',
  },
  avatarText: {
    color: AppColors.white,
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.bodyStrong,
    fontWeight: AppTypography.weight.bold,
    letterSpacing: 0.5,
  },
  staffDetails: {
    flex: 1,
    justifyContent: 'center',
    gap: 3,
  },
  nameHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  staffName: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.text,
    flexShrink: 1,
  },
  staffNameInactive: {
    color: AppColors.textSecondary,
  },
  staffUsername: {
    fontSize: 12,
    color: AppColors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  staffEmail: {
    fontSize: 12,
    color: '#475569',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  squareBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4, // Square design
    alignItems: 'center',
    justifyContent: 'center',
  },
  squareBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  adminBadge: {
    backgroundColor: '#0F172A',
  },
  adminBadgeText: {
    color: '#FFFFFF',
  },
  asstBadge: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  asstBadgeText: {
    color: '#475569',
  },
  activeBadge: {
    backgroundColor: '#DCFCE7',
  },
  activeBadgeText: {
    color: '#16A34A',
    fontSize: 9,
    fontWeight: '800',
  },
  inactiveBadge: {
    backgroundColor: '#FEE2E2',
  },
  inactiveBadgeText: {
    color: '#DC2626',
    fontSize: 9,
    fontWeight: '800',
  },
  editBtnSquare: {
    width: 32,
    height: 32,
    borderRadius: 4, // Square design
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    backgroundColor: '#F8FAFC',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyIconSquare: {
    width: 64,
    height: 64,
    borderRadius: 4, // Square design
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: AppColors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    borderRadius: 4, // Square design
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  emptyAddBtnPressed: {
    opacity: 0.85,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
