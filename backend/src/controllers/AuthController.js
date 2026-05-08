import { authService } from "../services/AuthService.js";

export class AuthController {
  constructor(service = authService) {
    this.service = service;
  }

  async register(payload) {
    return this.service.register(payload);
  }

  async login(email, password) {
    const user = await this.service.verifyCredentials(email, password);
    if (!user) return null;
    const session = await this.service.createSession(user.id);
    return { user, session };
  }

  async logout(token) {
    return this.service.logout(token);
  }

  async me(token) {
    const resolved = await this.service.resolveSession(token);
    return resolved ? resolved.user : null;
  }

  async verifyEmail(token) {
    return this.service.verifyEmail(token);
  }

  async requestPasswordReset(email) {
    return this.service.requestPasswordReset(email);
  }

  async resetPassword(token, newPassword) {
    return this.service.resetPassword(token, newPassword);
  }

  async listResearchers() {
    return this.service.listResearchers();
  }
}

export const authController = new AuthController();
