import { Router } from 'express';
import {
  getAll,
  getById,
  createTransaction,
  returnRecord,
} from '../controllers/borrowController';

const router = Router();

// GET  /api/borrow          – list borrow records (supports ?status=)
router.get('/', getAll);

// GET  /api/borrow/:id      – single record
router.get('/:id', getById);

// POST /api/borrow          – create borrow transaction (multi-step flow)
router.post('/', createTransaction);

// PUT  /api/borrow/:id/return – mark equipment as returned
router.put('/:id/return', returnRecord);

export default router;
