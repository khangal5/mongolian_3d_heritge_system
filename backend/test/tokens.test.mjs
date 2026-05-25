import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { generateToken, hashToken } from "../src/utils/tokens.js";

test("generateToken 64 hex тэмдэгт буцаана (32 byte)", () => {
  const token = generateToken();
  assert.equal(token.length, 64);
  assert.match(token, /^[0-9a-f]{64}$/);
});

test("generateToken дуудалт бүрт өөр өөр утга буцаана", () => {
  const tokens = new Set();
  for (let i = 0; i < 100; i++) {
    tokens.add(generateToken());
  }
  assert.equal(tokens.size, 100, "100 удаа дуудахад бүгд өөр байх ёстой");
});

test("hashToken SHA-256 hex буцаана (64 тэмдэгт)", () => {
  const token = "test-token";
  const hash = hashToken(token);
  assert.equal(hash.length, 64);
  const expected = createHash("sha256").update(token).digest("hex");
  assert.equal(hash, expected);
});

test("hashToken идемпотентэй (ижил оролтод ижил хариу)", () => {
  const token = generateToken();
  assert.equal(hashToken(token), hashToken(token));
});

test("hashToken өөр өөр оролтод өөр өөр хариу", () => {
  assert.notEqual(hashToken("a"), hashToken("b"));
});
