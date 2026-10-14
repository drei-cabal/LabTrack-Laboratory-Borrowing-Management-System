import { Router } from 'express';
import * as staffController from '../controllers/staffController';

const router = Router();

// Staff listing & detail endpoints (publicly accessible so app and borrow flow can retrieve staff)
router.get('/', staffController.getAll);
router.get('/:id', staffController.getById);

// Staff management operations
router.post('/', staffController.create);
router.put('/:id', staffController.update);
router.put('/:id/status', staffController.toggleStatus);
router.delete('/:id', staffController.deleteStaff);

export default router;
