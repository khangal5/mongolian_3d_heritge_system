import { afterAll, beforeAll, describe, it, expect } from "vitest";
import { createApp } from "../src/app.js";
import { query } from "../src/db/pool.js";
import { hashPassword } from "../src/utils/password.js";
import { randomUUID } from "node:crypto";
import { cleanupTestUsers, getCsrf, newAgent } from "./helpers.js";

const app = createApp();

const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = "passw0rd-strong";

beforeAll(async () => {
  await cleanupTestUsers();
  await query(
    `
      INSERT INTO users (id, full_name, email, password_hash, role, verification_status, status)
      VALUES ($1, $2, $3, $4, 'researcher', 'verified', 'active')
    `,
    [randomUUID(), "Test User", TEST_EMAIL, hashPassword(TEST_PASSWORD)]
  );
});

afterAll(async () => {
  await cleanupTestUsers();
});

describe("Auth flow", () => {
  it("requires CSRF token for POST", async () => {
    const res = await newAgent(app)
      .post("/api/auth/login")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
    expect(res.status).toBe(403);
  });

  it("rejects invalid credentials", async () => {
    const agent = newAgent(app);
    const csrf = await getCsrf(agent);
    const res = await agent
      .post("/api/auth/login")
      .set("X-CSRF-Token", csrf)
      .send({ email: TEST_EMAIL, password: "wrong-password" });
    expect(res.status).toBe(401);
  });

  it("rejects invalid email format", async () => {
    const agent = newAgent(app);
    const csrf = await getCsrf(agent);
    const res = await agent
      .post("/api/auth/login")
      .set("X-CSRF-Token", csrf)
      .send({ email: "not-an-email", password: "x" });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("logs in with valid credentials and sets cookie", async () => {
    const agent = newAgent(app);
    const csrf = await getCsrf(agent);
    const res = await agent
      .post("/api/auth/login")
      .set("X-CSRF-Token", csrf)
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(TEST_EMAIL);
    const cookies = res.headers["set-cookie"] || [];
    expect(cookies.some((c) => c.startsWith("heritage_session="))).toBe(true);
    expect(cookies.some((c) => c.toLowerCase().includes("httponly"))).toBe(true);
  });

  it("GET /api/auth/me returns user when authenticated", async () => {
    const agent = newAgent(app);
    const csrf = await getCsrf(agent);
    await agent
      .post("/api/auth/login")
      .set("X-CSRF-Token", csrf)
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
      .expect(200);

    const meRes = await agent.get("/api/auth/me");
    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe(TEST_EMAIL);
  });

  it("POST /api/auth/logout clears the session", async () => {
    const agent = newAgent(app);
    const csrf = await getCsrf(agent);
    await agent
      .post("/api/auth/login")
      .set("X-CSRF-Token", csrf)
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
      .expect(200);

    await agent
      .post("/api/auth/logout")
      .set("X-CSRF-Token", csrf)
      .expect(204);

    const meRes = await agent.get("/api/auth/me");
    expect(meRes.status).toBe(401);
  });

  it("locks account after too many failed attempts", async () => {
    const agent = newAgent(app);
    const csrf = await getCsrf(agent);

    await query(
      `UPDATE users SET failed_login_count = 0, locked_until = NULL WHERE email = $1`,
      [TEST_EMAIL]
    );

    for (let i = 0; i < 5; i += 1) {
      await agent
        .post("/api/auth/login")
        .set("X-CSRF-Token", csrf)
        .send({ email: TEST_EMAIL, password: "wrong" });
    }

    const lockedRes = await agent
      .post("/api/auth/login")
      .set("X-CSRF-Token", csrf)
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(lockedRes.status).toBe(423);

    await query(
      `UPDATE users SET failed_login_count = 0, locked_until = NULL WHERE email = $1`,
      [TEST_EMAIL]
    );
  });
});

describe("Password reset flow", () => {
  it("forgot-password always returns generic response (no enumeration)", async () => {
    const agent = newAgent(app);
    const csrf = await getCsrf(agent);

    const realRes = await agent
      .post("/api/auth/forgot-password")
      .set("X-CSRF-Token", csrf)
      .send({ email: TEST_EMAIL });

    const fakeRes = await agent
      .post("/api/auth/forgot-password")
      .set("X-CSRF-Token", csrf)
      .send({ email: "definitely-not-exists@example.com" });

    expect(realRes.status).toBe(200);
    expect(fakeRes.status).toBe(200);
    expect(realRes.body.message).toBe(fakeRes.body.message);
  });

  it("reset-password rejects invalid token", async () => {
    const agent = newAgent(app);
    const csrf = await getCsrf(agent);
    const res = await agent
      .post("/api/auth/reset-password")
      .set("X-CSRF-Token", csrf)
      .send({ token: "this-is-not-a-valid-token-string", password: "newpassword123" });
    expect(res.status).toBe(404);
  });
});
