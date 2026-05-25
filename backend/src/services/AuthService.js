import { randomUUID } from "node:crypto";
import { userRepository } from "../data/UserRepository.js";
import { authRepository } from "../data/AuthRepository.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { generateToken, hashToken } from "../utils/tokens.js";
import { User } from "../entities/User.js";

const VERIFICATION_TTL_MS = 1000 * 60 * 60 * 24;
const PASSWORD_RESET_TTL_MS = 1000 * 60 * 60;
const SESSION_TTL_MS = 1000 * 60 * 60 * 24;

export class AuthService {
  constructor({ users = userRepository, auth = authRepository } = {}) {
    this.users = users;
    this.auth = auth;
  }

  async findUserByEmail(email) {
    return this.auth.findUserByEmail(email);
  }

  async findUserById(id) {
    return this.auth.findUserById(id);
  }

  async createUser(userData) {
    const payload = { ...userData };
    if (payload.password && !payload.passwordHash) {
      payload.passwordHash = hashPassword(payload.password);
      delete payload.password;
    }
    return this.users.save(payload);
  }

  async register(payload) {
    const row = await this.users.save({
      ...payload,
      passwordHash: hashPassword(payload.password)
    });
    return new User(row);
  }

  async verifyCredentials(email, password) {
    const row = await this.auth.findUserByEmail(email);
    if (!row || !row.password_hash) return null;
    if (!verifyPassword(password, row.password_hash)) return null;
    return row;
  }

  async createSession(userId) {
    const token = generateToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await this.auth.createSession({
      id: randomUUID(),
      userId,
      tokenHash,
      expiresAt: expiresAt.toISOString()
    });
    return { token, expiresAt };
  }

  async logout(token) {
    if (!token) return;
    await this.auth.deleteSessionByTokenHash(hashToken(token));
  }

  async issueEmailVerification(user) {
    await this.auth.deletePendingVerificationsForUser(user.id);
    const token = generateToken();
    const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS).toISOString();
    await this.auth.createEmailVerification({
      id: randomUUID(),
      userId: user.id,
      tokenHash: hashToken(token),
      email: user.email,
      expiresAt
    });
    return token;
  }

  async requestPasswordReset(email) {
    const user = await this.auth.findUserByEmail(email);
    if (!user) return null;
    await this.auth.deletePendingPasswordResets(user.id);
    const token = generateToken();
    await this.auth.createPasswordResetToken({
      id: randomUUID(),
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS).toISOString()
    });
    return { token, user };
  }

  async resetPassword(token, newPassword) {
    const row = await this.auth.findPasswordResetTokenByHash(hashToken(token));
    if (!row) return { status: "not_found" };
    if (row.consumed_at) return { status: "consumed" };
    if (new Date(row.expires_at) < new Date()) return { status: "expired" };
    await this.users.updatePassword(row.user_id, hashPassword(newPassword));
    await this.auth.consumePasswordResetToken(row.id);
    await this.auth.deleteAllSessionsForUser(row.user_id);
    return { status: "ok" };
  }

  async verifyEmail(token) {
    const row = await this.auth.findEmailVerificationByTokenHash(hashToken(token));
    if (!row) return { status: "not_found" };
    if (row.consumed_at) return { status: "consumed" };
    if (new Date(row.expires_at) < new Date()) return { status: "expired" };
    await this.users.setVerificationStatus(row.user_id, "verified");
    await this.auth.consumeEmailVerification(row.id);
    return { status: "ok" };
  }

  async listResearchers() {
    return this.users.listResearchers();
  }

  async setVerificationStatus(userId, status) {
    await this.users.setVerificationStatus(userId, status);
    await this.auth.deletePendingVerificationsForUser(userId);
  }
}

export const authService = new AuthService();
