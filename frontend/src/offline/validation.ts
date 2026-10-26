export class LocalError extends Error {
  constructor(message: string, public readonly statusCode = 400) {
    super(message);
  }
}

export function text(value: unknown, label: string, minLength = 1): string {
  if (typeof value !== 'string' || value.trim().length < minLength) {
    throw new LocalError(`${label} must contain at least ${minLength} character(s).`);
  }
  return value.trim();
}

export function optionalText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function positiveInteger(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) {
    throw new LocalError(`${label} must be a positive whole number.`);
  }
  return value;
}

export function dateOnly(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function validDate(value: unknown, label: string): string {
  const result = text(value, label);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || Number.isNaN(Date.parse(result)) || new Date(result).toISOString().slice(0, 10) !== result) {
    throw new LocalError(`${label} must be a valid date.`);
  }
  return result;
}
