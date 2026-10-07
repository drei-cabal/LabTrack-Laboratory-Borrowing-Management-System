import { Request, Response } from 'express';
import * as repo from '../repositories/equipmentRepository';
import { handleSuccess, handleError } from '../middleware/errorHandler';
import { EquipmentStatus, EquipmentWithDetails } from '../types';

// ─── GET /api/equipment ───────────────────────────────────────────────────────

/**
 * Returns all equipment, optionally filtered by status and/or searched
 * across name, product_id, brand, model, and description fields.
 *
 * Query params:
 *   search  – free-text search string
 *   filter  – 'All' | 'Available' | 'Partial' | 'Out'
 */
export function getAll(req: Request, res: Response): void {
  try {
    let equipment = repo.getAll();

    const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
    const filter = typeof req.query.filter === 'string' ? req.query.filter : 'All';

    // Apply text search
    if (search) {
      equipment = equipment.filter((eq) => {
        const fields = [eq.name, eq.product_id, eq.brand, eq.model, eq.description]
          .map((f) => (f ?? '').toLowerCase());
        return fields.some((f) => f.includes(search));
      });
    }

    // Apply status filter
    if (filter !== 'All') {
      const validStatuses: EquipmentStatus[] = ['Available', 'Partial', 'Out'];
      if (validStatuses.includes(filter as EquipmentStatus)) {
        equipment = equipment.filter((eq) => eq.status === filter);
      }
    }

    handleSuccess(res, equipment, `${equipment.length} equipment item(s) found.`);
  } catch (error) {
    handleError(res, error, 'equipmentController.getAll');
  }
}

// ─── GET /api/equipment/:id ───────────────────────────────────────────────────

/**
 * Returns a single equipment item plus its active borrow records.
 */
export function getById(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const equipment = repo.getById(id);

    if (!equipment) {
      res.status(404).json({
        success: false,
        error: `Equipment with id "${id}" not found.`,
        statusCode: 404,
      });
      return;
    }

    const activeRecords = repo.getActiveRecords(id);

    handleSuccess(res, { equipment, activeRecords });
  } catch (error) {
    handleError(res, error, 'equipmentController.getById');
  }
}

// ─── POST /api/equipment ──────────────────────────────────────────────────────

export function create(req: Request, res: Response): void {
  try {
    const { product_id, name, brand, model, description, total_quantity } = req.body as {
      product_id?: string;
      name: string;
      brand?: string;
      model?: string;
      description?: string;
      total_quantity: number;
    };

    const created = repo.create({
      product_id,
      name: name.trim(),
      brand,
      model,
      description: description ?? '',
      total_quantity: Number(total_quantity),
    });

    handleSuccess(res, created, 'Equipment created successfully.', 201);
  } catch (error) {
    handleError(res, error, 'equipmentController.create');
  }
}

// ─── PUT /api/equipment/:id ───────────────────────────────────────────────────

export function update(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const existing = repo.getById(id);

    if (!existing) {
      res.status(404).json({
        success: false,
        error: `Equipment with id "${id}" not found.`,
        statusCode: 404,
      });
      return;
    }

    const { product_id, name, brand, model, description, total_quantity } = req.body as {
      product_id?: string;
      name?: string;
      brand?: string;
      model?: string;
      description?: string;
      total_quantity?: number;
    };

    const updated = repo.update(id, {
      product_id,
      name: name?.trim(),
      brand,
      model,
      description,
      total_quantity: total_quantity !== undefined ? Number(total_quantity) : undefined,
    });

    if (!updated) {
      res.status(500).json({
        success: false,
        error: 'Failed to update equipment.',
        statusCode: 500,
      });
      return;
    }

    const result = repo.getById(id);
    handleSuccess(res, result, 'Equipment updated successfully.');
  } catch (error) {
    handleError(res, error, 'equipmentController.update');
  }
}

// ─── DELETE /api/equipment/:id ────────────────────────────────────────────────

/**
 * Deletes an equipment record.
 * Business rule: cannot delete if active borrow records exist.
 */
export function deleteEquipment(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const existing = repo.getById(id);

    if (!existing) {
      res.status(404).json({
        success: false,
        error: `Equipment with id "${id}" not found.`,
        statusCode: 404,
      });
      return;
    }

    const activeRecords = repo.getActiveRecords(id);
    if (activeRecords.length > 0) {
      res.status(409).json({
        success: false,
        error: `Cannot delete equipment with ${activeRecords.length} active borrow record(s). Return all items first.`,
        statusCode: 409,
      });
      return;
    }

    const deleted = repo.deleteById(id);
    if (!deleted) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete equipment.',
        statusCode: 500,
      });
      return;
    }

    handleSuccess(res, null, 'Equipment deleted successfully.');
  } catch (error) {
    handleError(res, error, 'equipmentController.delete');
  }
}
