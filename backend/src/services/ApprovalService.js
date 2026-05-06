import { artifactsRepository } from "../data/ArtifactsRepository.js";
import { Artifact, ArtifactStatus } from "../entities/Artifact.js";

export class ApprovalService {
  constructor(repo = artifactsRepository) {
    this.repo = repo;
  }

  async listPending() {
    const rows = await this.repo.findByStatus(ArtifactStatus.PENDING);
    return rows.map((row) => new Artifact(row));
  }

  async approve(slug, { reviewerId, reviewNote = null } = {}) {
    const row = await this.repo.setStatus(slug, {
      status: ArtifactStatus.APPROVED,
      reviewerId,
      reviewNote
    });
    return row ? new Artifact(row) : null;
  }

  async reject(slug, { reviewerId, reviewNote }) {
    if (!reviewNote || !reviewNote.trim()) {
      throw new Error("Reject шалтгаан заавал шаардлагатай");
    }
    const row = await this.repo.setStatus(slug, {
      status: ArtifactStatus.REJECTED,
      reviewerId,
      reviewNote
    });
    return row ? new Artifact(row) : null;
  }
}

export const approvalService = new ApprovalService();
