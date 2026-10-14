import db from '../config/database';
import { getTransactions } from './borrowRepository';
import { DashboardData, DashboardOverdueItem, DashboardRecentTransaction } from '../types';

export const dashboardRepository = {
  getDashboardData(): DashboardData {
    // 1. Total equipment count (or sum if counting total units)
    const eqRow = db.prepare<[], { count: number }>('SELECT COUNT(*) as count FROM equipment').get();
    const totalEquipment = eqRow ? Number(eqRow.count) : 0;

    // 2. Transactions
    const allTransactions = getTransactions();

    const borrowedTx = allTransactions.filter((t) => t.status === 'borrowed');
    const overdueTx = allTransactions.filter((t) => t.status === 'overdue');

    const totalBorrowed = borrowedTx.length;
    const totalOverdue = overdueTx.length;

    // 3. Overdue items formatted for dashboard
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueItems: DashboardOverdueItem[] = overdueTx.map((tx) => {
      const dueDate = new Date(tx.due_date);
      dueDate.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - dueDate.getTime();
      const diffDays = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));

      let title = tx.items.length > 0 ? tx.items[0].equipment_name : 'Equipment';
      if (tx.items.length > 1) {
        title += ` +${tx.items.length - 1}`;
      }

      return {
        id: tx.transaction_code,
        transaction_code: tx.transaction_code,
        title,
        borrower_name: tx.borrower_name,
        due_date: tx.due_date,
        days_late: diffDays,
        days_late_label: `${diffDays}d late`,
      };
    });

    // 4. Recent transactions
    const recentTransactions: DashboardRecentTransaction[] = allTransactions
      .slice(0, 10)
      .map((tx) => {
        let title = tx.items.length > 0 ? tx.items[0].equipment_name : 'Equipment';
        if (tx.items.length > 1) {
          title += ` +${tx.items.length - 1}`;
        }

        return {
          id: tx.transaction_code,
          transaction_code: tx.transaction_code,
          title,
          borrower_name: tx.borrower_name,
          status: tx.status,
          borrow_date: tx.borrow_date,
          due_date: tx.due_date,
        };
      });

    return {
      stats: {
        total_equipment: totalEquipment,
        total_borrowed: totalBorrowed,
        total_overdue: totalOverdue,
      },
      overdue_items: overdueItems,
      recent_transactions: recentTransactions,
    };
  },
};
