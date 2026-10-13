import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEquipment } from '../../hooks/useEquipment';
import { AppColors } from '../../constants/colors';
import { EquipmentCard } from '../../components/equipment/EquipmentCard';
import { FilterChips } from '../../components/ui/FilterChips';
import { EmptyState } from '../../components/ui/EmptyState';
import { ROUTES } from '../../routing/routes';
import { authService } from '../../services/authService';

export default function EquipmentScreen() {
  const router = useRouter();
  const {
    items,
    loading,
    search,
    setSearch,
    filter,
    setFilter,
    refresh,
  } = useEquipment();

  const handleAddEquipment = () => {
    router.push(ROUTES.EQUIPMENT_ADD as any);
  };

  const handleItemPress = (id: string) => {
    router.push(ROUTES.EQUIPMENT_DETAIL(id) as any);
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of LabTrack?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await authService.logout();
          router.replace(ROUTES.LOGIN as any);
        },
      },
    ]);
  };


  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Equipment</Text>
          <View style={styles.headerActions}>
            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.iconPressed]}
              accessibilityRole="button"
              accessibilityLabel="Log out"
            >
              <Ionicons name="log-out-outline" size={19} color={AppColors.navy} />
            </Pressable>
          </View>
        </View>

        {/* Search Input Bar */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={18}
            color={AppColors.textMuted}
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Search equipment..."
            placeholderTextColor={AppColors.textMuted}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {search ? (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={AppColors.textMuted} />
            </Pressable>
          ) : null}
        </View>

        {/* Filter Chips */}
        <View style={styles.filterSection}>
          <FilterChips selected={filter} onSelect={setFilter} />
        </View>

        {/* List Content */}
        {loading && items.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={AppColors.navy} />
          </View>
        ) : items.length === 0 ? (
          <EmptyState
            message="No equipment added yet. Start by adding your first item to the inventory."
            actionText="Add Equipment"
            onAction={handleAddEquipment}
          />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <EquipmentCard item={item} onPress={() => handleItemPress(item.id)} />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={AppColors.navy} />
            }
          />
        )}

        {/* Floating Action Button (FAB) */}
        <Pressable
          onPress={handleAddEquipment}
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          accessibilityRole="button"
          accessibilityLabel="Add Equipment"
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.fabText}>Add Equipment</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPressed: {
    opacity: 0.7,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    marginHorizontal: 20,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: AppColors.text,
    padding: 0,
  },
  filterSection: {
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 90,
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
