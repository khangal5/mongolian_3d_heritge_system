import { User } from "./User.js";

export class AuthResponse {
  constructor({ user, token } = {}) {
    this.user = user instanceof User ? user : (user ? new User(user) : null);
    this.token = token || "";
  }

  toJSON() {
    return {
      user: this.user ? this.user.toPublicJSON() : null,
      token: this.token
    };
  }
}
