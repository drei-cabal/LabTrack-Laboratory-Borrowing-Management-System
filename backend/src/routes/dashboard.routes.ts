import { Router } from 'express';
import { getDashboard } from '../controllers/dashboardController';

const router = Router();

// GET /api/dashboard
router.get('/', getDashboard);

export default router;
