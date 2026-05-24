import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { config } from "./config/env.js";
import { checkDatabaseConnection } from "./db/pool.js";
import { optionalAuth } from "./middleware/auth.js";
import artifactRoutes from "./routes/artifacts.js";
import authRoutes from "./routes/auth.js";
import reconstructionJobRoutes from "./routes/reconstructionJobs.js";

export function createApp() {
  const app = express();

  if (config.trustProxy) {
    app.set("trust proxy", config.trustProxy);
  }

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  // Allow exact configured origins plus any *.vercel.app preview URL so
  // branch/PR deploys can hit the API too.
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (config.corsOrigin.includes(origin)) return callback(null, true);
        if (config.corsOrigin.includes("*")) return callback(null, true);
        try {
          const host = new URL(origin).hostname;
          if (host.endsWith(".vercel.app")) return callback(null, true);
        } catch {
          // fall through to reject
        }
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use("/uploads", express.static(config.uploadDir));
  app.use(optionalAuth);

  // Lightweight liveness probe for Render/load balancers — does not touch DB.
  app.get("/api/healthz", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/health", (_req, res) => {
    checkDatabaseConnection()
      .then((database) => {
        res.json({ status: "ok", database: database.database_name, timestamp: new Date().toISOString() });
      })
      .catch((error) => {
        res.status(500).json({ status: "error", detail: error.message });
      });
  });

  app.get("/api", (_req, res) => {
    res.json({
      name: "Mongolian 3D Heritage API",
      version: "0.1.0",
      endpoints: [
        "GET /api/health",
        "GET /api/artifacts",
        "GET /api/artifacts/:slug",
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
        "GET /api/reconstruction-jobs",
        "GET /api/reconstruction-jobs/:id",
        "POST /api/reconstruction-jobs/upload"
      ]
    });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/artifacts", artifactRoutes);
  app.use("/api/reconstruction-jobs", reconstructionJobRoutes);

  app.use((error, _req, res, _next) => {
    console.error(error);
    const statusCode =
      error.statusCode || (error.code === "LIMIT_FILE_SIZE" ? 400 : 500);

    const isProdServerError = statusCode >= 500 && config.nodeEnv === "production";
    res.status(statusCode).json({
      message: isProdServerError
        ? "Internal server error"
        : error.message || "Internal server error"
    });
  });

  return app;
}
