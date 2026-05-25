import * as fns from "../repositories/authRepository.js";

export class AuthRepository {
  // Users
  async createUser(user) { return fns.createUser(user); }
  async findUserByEmail(email) { return fns.findUserByEmail(email); }
  async findUserById(id) { return fns.findUserById(id); }
  async updateUserPassword(userId, passwordHash) { return fns.updateUserPassword(userId, passwordHash); }
  async setUserVerificationStatus(userId, status) { return fns.setUserVerificationStatus(userId, status); }
  async listResearchersWithVerifications() { return fns.listResearchersWithVerifications(); }

  // Sessions
  async createSession(session) { return fns.createSession(session); }
  async findSessionWithUserByTokenHash(tokenHash) { return fns.findSessionWithUserByTokenHash(tokenHash); }
  async touchSession(sessionId) { return fns.touchSession(sessionId); }
  async deleteSessionByTokenHash(tokenHash) { return fns.deleteSessionByTokenHash(tokenHash); }
  async deleteAllSessionsForUser(userId) { return fns.deleteAllSessionsForUser(userId); }

  // Email verification
  async createEmailVerification(payload) { return fns.createEmailVerification(payload); }
  async findEmailVerificationByTokenHash(tokenHash) { return fns.findEmailVerificationByTokenHash(tokenHash); }
  async consumeEmailVerification(id) { return fns.consumeEmailVerification(id); }
  async deletePendingVerificationsForUser(userId) { return fns.deletePendingVerificationsForUser(userId); }

  // Password reset
  async createPasswordResetToken(payload) { return fns.createPasswordResetToken(payload); }
  async findPasswordResetTokenByHash(tokenHash) { return fns.findPasswordResetTokenByHash(tokenHash); }
  async consumePasswordResetToken(tokenId) { return fns.consumePasswordResetToken(tokenId); }
  async deletePendingPasswordResets(userId) { return fns.deletePendingPasswordResets(userId); }
}

export const authRepository = new AuthRepository();
