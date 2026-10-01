export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateEquipmentInput(data: {
  name?: string;
  description?: string;
  total_quantity?: number;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.name || !data.name.trim()) {
    errors.name = 'Equipment name is required.';
  } else if (data.name.trim().length < 2) {
    errors.name = 'Equipment name must be at least 2 characters.';
  }

  if (data.total_quantity === undefined || data.total_quantity === null) {
    errors.total_quantity = 'Total quantity is required.';
  } else if (isNaN(data.total_quantity) || data.total_quantity < 1) {
    errors.total_quantity = 'Total quantity must be at least 1.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
