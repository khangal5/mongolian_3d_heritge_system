import "dotenv/config";
import path from "node:path";

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";

if (isProduction && !process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is required in production. Please configure backend/.env."
  );
}

export const config = {
  port: Number(process.env.PORT || 4000),
  nodeEnv,
  trustProxy: process.env.TRUST_PROXY || (isProduction ? "1" : false),
  corsOrigin: (process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/mongolian_heritage",
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
