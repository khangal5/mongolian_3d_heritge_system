import { artifactRepository } from "../data/ArtifactRepository.js";
import { ArtifactStatus } from "../entities/Artifact.js";

export class ArtifactService {
  constructor(repo = artifactRepository) {
    this.repo = repo;
  }

  async list(options) {
    return this.repo.searchArtifact(options);
  }

  async listByOwner(ownerId) {
    return this.repo.findByOwner(ownerId);
  }

  async getBySlug(slug) {
    return this.repo.findBySlug(slug);
  }

  async create(data) {
    return this.repo.save({ ...data, status: data.status || ArtifactStatus.NEW });
  }

  async update(slug, data) {
    return this.repo.update(slug, data);
  }

  async submit(slug) {
    return this.repo.setStatus(slug, { status: ArtifactStatus.PENDING });
  }

  async returnToNew(slug) {
    return this.repo.setStatus(slug, { status: ArtifactStatus.NEW });
  }

  async delete(slug) {
    return this.repo.delete(slug);
  }
}

export const artifactService = new ArtifactService();
