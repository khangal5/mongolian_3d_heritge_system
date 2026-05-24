import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hashed = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hashed}`;
}

export function verifyPassword(password, storedHash) {
  const [salt, originalHash] = storedHash.split(":");

  if (!salt || !originalHash) {
    return false;
  }

  const hashed = scryptSync(password, salt, 64);
  const original = Buffer.from(originalHash, "hex");

  if (hashed.length !== original.length) {
    return false;
  }

  return timingSafeEqual(hashed, original);
}

