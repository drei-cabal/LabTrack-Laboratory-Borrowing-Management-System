import { DatabaseDriver, MemoryDatabaseDriver } from './driver';

export * from './driver';

let dbInstance: DatabaseDriver | null = null;

export async function getDatabase(): Promise<DatabaseDriver> {
  if (dbInstance) return dbInstance;
  dbInstance = new MemoryDatabaseDriver();
  await dbInstance.init();
  return dbInstance;
}
