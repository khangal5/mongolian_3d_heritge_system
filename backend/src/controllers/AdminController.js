import { approvalService } from "../services/ApprovalService.js";

export class AdminController {
  constructor(service = approvalService) {
    this.service = service;
  }

  async listPending() {
    return this.service.listPending();
  }

  async approve(slug, { reviewerId, reviewNote = null } = {}) {
    return this.service.approve(slug, { reviewerId, reviewNote });
  }

  async reject(slug, { reviewerId, reviewNote }) {
    return this.service.reject(slug, { reviewerId, reviewNote });
  }
}

export const adminController = new AdminController();
