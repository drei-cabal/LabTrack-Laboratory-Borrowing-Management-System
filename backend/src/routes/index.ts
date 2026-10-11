import { Router } from 'express';
import authRoutes from './auth.routes';
import equipmentRoutes from './equipment.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/equipment', equipmentRoutes);

export default router;
