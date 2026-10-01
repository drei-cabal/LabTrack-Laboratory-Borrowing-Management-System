import { equipmentRepository } from '../../backend/repositories/equipmentRepository';
import { EquipmentWithDetails, BorrowRecordEntity } from '../../backend/types';
import { validateEquipmentInput } from '../../middleware/validator';
import {
  validateQuantityUpdateRule,
  validateEquipmentDeletionRule,
} from '../../middleware/businessRules';
import { AppLogger } from '../../middleware/logger';
import { ApiResponse, handleSuccess, handleError } from '../../middleware/errorHandler';

export interface EquipmentDetailPayload {
  equipment: EquipmentWithDetails;
  activeRecords: BorrowRecordEntity[];
}

export class EquipmentController {
  async getAll(params?: {
    search?: string;
    filter?: 'All' | 'Available' | 'Partial' | 'Out';
  }): Promise<ApiResponse<EquipmentWithDetails[]>> {
    try {
      AppLogger.info('EquipmentController', 'Fetching all equipment', params);
      let items = await equipmentRepository.getAll();

      // Search filtering
      if (params?.search && params.search.trim()) {
        const query = params.search.trim().toLowerCase();
        items = items.filter(
          (item) =>
            item.name.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query)
        );
      }

      // Status filtering
      if (params?.filter && params.filter !== 'All') {
        items = items.filter((item) => item.status === params.filter);
      }

      return handleSuccess(items);
    } catch (error) {
      return handleError(error, 'EquipmentController.getAll');
    }
  }

  async getById(id: string): Promise<ApiResponse<EquipmentDetailPayload>> {
    try {
      AppLogger.info('EquipmentController', `Fetching equipment details for ${id}`);
      const equipment = await equipmentRepository.getById(id);
      if (!equipment) {
        return {
          success: false,
          statusCode: 404,
          error: 'Equipment not found.',
        };
      }

      const activeRecords = await equipmentRepository.getActiveRecords(id);

      return handleSuccess({
        equipment,
        activeRecords,
      });
    } catch (error) {
      return handleError(error, 'EquipmentController.getById');
    }
  }

  async create(data: {
    name: string;
    description: string;
    total_quantity: number;
  }): Promise<ApiResponse<EquipmentWithDetails>> {
    try {
      AppLogger.info('EquipmentController', 'Creating equipment', data);

      // Validate middleware
      const validation = validateEquipmentInput(data);
      if (!validation.isValid) {
        return {
          success: false,
          statusCode: 400,
          error: Object.values(validation.errors)[0],
          errors: validation.errors,
        };
      }

      const created = await equipmentRepository.create(
        data.name.trim(),
        data.description.trim(),
        Number(data.total_quantity)
      );

      const withDetails: EquipmentWithDetails = {
        ...created,
        borrowed_count: 0,
        available_quantity: created.total_quantity,
        status: 'Available',
      };

      return handleSuccess(withDetails, 'Equipment created successfully', 201);
    } catch (error) {
      return handleError(error, 'EquipmentController.create');
    }
  }

  async update(
    id: string,
    data: {
      name: string;
      description: string;
      total_quantity: number;
    }
  ): Promise<ApiResponse<EquipmentWithDetails>> {
    try {
      AppLogger.info('EquipmentController', `Updating equipment ${id}`, data);

      // Validate input middleware
      const validation = validateEquipmentInput(data);
      if (!validation.isValid) {
        return {
          success: false,
          statusCode: 400,
          error: Object.values(validation.errors)[0],
          errors: validation.errors,
        };
      }

      // Check business rule middleware
      const ruleResult = await validateQuantityUpdateRule(id, Number(data.total_quantity));
      if (!ruleResult.allowed) {
        return {
          success: false,
          statusCode: 422,
          error: ruleResult.message || 'Operation not allowed by business rules.',
        };
      }

      const success = await equipmentRepository.update(
        id,
        data.name.trim(),
        data.description.trim(),
        Number(data.total_quantity)
      );

      if (!success) {
        return {
          success: false,
          statusCode: 404,
          error: 'Equipment not found or no changes made.',
        };
      }

      const updated = await equipmentRepository.getById(id);
      return handleSuccess(updated!, 'Equipment updated successfully');
    } catch (error) {
      return handleError(error, 'EquipmentController.update');
    }
  }

  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      AppLogger.info('EquipmentController', `Deleting equipment ${id}`);

      // Check business rule middleware
      const ruleResult = await validateEquipmentDeletionRule(id);
      if (!ruleResult.allowed) {
        return {
          success: false,
          statusCode: 422,
          error: ruleResult.message || 'Cannot delete equipment with active records.',
        };
      }

      const deleted = await equipmentRepository.delete(id);
      if (!deleted) {
        return {
          success: false,
          statusCode: 404,
          error: 'Equipment not found.',
        };
      }

      return handleSuccess(true, 'Equipment deleted successfully');
    } catch (error) {
      return handleError(error, 'EquipmentController.delete');
    }
  }
}

export const equipmentController = new EquipmentController();
