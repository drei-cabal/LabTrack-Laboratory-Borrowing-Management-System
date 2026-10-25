import { AppTypography } from '../../constants/typography';
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
import { useRouter } from 'expo-router';
import { useStaff } from '../../hooks/useStaff';
import { AppColors } from '../../constants/colors';
import { EmptyState } from '../../components/ui/EmptyState';
import { ROUTES } from '../../routing/routes';
import { getInitials, formatUsername } from '../../utils/staffUtils';
import { StaffEntity } from '../../types';
import { useGuardedPress } from '../../utils/guards';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { RoleBadge } from '../../components/ui/RoleBadge';
import { TabPageLayout, tabPageStyles } from '../../components/ui/TabPageLayout';
import { Fab } from '../../components/ui/Fab';
import { ScreenHeader } from '../../components/ui/ScreenHeader';

export default function StaffScreen() {


  const router = useRouter();
  const { staff, loading, refreshing, refresh } = useStaff();

  const handleAddPress = useGuardedPress(() => {
    router.push(ROUTES.STAFF_ADD as any);
  });

  const handleEditPress = useGuardedPress((id: string) => {
    router.push(ROUTES.STAFF_EDIT(id) as any);
  });

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
      <EmptyState
        icon="person-outline"
        title="No staff accounts yet."
        message="Add the first team member to grant lab access."
        actionText="Add Staff"
        onAction={handleAddPress}
      />
    );
  };

  return (
    <TabPageLayout
      backgroundColor={AppColors.white}
      header={<ScreenHeader variant="tab" title="Manage Staff" />}
      floatingAction={
        <Fab
          icon="add"
          label="Add Staff"
          onPress={handleAddPress}
        />
      }
    >
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
            tabPageStyles.listWithoutControls,
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
    </TabPageLayout>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.white,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
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
    backgroundColor: AppColors.background,
    borderColor: '#CBD5E1',
  },
  staffCardInactive: {
    backgroundColor: '#FAFAFA',
    borderColor: AppColors.border,
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
    backgroundColor: AppColors.textSecondary,
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
    marginRight: 8,
  },
  staffName: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.bodyStrong,
    fontWeight: AppTypography.weight.bold,
    color: AppColors.navy,
    marginBottom: 3,
  },
  staffNameInactive: {
    color: AppColors.textSecondary,
  },
  staffUsername: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.supporting,
    color: AppColors.textSecondary,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
