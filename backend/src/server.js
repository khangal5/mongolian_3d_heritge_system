import { mkdir } from "node:fs/promises";
import { createApp } from "./app.js";
import { config } from "./config/env.js";

await mkdir(config.uploadDir, { recursive: true });

const app = createApp();

app.listen(config.port, () => {
  console.log(`Mongolian 3D Heritage API running on port ${config.port}`);
});
