import { Router } from 'express';
import {
  getAll,
  getById,
  createTransaction,
  returnRecord,
  getTransactions,
  getTransactionByCode,
  processReturn,
} from '../controllers/borrowController';

const router = Router();

// GET  /api/borrow/transactions       – list transactions (supports ?status=&search=)
router.get('/transactions', getTransactions);

// GET  /api/borrow/transactions/:code – single transaction with all items
router.get('/transactions/:code', getTransactionByCode);

// POST /api/borrow/return             – process return (transaction or selected items)
router.post('/return', processReturn);

// GET  /api/borrow                    – list borrow records (supports ?status=)
router.get('/', getAll);

// GET  /api/borrow/:id                – single record
router.get('/:id', getById);

// POST /api/borrow                    – create borrow transaction (multi-step flow)
router.post('/', createTransaction);

// PUT  /api/borrow/:id/return         – mark single equipment as returned
router.put('/:id/return', returnRecord);

export default router;
