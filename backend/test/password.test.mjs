import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "../src/utils/password.js";

test("hashPassword нь давсаар салгасан hash буцаана", () => {
  const hash = hashPassword("Test1234!");
  const parts = hash.split(":");
  assert.equal(parts.length, 2, "hash нь 'salt:hash' форматтай байх ёстой");
  assert.equal(parts[0].length, 32, "давс 16 byte (32 hex)");
  assert.equal(parts[1].length, 128, "scrypt 64 byte (128 hex)");
});

test("hashPassword ижил нууц үгэнд өөр өөр давс үүсгэнэ", () => {
  const h1 = hashPassword("samepass");
  const h2 = hashPassword("samepass");
  assert.notEqual(h1, h2, "санамсаргүй давс учир hash нь өөр байх ёстой");
});

test("verifyPassword зөв нууц үг буцаахад true", () => {
  const hash = hashPassword("CorrectHorse!");
  assert.equal(verifyPassword("CorrectHorse!", hash), true);
});

test("verifyPassword буруу нууц үг буцаахад false", () => {
  const hash = hashPassword("CorrectHorse!");
  assert.equal(verifyPassword("WrongPass", hash), false);
});

test("verifyPassword гэмтсэн hash-д false", () => {
  assert.equal(verifyPassword("any", "invalidhash"), false);
  assert.equal(verifyPassword("any", "salt:"), false);
  assert.equal(verifyPassword("any", ""), false);
});
