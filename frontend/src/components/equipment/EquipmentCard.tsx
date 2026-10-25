import { AppTypography } from '../../constants/typography';
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { EquipmentWithDetails } from '../../types';
import { AppColors } from '../../constants/colors';
import { StatusBadge } from '../ui/StatusBadge';
import { ProgressBar } from '../ui/ProgressBar';

export interface EquipmentCardProps {
  item: EquipmentWithDetails;
  onPress: () => void;
}

export function EquipmentCard({ item, onPress }: EquipmentCardProps) {
  const subtitle = [item.brand, item.model].filter(Boolean).join(' ') || item.description || 'No notes';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Equipment ${item.name}`}
    >
      <View style={styles.topRow}>
        <View style={styles.titleContainer}>
          <View style={styles.nameRow}>
            {item.product_id ? (
              <View style={styles.productIdBadge}>
                <Text style={styles.productIdText}>{item.product_id}</Text>
              </View>
            ) : null}
            <Text style={styles.title} numberOfLines={1}>
              {item.name}
            </Text>
          </View>
          <Text style={styles.description} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        <StatusBadge status={item.status} />
      </View>

      <View style={styles.bottomRow}>
        <ProgressBar available={item.available_quantity} total={item.total_quantity} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  cardPressed: {
    backgroundColor: AppColors.background,
    borderColor: '#CBD5E1',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  productIdBadge: {
    backgroundColor: AppColors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  productIdText: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.micro,
    fontWeight: AppTypography.weight.bold,
    color: AppColors.navy,
  },
  title: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.bodyStrong,
    fontWeight: AppTypography.weight.bold,
    color: AppColors.text,
    flex: 1,
  },
  description: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.small,
    color: AppColors.textSecondary,
    lineHeight: AppTypography.lineHeight.small,
  },
  bottomRow: {
    marginTop: 4,
  },
});
