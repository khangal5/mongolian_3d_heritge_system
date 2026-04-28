import cors from "cors";
import express from "express";
import { mkdir } from "node:fs/promises";
import { config } from "./config/env.js";
import { checkDatabaseConnection } from "./db/pool.js";
import { optionalAuth } from "./middleware/auth.js";
import artifactRoutes from "./routes/artifacts.js";
import authRoutes from "./routes/auth.js";
import reconstructionJobRoutes from "./routes/reconstructionJobs.js";

const app = express();

await mkdir(config.uploadDir, { recursive: true });

app.use(
  cors({
    origin: config.corsOrigin
  })
);
app.use(express.json());
app.use("/uploads", express.static(config.uploadDir));
app.use(optionalAuth);

app.get("/", (_req, res) => {
  res.type("html").send(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Mongolian 3D Heritage API</title>
        <style>
          body {
            margin: 0;
            font-family: Georgia, serif;
            background: linear-gradient(180deg, #f7efe3 0%, #f1e3cf 100%);
            color: #2b1b13;
          }
          main {
            max-width: 720px;
            margin: 64px auto;
            padding: 32px;
            background: rgba(255, 249, 241, 0.92);
            border: 1px solid rgba(80, 45, 19, 0.12);
            border-radius: 24px;
            box-shadow: 0 24px 50px rgba(71, 42, 21, 0.12);
          }
          h1 {
            margin-top: 0;
            font-size: 2.5rem;
          }
          p, li {
            line-height: 1.7;
          }
          a {
            color: #9f411f;
          }
          code {
            background: rgba(159, 65, 31, 0.08);
            padding: 2px 8px;
            border-radius: 999px;
          }
        </style>
      </head>
      <body>
        <main>
          <h1>Mongolian 3D Heritage API</h1>
          <p>Backend server is running.</p>
          <p>Available endpoints:</p>
          <ul>
            <li><a href="/api">/api</a></li>
            <li><a href="/api/health">/api/health</a></li>
            <li><a href="/api/artifacts">/api/artifacts</a></li>
            <li><a href="/api/reconstruction-jobs">/api/reconstruction-jobs</a></li>
          </ul>
          <p>Frontend default URL: <code>http://localhost:5173</code></p>
        </main>
      </body>
    </html>
  `);
});

app.get("/api/health", (_req, res) => {
  checkDatabaseConnection()
    .then((database) => {
      res.json({
        status: "ok",
        service: "heritage-api",
        database: database.database_name,
        timestamp: new Date().toISOString()
      });
    })
    .catch((error) => {
      res.status(500).json({
        status: "error",
        service: "heritage-api",
        message: "Database connection failed",
        detail: error.message
      });
    });
});

app.get("/api", (_req, res) => {
  res.json({
    name: "Mongolian 3D Heritage API",
    version: "0.1.0",
    endpoints: [
      "GET /api/health",
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

  res.status(statusCode).json({
    message: error.message || "Internal server error"
  });
});

app.listen(config.port, () => {
  console.log(`Mongolian 3D Heritage API running on port ${config.port}`);
});
