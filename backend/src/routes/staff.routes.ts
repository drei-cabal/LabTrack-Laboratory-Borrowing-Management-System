import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import * as staffController from '../controllers/staffController';

const router = Router();

// Per Figma: "MANAGE STAFF (ADMIN ONLY)"
// All staff routes require an authenticated user with 'admin' role.
router.use(authenticate, requireAdmin);

router.get('/', staffController.getAll);
router.get('/:id', staffController.getById);
router.post('/', staffController.create);
router.put('/:id', staffController.update);
router.put('/:id/status', staffController.toggleStatus);
router.delete('/:id', staffController.deleteStaff);

export default router;
