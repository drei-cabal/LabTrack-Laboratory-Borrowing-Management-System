import { AppTypography } from '../../constants/typography';
import React from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEquipment } from '../../hooks/useEquipment';
import { AppColors } from '../../constants/colors';
import { EquipmentCard } from '../../components/equipment/EquipmentCard';
import { FilterChips, type FilterOption } from '../../components/ui/FilterChips';
import { EmptyState } from '../../components/ui/EmptyState';
import { TabPageLayout, tabPageStyles } from '../../components/ui/TabPageLayout';
import { Fab } from '../../components/ui/Fab';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { ROUTES } from '../../routing/routes';

const FILTER_OPTIONS: readonly { key: FilterOption; label: string }[] = [
  { key: 'All', label: 'All' },
  { key: 'Available', label: 'Available' },
  { key: 'Partial', label: 'Partial' },
  { key: 'Out', label: 'Out' },
];

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

  return (
    <TabPageLayout
      backgroundColor={AppColors.background}
      header={
        <ScreenHeader
          variant="tab"
          title="Equipment"
        />
      }
      floatingAction={
        <Fab
          icon="add"
          label="Add Equipment"
          onPress={handleAddEquipment}
        />
      }
    >
      {/* Search Input Bar */}
      <View style={[tabPageStyles.searchFrame, styles.searchContainer]}>
        <Ionicons
          name="search-outline"
          size={18}
          color={AppColors.textMuted}
          style={tabPageStyles.searchIcon}
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
      <FilterChips options={FILTER_OPTIONS} selected={filter} onSelect={setFilter} />

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
          contentContainerStyle={tabPageStyles.listAfterFilters}
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
  searchContainer: {
    backgroundColor: AppColors.white,
    borderColor: AppColors.border,
  },
  searchInput: {
    flex: 1,
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.body,
    color: AppColors.text,
    padding: 0,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
