import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { EquipmentWithDetails } from '../../backend/types';
import { AppColors } from '../../constants/colors';
import { StatusBadge } from '../ui/StatusBadge';
import { ProgressBar } from '../ui/ProgressBar';

export interface EquipmentCardProps {
  item: EquipmentWithDetails;
  onPress: () => void;
}

export function EquipmentCard({ item, onPress }: EquipmentCardProps) {
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
          <Text style={styles.title} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.description} numberOfLines={1}>
            {item.description || 'No description provided'}
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
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  cardPressed: {
    backgroundColor: '#F8FAFC',
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
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.text,
    marginBottom: 3,
  },
  description: {
    fontSize: 12,
    color: AppColors.textSecondary,
    lineHeight: 16,
  },
  bottomRow: {
    marginTop: 4,
  },
});
