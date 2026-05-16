import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp();

describe("Health endpoints", () => {
  it("GET /api/health → 200, status ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.service).toBe("heritage-api");
  });

  it("GET /api/ready → 200, database connected", async () => {
    const res = await request(app).get("/api/ready");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ready");
  });

  it("GET /api/csrf-token → returns a token", async () => {
    const res = await request(app).get("/api/csrf-token");
    expect(res.status).toBe(200);
    expect(typeof res.body.csrfToken).toBe("string");
    expect(res.body.csrfToken.length).toBeGreaterThan(20);
  });
});
