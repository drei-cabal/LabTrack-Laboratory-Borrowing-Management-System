import { AppTypography } from '../../constants/typography';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BorrowRecordEntity } from '../../types';
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
    backgroundColor: AppColors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
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
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.body,
    fontWeight: AppTypography.weight.bold,
    color: AppColors.text,
  },
  idText: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.small,
    color: AppColors.textSecondary,
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontFamily: AppTypography.fontFamily,
    fontSize: AppTypography.size.small,
    color: AppColors.textSecondary,
  },
  overdueDateText: {
    color: AppColors.overdue,
    fontWeight: AppTypography.weight.semibold,
  },
});
