import { randomBytes, timingSafeEqual } from "node:crypto";
import { config } from "../config/env.js";

export const CSRF_COOKIE_NAME = "heritage_csrf";
export const CSRF_HEADER_NAME = "x-csrf-token";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const TOKEN_BYTES = 32;
const TOKEN_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

function generateToken() {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

function setCsrfCookie(res, token) {
  const isProduction = config.nodeEnv === "production";
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    sameSite: isProduction ? "strict" : "lax",
    secure: isProduction,
    path: "/",
    maxAge: TOKEN_MAX_AGE_MS
  });
}

function tokensMatch(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

export function csrfProtection(req, res, next) {
  let token = req.cookies?.[CSRF_COOKIE_NAME];

  if (!token) {
    token = generateToken();
    setCsrfCookie(res, token);
    req.cookies = { ...(req.cookies || {}), [CSRF_COOKIE_NAME]: token };
  }

  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  const headerToken = req.headers[CSRF_HEADER_NAME];

  if (!tokensMatch(token, Array.isArray(headerToken) ? headerToken[0] : headerToken)) {
    return res.status(403).json({
      message: "CSRF токен буруу эсвэл алга байна. Хуудсыг сэргээгээд дахин оролдоно уу."
    });
  }

  return next();
}
