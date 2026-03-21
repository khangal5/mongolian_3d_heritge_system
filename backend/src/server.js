import cors from "cors";
import express from "express";
import { config } from "./config/env.js";
import { checkDatabaseConnection } from "./db/pool.js";
import artifactRoutes from "./routes/artifacts.js";

const app = express();

app.use(
  cors({
    origin: config.corsOrigin
  })
);
app.use(express.json());

app.get("/", (_req, res) => {
  res.type("html").send(`
    <!doctype html>
    <html lang="mn">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Монголын 3D өвийн API</title>
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
          <h1>Монголын 3D өвийн API</h1>
          <p>Backend сервер амжилттай ажиллаж байна.</p>
          <p>Ашиглах боломжтой endpoint-ууд:</p>
          <ul>
            <li><a href="/api">/api</a></li>
            <li><a href="/api/health">/api/health</a></li>
            <li><a href="/api/artifacts">/api/artifacts</a></li>
          </ul>
          <p>
            Frontend аппликейшнийг тусад нь
            <code>http://localhost:5173</code>.
            хаягаар нээнэ үү.
          </p>
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
        message: "Өгөгдлийн сантай холбогдож чадсангүй",
        detail: error.message
      });
    });
});

app.get("/api", (_req, res) => {
  res.json({
    name: "Монголын 3D өвийн системийн API",
    version: "0.1.0",
    endpoints: [
      "GET /api/health",
      "GET /api/artifacts",
      "GET /api/artifacts/:slug",
      "POST /api/artifacts",
      "PUT /api/artifacts/:slug",
      "DELETE /api/artifacts/:slug"
    ]
  });
});

app.use("/api/artifacts", artifactRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({
    message: "Серверийн дотоод алдаа гарлаа"
  });
});

app.listen(config.port, () => {
  console.log(`Монголын 3D өвийн API ${config.port} порт дээр ажиллаж байна`);
});
