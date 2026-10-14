import { Router } from 'express';
import authRoutes from './auth.routes';
import equipmentRoutes from './equipment.routes';
import borrowRoutes from './borrow.routes';
import recordsRoutes from './records.routes';
import staffRoutes from './staff.routes';
import dashboardRoutes from './dashboard.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/equipment', equipmentRoutes);
router.use('/borrow', borrowRoutes);
router.use('/records', recordsRoutes);
router.use('/staff', staffRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;


