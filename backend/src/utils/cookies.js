import { config } from "../config/env.js";

export const AUTH_COOKIE_NAME = "heritage_session";

const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24;

function baseCookieOptions() {
  const isProduction = config.nodeEnv === "production";
  return {
    httpOnly: true,
    // Cross-origin (Vercel ↔ Azure) requires SameSite=None + Secure in prod.
    // Локал dev-д lax байх нь хангалттай.
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    path: "/"
  };
}

export function setAuthCookie(res, token) {
  res.cookie(AUTH_COOKIE_NAME, token, {
    ...baseCookieOptions(),
    maxAge: SESSION_MAX_AGE_MS
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE_NAME, baseCookieOptions());
}
