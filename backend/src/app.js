import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { pinoHttp } from "pino-http";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";
import { config } from "./config/env.js";
import { checkDatabaseConnection } from "./db/pool.js";
import { optionalAuth } from "./middleware/auth.js";
import { csrfProtection } from "./middleware/csrf.js";
import adminRoutes from "./routes/admin.js";
import artifactRoutes from "./routes/artifacts.js";
import authRoutes from "./routes/auth.js";
import reconstructionJobRoutes from "./routes/reconstructionJobs.js";
import { logger } from "./utils/logger.js";

export const lifecycle = {
  shuttingDown: false,
  startedAt: Date.now()
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const openApiSpec = YAML.parse(readFileSync(path.join(__dirname, "openapi.yaml"), "utf8"));

export function createApp() {
  const app = express();

  if (config.trustProxy) {
    app.set("trust proxy", config.trustProxy);
  }

  app.use(
    pinoHttp({
      logger,
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return "error";
        if (res.statusCode >= 400) return "warn";
        return "info";
      },
      serializers: {
        req: (req) => ({
          id: req.id,
          method: req.method,
          url: req.url,
          remoteAddress: req.remoteAddress
        }),
        res: (res) => ({ statusCode: res.statusCode })
      }
    })
  );

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: config.nodeEnv === "production" ? undefined : false
    })
  );
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use("/uploads", express.static(config.uploadDir));
  app.use("/api", csrfProtection);
  app.use(optionalAuth);

  app.get("/api/openapi.json", (_req, res) => {
    res.json(openApiSpec);
  });

  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec, { customSiteTitle: "Heritage API Docs" }));

  app.get("/api/csrf-token", (req, res) => {
    res.json({ csrfToken: req.cookies?.heritage_csrf || null });
  });

  app.get("/api/health", (_req, res) => {
    res.json({
      status: lifecycle.shuttingDown ? "shutting-down" : "ok",
      service: "heritage-api",
      uptimeSeconds: Math.round((Date.now() - lifecycle.startedAt) / 1000),
      timestamp: new Date().toISOString()
    });
  });

  app.get("/api/ready", async (_req, res) => {
    if (lifecycle.shuttingDown) {
      return res.status(503).json({ status: "shutting-down" });
    }
    try {
      const database = await checkDatabaseConnection();
      return res.json({
        status: "ready",
        database: database.database_name,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error({ err: error }, "Readiness check failed");
      return res.status(503).json({
        status: "not-ready",
        reason: "database",
        detail: error.message
      });
    }
  });

  app.get("/api", (_req, res) => {
    res.json({
      name: "Mongolian 3D Heritage API",
      version: "0.1.0",
      endpoints: [
        "GET /api/csrf-token",
        "GET /api/health",
        "GET /api/ready",
        "GET /api/artifacts",
        "GET /api/artifacts/mine",
        "GET /api/artifacts/admin/queue",
        "GET /api/artifacts/:slug",
        "POST /api/artifacts/upload-model",
        "POST /api/artifacts",
        "PUT /api/artifacts/:slug",
        "DELETE /api/artifacts/:slug",
        "POST /api/artifacts/:slug/submit",
        "POST /api/artifacts/:slug/revert",
        "POST /api/artifacts/:slug/approve",
        "POST /api/artifacts/:slug/reject",
        "POST /api/auth/register-researcher",
        "POST /api/auth/login",
        "GET /api/auth/me",
        "POST /api/auth/logout",
        "POST /api/auth/verify-email",
        "POST /api/auth/resend-verification",
        "POST /api/auth/forgot-password",
        "POST /api/auth/reset-password",
        "GET /api/auth/admin/researchers",
        "POST /api/auth/admin/researchers/:id/verify",
        "POST /api/auth/admin/researchers/:id/revoke",
        "GET /api/admin/audit-log",
        "GET /api/reconstruction-jobs",
        "GET /api/reconstruction-jobs/:id",
        "POST /api/reconstruction-jobs/upload"
      ]
    });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/artifacts", artifactRoutes);
  app.use("/api/reconstruction-jobs", reconstructionJobRoutes);

  app.use((error, req, res, _next) => {
    const statusCode =
      error.statusCode || (error.code === "LIMIT_FILE_SIZE" ? 400 : 500);

    const log = req.log || logger;
    if (statusCode >= 500) {
      log.error({ err: error, statusCode }, "Request failed");
    } else {
      log.warn({ err: error, statusCode }, "Request error");
    }

    res.status(statusCode).json({
      message:
        statusCode >= 500 && config.nodeEnv === "production"
          ? "Internal server error"
          : error.message || "Internal server error"
    });
  });

  return app;
}
