import "dotenv/config";
import path from "node:path";

export const config = {
  port: Number(process.env.PORT || 4000),
  corsOrigin: process.env.CORS_ORIGIN || "*",
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/mongolian_heritage",
  uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR || "uploads")
};
