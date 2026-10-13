import { Router } from 'express';
import {
  getTransactions,
  getTransactionByCode,
  processReturn,
  returnRecord,
} from '../controllers/borrowController';

const router = Router();

// GET  /api/records             – list transactions (supports ?status=&search=)
router.get('/', getTransactions);

// GET  /api/records/:code       – get transaction detail by code
router.get('/:code', getTransactionByCode);

// POST /api/records/return      – return items or whole transaction
router.post('/return', processReturn);

// PUT  /api/records/:id/return  – return single item
router.put('/:id/return', returnRecord);

export default router;
