import { authRepository } from "../data/AuthRepository.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { generateToken, hashToken } from "../utils/tokens.js";
import { User } from "../entities/User.js";

export class AuthService {
  constructor(repo = authRepository) {
    this.repo = repo;
  }

  async findUserByEmail(email) {
    const row = await this.repo.findUserByEmail(email);
    return row ? new User(row) : null;
  }

  async findUserById(id) {
    const row = await this.repo.findUserById(id);
    return row ? new User(row) : null;
  }

  async register(payload) {
    const row = await this.repo.createUser({
      ...payload,
      passwordHash: hashPassword(payload.password)
    });
    return new User(row);
  }

  async verifyCredentials(email, password) {
    const row = await this.repo.findUserByEmail(email);
    if (!row || !row.password_hash) return null;
    if (!verifyPassword(password, row.password_hash)) return null;
    return new User(row);
  }

  async createSession(userId) {
    const token = generateToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.repo.createSession({
      userId,
      tokenHash,
      expiresAt: expiresAt.toISOString()
    });
    return { token, expiresAt };
  }

  async resolveSession(token) {
    if (!token) return null;
    const session = await this.repo.findSessionWithUserByTokenHash(hashToken(token));
    if (!session) return null;
    await this.repo.touchSession(session.id);
    return { session, user: new User(session) };
  }

  async logout(token) {
    if (!token) return;
    await this.repo.deleteSessionByTokenHash(hashToken(token));
  }

  async requestPasswordReset(email) {
    const user = await this.repo.findUserByEmail(email);
    if (!user) return null;
    const token = generateToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await this.repo.createPasswordResetToken({
      userId: user.id,
      tokenHash,
      expiresAt: expiresAt.toISOString()
    });
    return { token, user: new User(user) };
  }

  async resetPassword(token, newPassword) {
    const row = await this.repo.findPasswordResetTokenByHash(hashToken(token));
    if (!row || row.consumed_at) return false;
    if (new Date(row.expires_at) < new Date()) return false;
    await this.repo.updateUserPassword(row.user_id, hashPassword(newPassword));
    await this.repo.consumePasswordResetToken(row.id);
    await this.repo.deleteAllSessionsForUser(row.user_id);
    return true;
  }

  async verifyEmail(token) {
    const row = await this.repo.findEmailVerificationByTokenHash(hashToken(token));
    if (!row || row.consumed_at) return false;
    if (new Date(row.expires_at) < new Date()) return false;
    await this.repo.consumeEmailVerification(row.id);
    await this.repo.setUserVerificationStatus(row.user_id, "verified");
    return true;
  }

  async listResearchers() {
    return this.repo.listResearchersWithVerifications();
  }

  async setVerificationStatus(userId, status) {
    return this.repo.setUserVerificationStatus(userId, status);
  }
}

export const authService = new AuthService();
