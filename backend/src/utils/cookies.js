import { config } from "../config/env.js";

export const AUTH_COOKIE_NAME = "heritage_session";

const REMEMBER_ME_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

function baseCookieOptions() {
  const isProduction = config.nodeEnv === "production";
  return {
    httpOnly: true,
    sameSite: isProduction ? "strict" : "lax",
    secure: isProduction,
    path: "/"
  };
}

export function setAuthCookie(res, token, { rememberMe } = {}) {
  const options = baseCookieOptions();
  if (rememberMe) {
    options.maxAge = REMEMBER_ME_MAX_AGE_MS;
  }
  res.cookie(AUTH_COOKIE_NAME, token, options);
}

export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE_NAME, baseCookieOptions());
}
