import { type SQLiteDatabase } from "expo-sqlite";

// --- NEW: DB migration + helpers (could be moved to /lib/db/migrate.ts)
export async function migrate(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS recent_users (
      id TEXT PRIMARY KEY,
      username TEXT,
      display_name TEXT,
      avatar_url TEXT,
      last_touched INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_recent_users_last_touched
      ON recent_users (last_touched DESC);
  `);
}
