import { Directory, File, Paths } from 'expo-file-system';
import { randomUUID } from 'expo-crypto';
import type { ApiResponse } from '../services/api';
import { deleteStaff, endSession, findStaff, getSessionUser, getStaff, needsSetup, saveStaff, setUpAdministrator, signIn } from './accounts';
import { deleteEquipment, findEquipment, getEquipment, saveEquipment } from './inventory';
import { createTransaction, findTransaction, getBorrowRecords, getDashboard, getTransactions, returnItems } from './transactions';
import { LocalError, optionalText } from './validation';

// Serialize asynchronous password operations with stock and account mutations.
let pending: Promise<unknown> = Promise.resolve();

export function handleOfflineRequest<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<ApiResponse<T>> {
  const operation = pending.then(() => dispatch(path, options, token));
  pending = operation.catch(() => undefined);
  return operation.then(data => ({ success: true, data: data as T, statusCode: 200 })).catch(error => ({
    success: false,
    error: error instanceof LocalError ? error.message : 'Could not complete the operation on this device. Please try again.',
    statusCode: error instanceof LocalError ? error.statusCode : 500,
  }));
}

async function dispatch(path: string, options: RequestInit, token?: string | null): Promise<unknown> {
  const url = new URL(path, 'https://local.labtrack');
  const [resource, rawId, action] = url.pathname.split('/').filter(Boolean);
  const id = rawId ? decodeURIComponent(rawId) : undefined;
  const method = options.method || 'GET';
  let body: Record<string, unknown> = {};
  if (options.body) {
    try {
      const parsed: unknown = JSON.parse(String(options.body));
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid body');
      body = parsed as Record<string, unknown>;
    } catch {
      throw new LocalError('Invalid request data.');
    }
  }
  if (resource === 'auth') {
    if (id === 'setup-status' && method === 'GET') return { needs_setup: needsSetup() };
    if (id === 'setup' && method === 'POST') return setUpAdministrator(body);
    if (id === 'login' && method === 'POST') return signIn(body);
    if (id === 'logout' && method === 'POST') return endSession(token);
    if (id === 'me' && method === 'GET') return getSessionUser(token);
    throw new LocalError('Account operation not found.', 404);
  }
  const actor = getSessionUser(token);
  if (resource === 'dashboard' && method === 'GET') return getDashboard();
  if (resource === 'equipment') {
    if (method === 'GET' && !id) {
      const search = (url.searchParams.get('search') || '').toLowerCase();
      const filter = url.searchParams.get('filter');
      return getEquipment().filter(item => (!search || [item.name, item.product_id, item.brand, item.model, item.description].some(field => field?.toLowerCase().includes(search)))
        && (!filter || filter === 'All' || item.status === filter));
    }
    if (method === 'GET' && id) return { equipment: findEquipment(id), activeRecords: getBorrowRecords().filter(item => item.equipment_id === id && item.status !== 'returned') };
    if (method === 'POST' && !id) return saveEquipment(body);
    if (method === 'PUT' && id) return saveEquipment(body, id);
    if (method === 'DELETE' && id) return deleteEquipment(id);
  }
  if (resource === 'records' || resource === 'borrow') {
    if (method === 'POST' && id === 'return') return returnItems(body);
    if (method === 'PUT' && id && action === 'return') {
      const result = returnItems({ ...body, record_ids: [id] });
      return result.transaction.items.find(item => item.id === id);
    }
    if (method === 'POST' && resource === 'borrow' && !id) {
      const photo = optionalText(body.photo_proof);
      let copiedPhoto: File | undefined;
      if (photo) {
        if (!photo.startsWith('file://') && !photo.startsWith('content://')) throw new LocalError('Choose a photo from this device.');
        const folder = new Directory(Paths.document, 'loan-proofs');
        folder.create({ idempotent: true, intermediates: true });
        copiedPhoto = new File(folder, `${randomUUID()}.${photo.match(/\.(png|jpe?g|heic|webp)(?:\?|$)/i)?.[1] || 'jpg'}`);
        await new File(photo).copy(copiedPhoto);
        body.photo_proof = copiedPhoto.uri;
      }
      try {
        return createTransaction(body, actor.full_name);
      } catch (error) {
        if (copiedPhoto?.exists) copiedPhoto.delete();
        throw error;
      }
    }
    if (method === 'GET') {
      const status = url.searchParams.get('status');
      if (resource === 'borrow' && id !== 'transactions') {
        const records = getBorrowRecords();
        if (id) {
          const record = records.find(item => item.id === id);
          if (!record) throw new LocalError('Borrow record not found.', 404);
          return record;
        }
        return records.filter(item => !status || status === 'all' || item.status === status);
      }
      if (id && id !== 'transactions') return findTransaction(id);
      const search = (url.searchParams.get('search') || '').toLowerCase();
      return getTransactions().filter(item => (!status || status === 'all' || (status === 'active' ? item.status !== 'returned' : item.status === status))
        && (!search || [item.borrower_name, item.borrower_id, item.transaction_code, item.items_summary].some(field => field.toLowerCase().includes(search))));
    }
  }
  if (resource === 'staff') {
    if (method === 'GET') {
      if (id) return findStaff(id);
      const search = (url.searchParams.get('search') || '').toLowerCase();
      const role = url.searchParams.get('role');
      return getStaff().filter(user => (!role || user.role === role) && (!search || [user.username, user.full_name, user.email || ''].some(field => field.toLowerCase().includes(search))));
    }
    if (actor.role !== 'admin') throw new LocalError('Only an administrator can manage staff accounts.', 403);
    if (method === 'POST' && !id) return saveStaff(body);
    if (method === 'PUT' && id) return saveStaff(body, id);
    if (method === 'DELETE' && id) return deleteStaff(id);
  }
  throw new LocalError('Operation not found.', 404);
}
