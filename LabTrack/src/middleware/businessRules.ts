import { equipmentRepository } from '../backend/repositories/equipmentRepository';

export interface BusinessRuleResult {
  allowed: boolean;
  message?: string;
}

export async function validateQuantityUpdateRule(
  equipmentId: string,
  newTotalQuantity: number
): Promise<BusinessRuleResult> {
  const equipment = await equipmentRepository.getById(equipmentId);
  if (!equipment) {
    return { allowed: false, message: 'Equipment not found.' };
  }

  if (newTotalQuantity < equipment.borrowed_count) {
    return {
      allowed: false,
      message: `Cannot reduce total quantity to ${newTotalQuantity}. There are currently ${equipment.borrowed_count} items borrowed.`,
    };
  }

  return { allowed: true };
}

export async function validateEquipmentDeletionRule(
  equipmentId: string
): Promise<BusinessRuleResult> {
  const equipment = await equipmentRepository.getById(equipmentId);
  if (!equipment) {
    return { allowed: false, message: 'Equipment not found.' };
  }

  if (equipment.borrowed_count > 0) {
    return {
      allowed: false,
      message: `Cannot delete "${equipment.name}". There are currently ${equipment.borrowed_count} active borrowed record(s). Return them first.`,
    };
  }

  return { allowed: true };
}
