import { Router } from 'express';
import authRoutes from './auth.routes';
import equipmentRoutes from './equipment.routes';
import borrowRoutes from './borrow.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/equipment', equipmentRoutes);
router.use('/borrow', borrowRoutes);

export default router;
