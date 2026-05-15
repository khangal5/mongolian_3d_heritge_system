import { mkdir } from "node:fs/promises";
import { createApp, lifecycle } from "./app.js";
import { config } from "./config/env.js";
import { pool } from "./db/pool.js";
import { closeCacheConnection } from "./utils/cache.js";
import { logger } from "./utils/logger.js";

await mkdir(config.uploadDir, { recursive: true });

const app = createApp();

process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "Unhandled promise rejection");
});

process.on("uncaughtException", (error) => {
  logger.fatal({ err: error }, "Uncaught exception — exiting");
  process.exit(1);
});

const server = app.listen(config.port, () => {
  logger.info({ port: config.port, env: config.nodeEnv }, "Heritage API started");
});

const SHUTDOWN_TIMEOUT_MS = 15000;

async function shutdown(signal) {
  if (lifecycle.shuttingDown) return;
  lifecycle.shuttingDown = true;
  logger.info({ signal }, "Graceful shutdown эхэллээ");

  const forceExit = setTimeout(() => {
    logger.error({ timeoutMs: SHUTDOWN_TIMEOUT_MS }, "Shutdown timeout — албадан гарч байна");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  server.close(async (closeError) => {
    if (closeError) {
      logger.error({ err: closeError }, "HTTP server close error");
    } else {
      logger.info("HTTP server хаагдсан");
    }

    try {
      await pool.end();
      logger.info("DB pool хаагдсан");
    } catch (poolError) {
      logger.error({ err: poolError }, "DB pool хаахад алдаа");
    }

    try {
      await closeCacheConnection();
    } catch (cacheError) {
      logger.error({ err: cacheError }, "Redis client хаахад алдаа");
    }

    clearTimeout(forceExit);
    process.exit(closeError ? 1 : 0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
