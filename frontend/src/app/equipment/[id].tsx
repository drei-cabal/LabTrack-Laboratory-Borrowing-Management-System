import { screenStyles } from '../../components/ui/ScreenStyles';
import { AppTypography } from '../../constants/typography';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEquipmentDetail } from '../../hooks/useEquipmentDetail';
import { equipmentService } from '../../services/equipmentService';
import { AppColors } from '../../constants/colors';
import { EmptyState } from '../../components/ui/EmptyState';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { StatsSummary } from '../../components/equipment/StatsSummary';
import { ActiveRecordCard } from '../../components/equipment/ActiveRecordCard';
import { Button } from '../../components/ui/Button';
import { ROUTES } from '../../routing/routes';

export default function EquipmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { equipment, activeRecords, loading, error } = useEquipmentDetail(id);

  const handleEdit = () => {
    if (equipment) {
      router.push(ROUTES.EQUIPMENT_EDIT(equipment.id) as any);
    }
  };

  const handleDelete = () => {
    if (!equipment) return;

    if (equipment.borrowed_count > 0) {
      Alert.alert(
        'Cannot Delete',
        `This item cannot be deleted because there are currently ${equipment.borrowed_count} active borrowed item(s). Please ensure all items are returned first.`
      );
      return;
    }

    Alert.alert(
      'Delete Equipment',
      `Are you sure you want to permanently delete "${equipment.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const res = await equipmentService.delete(equipment.id);
            if (res.success) {
              Alert.alert('Deleted', 'Equipment has been removed.', [
                {
                  text: 'OK',
                  onPress: () => router.replace(ROUTES.EQUIPMENT as any),
                },
              ]);
            } else {
              Alert.alert('Error', res.error || 'Failed to delete equipment.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={[]}>
        <ScreenHeader title="Loading..." variant="detail" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={AppColors.navy} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !equipment) {
    return (
      <SafeAreaView style={styles.safeArea} edges={[]}>
        <ScreenHeader title="Equipment Details" variant="detail" />
        <View style={styles.center}>
          <Text style={styles.errorText}>{error || 'Equipment not found.'}</Text>
          <Button
            title="Go Back"
            variant="outline"
            size="sm"
            onPress={() => router.back()}
            style={styles.backBtn}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <ScreenHeader title={equipment.name} variant="detail" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Specs and Product ID Card */}
        <View style={styles.specsCard}>
          {equipment.product_id ? (
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>PRODUCT ID</Text>
              <View style={styles.productIdBadge}>
                <Text style={styles.productIdText}>{equipment.product_id}</Text>
              </View>
            </View>
          ) : null}

          {equipment.brand ? (
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>BRAND</Text>
              <Text style={styles.specValue}>{equipment.brand}</Text>
            </View>
          ) : null}

          {equipment.model ? (
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>MODEL</Text>
              <Text style={styles.specValue}>{equipment.model}</Text>
            </View>
          ) : null}
        </View>

        {/* Description section */}
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionLabel}>DESCRIPTION</Text>
          <Text style={styles.descriptionText}>
            {equipment.description || 'No description provided.'}
          </Text>
        </View>

        {/* Stats summary */}
        <StatsSummary
          total={equipment.total_quantity}
          borrowed={equipment.borrowed_count}
          available={equipment.available_quantity}
        />

        {/* Active records */}
        <View style={styles.recordsSection}>
          <Text style={styles.recordsHeader}>
            ACTIVE RECORDS ({activeRecords.length})
          </Text>

          {activeRecords.length === 0 ? (
            <EmptyState message="No active borrow records for this item." style={styles.emptyRecords} />
          ) : (
            activeRecords.map((record) => (
              <ActiveRecordCard key={record.id} record={record} />
            ))
          )}
        </View>

        {/* Bottom Actions Row */}
        <View style={styles.actionsRow}>
          <View style={styles.actionCol}>
            <Button
              title="Edit"
              variant="outline"
              onPress={handleEdit}
            />
          </View>
          <View style={styles.actionCol}>
            <Button
              title="Delete"
              variant="danger-outline"
              onPress={handleDelete}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    ...screenStyles.screen,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.body,
    color: AppColors.out,
    marginBottom: 16,
  },
  backBtn: {
    minWidth: 120,
  },
  specsCard: {
    ...screenStyles.card,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  specLabel: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.chip,
    fontWeight: AppTypography.weight.bold,
    color: AppColors.textSecondary,
    letterSpacing: 0.5,
  },
  specValue: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.supporting,
    fontWeight: AppTypography.weight.semibold,
    color: AppColors.text,
  },
  productIdBadge: {
    backgroundColor: AppColors.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  productIdText: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.chip,
    fontWeight: AppTypography.weight.bold,
    color: AppColors.navy,
  },
  descriptionSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.chip,
    fontWeight: AppTypography.weight.bold,
    color: AppColors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  descriptionText: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.body,
    color: AppColors.text,
    lineHeight: AppTypography.lineHeight.body,
  },
  recordsSection: {
    marginBottom: 28,
  },
  recordsHeader: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.small,
    fontWeight: AppTypography.weight.bold,
    color: AppColors.text,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  emptyRecords: {
    paddingVertical: 20,
    backgroundColor: AppColors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
    alignItems: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCol: {
    flex: 1,
  },
});
