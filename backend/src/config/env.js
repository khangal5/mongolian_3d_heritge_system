import "dotenv/config";
import path from "node:path";

export const config = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  trustProxy: process.env.TRUST_PROXY || (process.env.NODE_ENV === "production" ? "1" : false),
  corsOrigin: (process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/mongolian_heritage",
  redisUrl: process.env.REDIS_URL || null,
  cacheTtlSeconds: Number(process.env.CACHE_TTL_SECONDS || 60),
  uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR || "uploads"),
  publicAppUrl: (process.env.PUBLIC_APP_URL || "http://localhost:5173").replace(/\/$/, ""),
  emailDomainWhitelist: (
    process.env.EMAIL_DOMAIN_WHITELIST || "edu.mn,ac.mn,gov.mn,gmail.com"
  )
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean),
  emailDomainBypass:
    String(process.env.EMAIL_DOMAIN_BYPASS || "").toLowerCase() === "true",
  smtpHost: process.env.SMTP_HOST || null,
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER || null,
  smtpPassword: process.env.SMTP_PASSWORD || null,
  smtpFrom: process.env.SMTP_FROM || "no-reply@heritage.local",
  emailUseEthereal:
    String(process.env.EMAIL_USE_ETHEREAL || "").toLowerCase() === "true",
  resendApiKey: process.env.RESEND_API_KEY || null,
  emailFrom:
    process.env.EMAIL_FROM ||
    process.env.SMTP_FROM ||
    "onboarding@resend.dev"
};
