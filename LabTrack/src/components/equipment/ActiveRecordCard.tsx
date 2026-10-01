import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BorrowRecordEntity } from '../../backend/types';
import { AppColors } from '../../constants/colors';
import { StatusBadge } from '../ui/StatusBadge';

export interface ActiveRecordCardProps {
  record: BorrowRecordEntity;
  onReturn?: (id: string) => void;
}

export function ActiveRecordCard({ record }: ActiveRecordCardProps) {
  const isOverdue = record.status === 'overdue';

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.name}>{record.borrower_name}</Text>
        <StatusBadge status={record.status} />
      </View>

      <Text style={styles.idText}>ID: {record.borrower_id}</Text>

      <View style={styles.dateRow}>
        <Text style={styles.dateText}>From: {record.borrow_date}</Text>
        <Text style={[styles.dateText, isOverdue ? styles.overdueDateText : null]}>
          Due: {record.due_date}
        </Text>
      </View>
    </View>
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
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.text,
  },
  idText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  overdueDateText: {
    color: AppColors.overdue,
    fontWeight: '600',
  },
});
