import { randomUUID } from 'expo-crypto';
import type { EquipmentWithDetails } from '../types';
import { getLocalDatabase } from './database';
import { LocalError, optionalText, positiveInteger, text } from './validation';

export function getEquipment(): EquipmentWithDetails[] {
  const items = getLocalDatabase().getAllSync<EquipmentWithDetails>(`
    SELECT e.*, COALESCE(SUM(CASE WHEN br.status != 'returned' THEN br.quantity ELSE 0 END),0) AS borrowed_count
    FROM equipment e LEFT JOIN borrow_records br ON br.equipment_id=e.id
    GROUP BY e.id ORDER BY e.name COLLATE NOCASE
  `);
  return items.map(item => ({ ...item,
    available_quantity: Math.max(0, item.total_quantity - item.borrowed_count),
    status: item.borrowed_count >= item.total_quantity ? 'Out' : item.borrowed_count > 0 ? 'Partial' : 'Available',
  }));
}

export function findEquipment(id: string): EquipmentWithDetails {
  const item = getEquipment().find(item => item.id === id);
  if (!item) throw new LocalError('Equipment not found.', 404);
  return item;
}

export function saveEquipment(body: Record<string, unknown>, id?: string): EquipmentWithDetails {
  const db = getLocalDatabase();
  const name = text(body.name, 'Equipment name', 2);
  const quantity = positiveInteger(body.total_quantity, 'Total quantity');
  if (id && quantity < findEquipment(id).borrowed_count) {
    throw new LocalError('Total quantity cannot be lower than the quantity currently borrowed.');
  }
  const productId = optionalText(body.product_id);
  if (productId && getEquipment().some(item => item.product_id === productId && item.id !== id)) {
    throw new LocalError('That equipment tag is already in use.', 409);
  }
  const now = new Date().toISOString();
  const values = [productId, name, optionalText(body.brand), optionalText(body.model), optionalText(body.description), quantity, now];
  const equipmentId = id || randomUUID();
  if (id) {
    db.runSync('UPDATE equipment SET product_id=?,name=?,brand=?,model=?,description=?,total_quantity=?,updated_at=? WHERE id=?', [...values, id]);
  } else {
    db.runSync('INSERT INTO equipment (product_id,name,brand,model,description,total_quantity,updated_at,id,created_at) VALUES (?,?,?,?,?,?,?,?,?)', [...values, equipmentId, now]);
  }
  return findEquipment(equipmentId);
}

export function deleteEquipment(id: string): boolean {
  const item = findEquipment(id);
  if (item.borrowed_count > 0) throw new LocalError('Return all borrowed units before deleting equipment.');
  const db = getLocalDatabase();
  // Keep loan history intact instead of silently cascading deleted equipment into records.
  if (db.getFirstSync('SELECT id FROM borrow_records WHERE equipment_id=? LIMIT 1', id)) {
    throw new LocalError('Equipment with transaction history cannot be deleted.');
  }
  db.runSync('DELETE FROM equipment WHERE id=?', id);
  return true;
}
