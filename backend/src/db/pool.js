import pg from "pg";
import { config } from "../config/env.js";

const { Pool } = pg;

// Managed Postgres providers (Neon, Render, Supabase) require TLS. Enable it
// whenever the URL doesn't already specify sslmode=disable.
const url = config.databaseUrl || "";
const wantsSsl =
  config.nodeEnv === "production" ||
  /sslmode=require|sslmode=verify/i.test(url);
const disableSsl = /sslmode=disable/i.test(url);

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: wantsSsl && !disableSsl ? { rejectUnauthorized: false } : false
});

export async function query(text, params = []) {
  return pool.query(text, params);
}

export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function checkDatabaseConnection() {
  const result = await query("select current_database() as database_name");
  return result.rows[0];
}

