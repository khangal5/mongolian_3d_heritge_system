import { test } from "node:test";
import assert from "node:assert/strict";
import {
  loginSchema,
  registerResearcherSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema
} from "../src/schemas/auth.js";

test("loginSchema зөв оролтыг хүлээж авна", () => {
  const result = loginSchema.safeParse({
    email: "user@example.com",
    password: "anypass"
  });
  assert.equal(result.success, true);
});

test("loginSchema буруу имэйлийг татгалзана", () => {
  const result = loginSchema.safeParse({
    email: "not-an-email",
    password: "anypass"
  });
  assert.equal(result.success, false);
});

test("loginSchema нь имэйлийг lowercase болгож trim хийнэ", () => {
  const result = loginSchema.safeParse({
    email: "  USER@Example.com  ",
    password: "x"
  });
  assert.equal(result.success, true);
  assert.equal(result.data.email, "user@example.com");
});

test("registerResearcherSchema нь 8-аас доош тэмдэгт нууц үгийг татгалзана", () => {
  const result = registerResearcherSchema.safeParse({
    fullName: "Test User",
    email: "test@edu.mn",
    password: "short",
    organization: "Org",
    positionTitle: "Researcher"
  });
  assert.equal(result.success, false);
});

test("registerResearcherSchema зайлшгүй талбар дутвал татгалзана", () => {
  const result = registerResearcherSchema.safeParse({
    fullName: "Test User",
    email: "test@edu.mn",
    password: "longenough"
    // organization, positionTitle дутуу
  });
  assert.equal(result.success, false);
});

test("registerResearcherSchema бүх зайлшгүй талбар бөглөвөл хүлээж авна", () => {
  const result = registerResearcherSchema.safeParse({
    fullName: "Бат-Эрдэнэ",
    email: "bat@edu.mn",
    password: "Strong!Pass123",
    organization: "ШУТИС",
    positionTitle: "Багш"
  });
  assert.equal(result.success, true);
});

test("forgotPasswordSchema хоосон утга зөвшөөрнө", () => {
  const result = forgotPasswordSchema.safeParse({ email: "" });
  assert.equal(result.success, true);
});

test("resetPasswordSchema нь token + password шаардана", () => {
  const ok = resetPasswordSchema.safeParse({
    token: "longenough-token-string",
    password: "newpassword!"
  });
  assert.equal(ok.success, true);

  const fail = resetPasswordSchema.safeParse({
    token: "short",
    password: "newpassword!"
  });
  assert.equal(fail.success, false);
});

test("verifyEmailSchema нь хүчинтэй токенийг хүлээж авна", () => {
  const ok = verifyEmailSchema.safeParse({ token: "validlongtoken12345" });
  assert.equal(ok.success, true);

  const fail = verifyEmailSchema.safeParse({ token: "abc" });
  assert.equal(fail.success, false);
});
