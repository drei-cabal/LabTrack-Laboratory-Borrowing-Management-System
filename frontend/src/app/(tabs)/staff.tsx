import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStaff } from '../../hooks/useStaff';
import { AppColors } from '../../constants/colors';
import { ROUTES } from '../../routing/routes';
import { getInitials, formatUsername } from '../../utils/staffUtils';
import { StaffEntity } from '../../types';
import { useGuardedPress } from '../../utils/guards';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { RoleBadge } from '../../components/ui/RoleBadge';
import { Fab } from '../../components/ui/Fab';

export default function StaffScreen() {


  const router = useRouter();
  const { staff, loading, refreshing, refresh, error } = useStaff();

  const handleAddPress = useGuardedPress(() => {
    router.push(ROUTES.STAFF_ADD as any);
  });

  const handleEditPress = useGuardedPress((id: string) => {
    router.push(ROUTES.STAFF_EDIT(id) as any);
  });

  const renderStaffItem = ({ item }: { item: StaffEntity }) => {
    const initials = getInitials(item.full_name);
    const isAdmin = item.role === 'admin';
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
        {/* Left Initials Avatar */}
        <View style={[styles.avatar, isInactive && styles.avatarInactive]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        {/* Center Details */}
        <View style={styles.staffDetails}>
          <Text style={[styles.staffName, isInactive && styles.staffNameInactive]} numberOfLines={1}>
            {item.full_name}
          </Text>
          <Text style={styles.staffUsername} numberOfLines={1}>
            {formatUsername(item.username)}
          </Text>
        </View>

        {/* Right Badges */}
        <View style={styles.badgeRow}>
          {isInactive && <StatusBadge status="inactive" />}
          <RoleBadge role={item.role} />
        </View>
      </Pressable>

    );
  };

  const renderEmptyState = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="person-outline" size={32} color="#94A3B8" />
        </View>
        <Text style={styles.emptyTitle}>No staff accounts yet.</Text>
        <Text style={styles.emptySubtitle}>
          Add the first team member to grant lab access.
        </Text>
        <Pressable
          onPress={handleAddPress}
          style={({ pressed }) => [styles.emptyAddBtn, pressed && styles.emptyAddBtnPressed]}
          accessibilityRole="button"
        >
          <Text style={styles.emptyAddBtnText}>Add Staff</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage Staff</Text>
      </View>

      {/* Main Content */}
      {loading && staff.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.navy} />
        </View>
      ) : (
        <FlatList
          data={staff}
          keyExtractor={(item) => item.id}
          renderItem={renderStaffItem}
          contentContainerStyle={[
            styles.listContent,
            staff.length === 0 && styles.listContentEmpty,
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

      <Fab
        icon="add"
        label="Add Staff"
        onPress={handleAddPress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: AppColors.navy,
    letterSpacing: -0.3,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 90, // Leave room for FAB and tab bar
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  staffCardPressed: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
  staffCardInactive: {
    backgroundColor: '#FAFAFA',
    borderColor: '#E2E8F0',
    opacity: 0.9,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: AppColors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarInactive: {
    backgroundColor: '#475569',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  staffDetails: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
  staffName: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.navy,
    marginBottom: 3,
  },
  staffNameInactive: {
    color: '#475569',
  },
  staffUsername: {
    fontSize: 13,
    color: '#64748B',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inactivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  inactiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94A3B8',
  },
  inactiveText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  adminBadge: {
    backgroundColor: AppColors.navy,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  adminBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  assistantBadge: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  assistantBadgeText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.navy,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyAddBtn: {
    borderWidth: 1.5,
    borderColor: AppColors.navy,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  emptyAddBtnPressed: {
    backgroundColor: '#F1F5F9',
  },
  emptyAddBtnText: {
    color: AppColors.navy,
    fontSize: 14,
    fontWeight: '600',
  },
});
