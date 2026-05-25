import * as fns from "../repositories/authRepository.js";
import { User } from "../entities/User.js";

export class UserRepository {
  async save(user) {
    return fns.createUser(user);
  }

  async findByEmail(email) {
    const row = await fns.findUserByEmail(email);
    return row ? new User(row) : null;
  }

  async findById(id) {
    const row = await fns.findUserById(id);
    return row ? new User(row) : null;
  }

  async updatePassword(userId, passwordHash) {
    return fns.updateUserPassword(userId, passwordHash);
  }

  async setVerificationStatus(userId, status) {
    return fns.setUserVerificationStatus(userId, status);
  }

  async listResearchers() {
    return fns.listResearchersWithVerifications();
  }
}

export const userRepository = new UserRepository();
