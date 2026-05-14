import rateLimit from "express-rate-limit";
import { config } from "../config/env.js";

const TEST_MODE = config.nodeEnv === "test" || process.env.VITEST;
const noop = (_req, _res, next) => next();

function limiter(options) {
  if (TEST_MODE) return noop;
  return rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    ...options
  });
}

export const loginLimiter = limiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    message: "Хэт олон нэвтрэх оролдлого хийгдсэн. 15 минутын дараа дахин оролдоно уу."
  }
});

export const registerLimiter = limiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    message: "Хэт олон бүртгэл үүсгэх оролдлого. 1 цагийн дараа дахин оролдоно уу."
  }
});

export const passwordResetLimiter = limiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    message: "Хэт олон нууц үг сэргээх хүсэлт. 1 цагийн дараа дахин оролдоно уу."
  }
});

export const verificationResendLimiter = limiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    message: "Баталгаажуулах имэйл хэт олон удаа хүссэн. 1 цагийн дараа дахин оролдоно уу."
  }
});
