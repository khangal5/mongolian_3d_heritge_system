import pino from "pino";
import { config } from "../config/env.js";

const isProduction = config.nodeEnv === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  base: { service: "heritage-api" },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.headers['x-csrf-token']",
      "*.password",
      "*.passwordHash",
      "*.password_hash",
      "*.token",
      "*.tokenHash",
      "*.token_hash"
    ],
    censor: "[REDACTED]"
  },
  transport: isProduction
    ? undefined
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss.l",
          ignore: "pid,hostname,service"
        }
      }
});
