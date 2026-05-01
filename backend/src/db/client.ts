import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

import { schema } from './schema';

export type SqliteDatabase = Database.Database;

let db: SqliteDatabase | null = null;

function ensureMedicineColumns(database: SqliteDatabase) {
  const columns = database.pragma('table_info(medicines)') as Array<{ name: string }>;
  const columnNames = new Set(columns.map((column) => column.name));

  if (!columnNames.has('brand')) {
    database.prepare('ALTER TABLE medicines ADD COLUMN brand TEXT').run();
  }
}

export function getDb(): SqliteDatabase {
  if (db) {
    return db;
  }

  const dbPath = process.env.DB_PATH || './data/medicine.db';
  const fullPath = path.isAbsolute(dbPath) ? dbPath : path.resolve(process.cwd(), dbPath);

  fs.mkdirSync(path.dirname(fullPath), { recursive: true });

  db = new Database(fullPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(schema);
  ensureMedicineColumns(db);

  return db;
}
