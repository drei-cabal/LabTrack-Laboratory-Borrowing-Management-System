import { Request, Response } from 'express';
import { staffRepository } from '../repositories/staffRepository';
import { handleSuccess, handleError } from '../middleware/errorHandler';
import { CreateStaffPayload, UpdateStaffPayload } from '../types';

/**
 * GET /api/staff
 * Lists all staff members with optional search and role filtering.
 */
export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const { search, role } = req.query as { search?: string; role?: string };
    const staff = staffRepository.getAll(search, role);
    handleSuccess(res, staff, 'Staff retrieved successfully.');
  } catch (error) {
    handleError(res, error, 'staffController.getAll');
  }
}

/**
 * GET /api/staff/:id
 * Retrieves details for a specific staff member.
 */
export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const staff = staffRepository.getById(id);

    if (!staff) {
      res.status(404).json({
        success: false,
        error: 'Staff member not found.',
        statusCode: 404,
      });
      return;
    }

    handleSuccess(res, staff, 'Staff details retrieved.');
  } catch (error) {
    handleError(res, error, 'staffController.getById');
  }
}

/**
 * POST /api/staff
 * Creates a new staff member account.
 */
export async function create(req: Request, res: Response): Promise<void> {
  try {
    const { full_name, username, email, password, role } = req.body as CreateStaffPayload;

    const errors: string[] = [];
    if (!full_name || full_name.trim().length < 2) {
      errors.push('Full name is required (minimum 2 characters).');
    }
    if (!username || username.trim().length < 3) {
      errors.push('Username is required (minimum 3 characters).');
    }
    if (email && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.push('Please enter a valid email address.');
    }
    if (!password || password.length < 6) {
      errors.push('Password must be at least 6 characters.');
    }
    if (role && !['admin', 'assistant'].includes(role)) {
      errors.push("Role must be 'admin' or 'assistant'.");
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        error: errors[0],
        errors,
        statusCode: 400,
      });
      return;
    }

    const cleanUsername = username.replace(/^@/, '').trim().toLowerCase();
    const existing = staffRepository.getByUsername(cleanUsername);
    if (existing) {
      res.status(409).json({
        success: false,
        error: `Username '@${cleanUsername}' is already taken.`,
        statusCode: 409,
      });
      return;
    }

    const newStaff = staffRepository.create({
      full_name: full_name.trim(),
      username: cleanUsername,
      email: email ? email.trim().toLowerCase() : undefined,
      password,
      role: role ?? 'assistant',
    });

    handleSuccess(res, newStaff, 'Staff account created successfully.', 201);
  } catch (error) {
    handleError(res, error, 'staffController.create');
  }
}

/**
 * PUT /api/staff/:id
 * Updates an existing staff member's details.
 */
export async function update(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const existing = staffRepository.getById(id);

    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'Staff member not found.',
        statusCode: 404,
      });
      return;
    }

    const { full_name, username, email, password, role, is_active } = req.body as UpdateStaffPayload;

    if (email && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      res.status(400).json({
        success: false,
        error: 'Please enter a valid email address.',
        statusCode: 400,
      });
      return;
    }

    if (username) {
      const cleanUsername = username.replace(/^@/, '').trim().toLowerCase();
      const conflict = staffRepository.getByUsername(cleanUsername);
      if (conflict && conflict.id !== id) {
        res.status(409).json({
          success: false,
          error: `Username '@${cleanUsername}' is already in use by another account.`,
          statusCode: 409,
        });
        return;
      }
    }

    // Safety: prevent demoting or deactivating the last active administrator
    if (
      existing.role === 'admin' &&
      existing.is_active &&
      (role === 'assistant' || is_active === false)
    ) {
      const activeAdmins = staffRepository.countActiveAdmins();
      if (activeAdmins <= 1) {
        res.status(400).json({
          success: false,
          error: 'Cannot deactivate or demote the last active administrator.',
          statusCode: 400,
        });
        return;
      }
    }

    const updated = staffRepository.update(id, {
      full_name,
      username,
      email: email !== undefined ? (email ? email.trim().toLowerCase() : '') : undefined,
      password,
      role,
      is_active,
    });

    handleSuccess(res, updated, 'Staff member updated successfully.');
  } catch (error) {
    handleError(res, error, 'staffController.update');
  }
}

/**
 * PUT /api/staff/:id/status
 * Deactivates or reactivates a staff member.
 */
export async function toggleStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { is_active } = req.body as { is_active?: boolean };

    if (typeof is_active !== 'boolean') {
      res.status(400).json({
        success: false,
        error: "'is_active' must be a boolean (true or false).",
        statusCode: 400,
      });
      return;
    }

    const existing = staffRepository.getById(id);
    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'Staff member not found.',
        statusCode: 404,
      });
      return;
    }

    // Safety: prevent deactivating the last active administrator
    if (!is_active && existing.role === 'admin' && existing.is_active) {
      const activeAdmins = staffRepository.countActiveAdmins();
      if (activeAdmins <= 1) {
        res.status(400).json({
          success: false,
          error: 'Cannot deactivate the last active administrator.',
          statusCode: 400,
        });
        return;
      }
    }

    const updated = staffRepository.toggleStatus(id, is_active);
    const actionLabel = is_active ? 'reactivated' : 'deactivated';
    handleSuccess(res, updated, `Staff account ${actionLabel} successfully.`);
  } catch (error) {
    handleError(res, error, 'staffController.toggleStatus');
  }
}

/**
 * DELETE /api/staff/:id
 * Permanently removes a staff member account.
 */
export async function deleteStaff(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const existing = staffRepository.getById(id);

    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'Staff member not found.',
        statusCode: 404,
      });
      return;
    }

    // Safety: prevent deleting the last active admin
    if (existing.role === 'admin' && existing.is_active) {
      const activeAdmins = staffRepository.countActiveAdmins();
      if (activeAdmins <= 1) {
        res.status(400).json({
          success: false,
          error: 'Cannot delete the last active administrator.',
          statusCode: 400,
        });
        return;
      }
    }

    staffRepository.delete(id);
    handleSuccess(res, { id }, 'Staff member deleted successfully.');
  } catch (error) {
    handleError(res, error, 'staffController.deleteStaff');
  }
}
