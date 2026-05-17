import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { pool } from "../db/pool.js";

async function run() {
  const currentFilePath = fileURLToPath(import.meta.url);
  const currentDir = path.dirname(currentFilePath);
  const schemaPath = path.join(currentDir, "..", "db", "schema.sql");
  const schemaSql = await readFile(schemaPath, "utf8");

  await pool.query(schemaSql);
  console.log("PostgreSQL schema амжилттай үүслээ");
}

run()
  .catch((error) => {
    console.error("Schema үүсгэх үед алдаа гарлаа:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
