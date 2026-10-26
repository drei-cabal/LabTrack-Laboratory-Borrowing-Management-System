const assert = require('node:assert/strict');
const { before, test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const ts = require('typescript');
const bcrypt = require('bcryptjs');
const initSqlJs = require('../../backend/node_modules/sql.js');
let SQL;
before(async () => { SQL = await initSqlJs(); });

function device(savedDatabase) {
  const inner = new SQL.Database(savedDatabase);
  const bindings = params => params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
  const all = (sql, ...params) => {
    const statement = inner.prepare(sql);
    try {
      statement.bind(bindings(params));
      const rows = [];
      while (statement.step()) rows.push(statement.getAsObject());
      return rows;
    } finally { statement.free(); }
  };
  const db = {
    getAllSync: all,
    getFirstSync: (...args) => all(...args)[0] || null,
    runSync(sql, ...params) { inner.run(sql, bindings(params)); return { changes: inner.getRowsModified() }; },
    execSync: sql => inner.exec(sql),
    withTransactionSync(callback) {
      inner.run('BEGIN');
      try { callback(); inner.run('COMMIT'); }
      catch (error) { inner.run('ROLLBACK'); throw error; }
    },
  };
  const cache = new Map();
  const files = new Set();
  class MockFile {
    constructor(...parts) { this.uri = parts.map(part => part.uri || part).join('/'); }
    get exists() { return files.has(this.uri); }
    async copy(destination) { files.add(destination.uri); }
    delete() { files.delete(this.uri); }
  }
  const mocks = {
    'expo-sqlite': { openDatabaseSync: () => db },
    'expo-crypto': { randomUUID: crypto.randomUUID, getRandomBytes: length => crypto.randomBytes(length) },
    'expo-file-system': { File: MockFile, Directory: class { constructor(...parts) { this.uri = parts.join('/'); } create() {} }, Paths: { document: 'file:///documents' } },
    bcryptjs: bcrypt,
  };
  function load(file) {
    file = path.resolve(file);
    if (cache.has(file)) return cache.get(file);
    if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file, 'utf8'));
    const exports = {};
    cache.set(file, exports);
    const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    vm.runInNewContext(compiled, { exports, URL, console, setTimeout, clearTimeout,
      require(name) {
        if (Object.hasOwn(mocks, name)) return mocks[name];
        if (!name.startsWith('.')) throw new Error(`Unexpected dependency: ${name}`);
        const target = path.resolve(path.dirname(file), name);
        return load(path.extname(target) ? target : target + '.ts');
      },
      fetch() { throw new Error('Offline operations must never use the network'); },
    }, { filename: file });
    return exports;
  }
  const { handleOfflineRequest } = load(path.join(__dirname, '../src/offline/request.ts'));
  const request = (route, method = 'GET', body, token) => handleOfflineRequest(route, { method, body: body === undefined ? undefined : JSON.stringify(body) }, token);
  return { request, inner, files };
}
const administrator = { username: 'test.admin', full_name: 'Test Administrator', password: 'offline-test-password' };
async function initializedDevice() {
  const store = device();
  const result = await store.request('/auth/setup', 'POST', administrator);
  assert.equal(result.success, true, result.error);
  return { ...store, token: result.data.token, admin: result.data.user };
}
async function equipment(store, quantity = 3) {
  const response = await store.request('/equipment', 'POST', { name: 'Test Oscilloscope', total_quantity: quantity }, store.token);
  assert.equal(response.success, true, response.error);
  return response.data;
}
function loan(items, extra = {}) {
  return { borrower_name: 'Test Borrower', borrower_id: 'TEST-001', purpose: 'Offline verification', loan_period_days: 3, items, ...extra };
}

test('first-run setup creates a hashed administrator, rejects duplicates, and requires authentication', async () => {
  const store = device();
  assert.equal((await store.request('/auth/setup-status')).data.needs_setup, true);
  assert.equal((await store.request('/equipment')).statusCode, 401);
  assert.equal((await store.request('/auth/setup', 'POST', { ...administrator, password: 'short' })).success, false);
  const account = await store.request('/auth/setup', 'POST', administrator);
  assert.equal(account.success, true, account.error);
  assert.equal(account.data.user.role, 'admin');
  assert.equal(account.data.user.password_hash, undefined);
  const hash = store.inner.exec('SELECT password_hash FROM users')[0].values[0][0];
  assert.ok(bcrypt.compareSync(administrator.password, hash));
  assert.equal((await store.request('/auth/setup', 'POST', administrator)).statusCode, 409);
  assert.equal((await store.request('/auth/login', 'POST', { ...administrator, password: 'wrong' })).statusCode, 401);
});

test('borrowing aggregates duplicate lines, prevents overbooking, and rolls back the whole loan', async () => {
  const store = await initializedDevice();
  const item = await equipment(store);
  const failed = await store.request('/borrow', 'POST', loan([{ equipment_id: item.id, quantity: 2 }, { equipment_id: item.id, quantity: 2 }]), store.token);
  assert.equal(failed.success, false);
  assert.equal((await store.request(`/equipment/${item.id}`, 'GET', undefined, store.token)).data.equipment.available_quantity, 3);
  const created = await store.request('/borrow', 'POST', loan([{ equipment_id: item.id, quantity: 2 }]), store.token);
  assert.equal(created.success, true, created.error);
  const code = created.data[0].transaction_code;
  assert.equal((await store.request(`/records/${code}`, 'GET', undefined, store.token)).data.status, 'borrowed');
  assert.equal((await store.request('/borrow', 'POST', loan([{ equipment_id: item.id, quantity: 2 }]), store.token)).success, false);
  assert.equal((await store.request(`/equipment/${item.id}`, 'PUT', { name: item.name, total_quantity: 1 }, store.token)).success, false);
  const returned = await store.request('/records/return', 'POST', { transaction_code: code }, store.token);
  assert.equal(returned.data.transaction.status, 'returned');
  assert.equal((await store.request('/records/return', 'POST', { transaction_code: code }, store.token)).data.returned_records.length, 0);
  assert.equal((await store.request(`/equipment/${item.id}`, 'GET', undefined, store.token)).data.equipment.available_quantity, 3);
  assert.equal((await store.request(`/equipment/${item.id}`, 'DELETE', undefined, store.token)).success, false);
});

test('partial returns, overdue dates, record filtering, and dashboard totals remain consistent', async () => {
  const store = await initializedDevice();
  const first = await equipment(store);
  const second = await equipment(store);
  const created = await store.request('/borrow', 'POST', loan([{ equipment_id: first.id, quantity: 1 }, { equipment_id: second.id, quantity: 1 }], { borrow_date: '2020-01-01', due_date: '2020-01-02' }), store.token);
  assert.equal(created.success, true, created.error);
  const code = created.data[0].transaction_code;
  const partial = await store.request('/records/return', 'POST', { transaction_code: code, record_ids: [created.data[0].id] }, store.token);
  assert.equal(partial.data.transaction.status, 'overdue');
  assert.equal(partial.data.transaction.return_date, null);
  assert.equal((await store.request('/records?status=active', 'GET', undefined, store.token)).data.some(item => item.transaction_code === code), true);
  assert.ok((await store.request('/dashboard', 'GET', undefined, store.token)).data.stats.total_overdue >= 1);
  assert.equal((await store.request('/records/return', 'POST', { transaction_code: code, return_date: '2019-12-31' }, store.token)).success, false);
  const returned = await store.request('/records/return', 'POST', { transaction_code: code }, store.token);
  assert.equal(returned.data.returned_records.length, 1);
  assert.equal(returned.data.transaction.status, 'returned');
  assert.equal((await store.request('/borrow', 'POST', loan([{ equipment_id: first.id, quantity: 1 }], { due_date: '2026-02-30' }), store.token)).success, false);
});

test('staff permissions, last-administrator protection, logout, and restart persistence', async () => {
  const store = await initializedDevice();
  const staffPayload = { username: 'test.assistant', full_name: 'Test Assistant', password: 'staff-test-password', role: 'assistant' };
  assert.equal((await store.request('/staff', 'POST', staffPayload, store.token)).success, true);
  const assistant = await store.request('/auth/login', 'POST', staffPayload);
  assert.equal((await store.request('/staff', 'POST', { ...staffPayload, username: 'not.allowed' }, assistant.data.token)).statusCode, 403);
  assert.equal((await store.request(`/staff/${store.admin.id}/status`, 'PUT', { is_active: false }, store.token)).success, false);
  assert.equal((await store.request(`/staff/${store.admin.id}`, 'DELETE', undefined, store.token)).success, false);
  const saved = store.inner.export();
  const restarted = device(saved);
  assert.equal((await restarted.request('/auth/setup-status')).data.needs_setup, false);
  assert.equal((await restarted.request('/auth/me', 'GET', undefined, store.token)).data.username, administrator.username);
  assert.equal((await restarted.request('/staff', 'GET', undefined, store.token)).data.length, 2);
  assert.equal((await restarted.request('/auth/logout', 'POST', {}, store.token)).success, true);
  assert.equal((await restarted.request('/auth/me', 'GET', undefined, store.token)).statusCode, 401);
});

test('photo proofs move to persistent storage and failed loans remove copied files', async () => {
  const store = await initializedDevice();
  const item = await equipment(store);
  const result = await store.request('/borrow', 'POST', loan([{ equipment_id: item.id, quantity: 1 }], { photo_proof: 'file:///cache/proof.jpg' }), store.token);
  assert.equal(result.success, true, result.error);
  assert.ok(result.data[0].photo_proof.startsWith('file:///documents/loan-proofs/'));
  assert.equal(store.files.size, 1);
  const failed = await store.request('/borrow', 'POST', loan([{ equipment_id: item.id, quantity: 99 }], { photo_proof: 'file:///cache/proof.jpg' }), store.token);
  assert.equal(failed.success, false);
  assert.equal(store.files.size, 1);
});


test('concurrent setup and concurrent borrowing cannot create duplicate admins or overbook stock', async () => {
  const fresh = device();
  const setup = await Promise.all([
    fresh.request('/auth/setup', 'POST', administrator),
    fresh.request('/auth/setup', 'POST', { ...administrator, username: 'second.admin' }),
  ]);
  assert.equal(setup.filter(result => result.success).length, 1);
  const store = { ...fresh, token: setup.find(result => result.success).data.token };
  const item = await equipment(store, 1);
  const attempts = await Promise.all([
    store.request('/borrow', 'POST', loan([{ equipment_id: item.id, quantity: 1 }]), store.token),
    store.request('/borrow', 'POST', loan([{ equipment_id: item.id, quantity: 1 }]), store.token),
  ]);
  assert.equal(attempts.filter(result => result.success).length, 1);
  assert.equal((await store.request(`/equipment/${item.id}`, 'GET', undefined, store.token)).data.equipment.available_quantity, 0);
});
