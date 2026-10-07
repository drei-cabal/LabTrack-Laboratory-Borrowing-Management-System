import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateEquipmentInput } from '../middleware/validator';
import {
  getAll,
  getById,
  create,
  update,
  deleteEquipment,
} from '../controllers/equipmentController';

const router = Router();

// GET    /api/equipment          – public (search & filter supported via query params)
router.get('/', getAll);

// GET    /api/equipment/:id      – public
router.get('/:id', getById);

// POST   /api/equipment          – create equipment
router.post('/', validateEquipmentInput, create);

// PUT    /api/equipment/:id      – update equipment
router.put('/:id', validateEquipmentInput, update);

// DELETE /api/equipment/:id      – delete equipment
router.delete('/:id', deleteEquipment);

export default router;
