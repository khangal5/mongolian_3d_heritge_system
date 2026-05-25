import { authService } from "../services/AuthService.js";

export class AuthController {
  constructor(service = authService) {
    this.service = service;
  }

  async findUserByEmail(email) {
    return this.service.findUserByEmail(email);
  }

  async findUserById(id) {
    return this.service.findUserById(id);
  }

  async createUser(userData) {
    return this.service.createUser(userData);
  }

  async issueEmailVerification(user) {
    return this.service.issueEmailVerification(user);
  }

  async verifyCredentials(email, password) {
    return this.service.verifyCredentials(email, password);
  }

  async createSession(userId) {
    return this.service.createSession(userId);
  }

  async logout(token) {
    return this.service.logout(token);
  }

  async requestPasswordReset(email) {
    return this.service.requestPasswordReset(email);
  }

  async resetPassword(token, newPassword) {
    return this.service.resetPassword(token, newPassword);
  }

  async verifyEmail(token) {
    return this.service.verifyEmail(token);
  }

  async listResearchers() {
    return this.service.listResearchers();
  }

  async setVerificationStatus(userId, status) {
    return this.service.setVerificationStatus(userId, status);
  }
}

export const authController = new AuthController();
