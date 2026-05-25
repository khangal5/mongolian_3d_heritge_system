import { artifactRepository } from "../data/ArtifactRepository.js";
import { ArtifactStatus } from "../entities/Artifact.js";

export class ApprovalService {
  constructor(repo = artifactRepository) {
    this.repo = repo;
  }

  async listPending() {
    return this.repo.findByStatus(ArtifactStatus.PENDING);
  }

  async approve(slug, { reviewerId, reviewNote = null } = {}) {
    return this.repo.setStatus(slug, {
      status: ArtifactStatus.APPROVED,
      reviewerId,
      reviewNote
    });
  }

  async reject(slug, { reviewerId, reviewNote }) {
    if (!reviewNote || !reviewNote.trim()) {
      throw new Error("Reject шалтгаан заавал шаардлагатай");
    }
    return this.repo.setStatus(slug, {
      status: ArtifactStatus.REJECTED,
      reviewerId,
      reviewNote
    });
  }
}

export const approvalService = new ApprovalService();
