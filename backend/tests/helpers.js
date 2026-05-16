import request from "supertest";
import { query } from "../src/db/pool.js";

export async function cleanupTestUsers(emailPrefix = "test-") {
  await query(`DELETE FROM users WHERE email LIKE $1`, [`${emailPrefix}%`]);
}

export async function getCsrf(agent) {
  const res = await agent.get("/api/csrf-token").expect(200);
  return res.body.csrfToken;
}

export function newAgent(app) {
  return request.agent(app);
}
