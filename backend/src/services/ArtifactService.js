import { artifactsRepository } from "../data/ArtifactsRepository.js";
import { Artifact, ArtifactStatus } from "../entities/Artifact.js";

export class ArtifactService {
  constructor(repo = artifactsRepository) {
    this.repo = repo;
  }

  async list(options) {
    const { items, total, filters } = await this.repo.findAll(options);
    return {
      items: items.map((row) => new Artifact(row)),
      total,
      filters
    };
  }

  async listByOwner(ownerId) {
    const rows = await this.repo.findByOwner(ownerId);
    return rows.map((row) => new Artifact(row));
  }

  async getBySlug(slug) {
    const row = await this.repo.findBySlug(slug);
    return row ? new Artifact(row) : null;
  }

  async create(data) {
    const artifact = new Artifact({ ...data, status: data.status || ArtifactStatus.NEW });
    const row = await this.repo.create(artifact);
    return new Artifact(row);
  }

  async update(slug, data) {
    const artifact = new Artifact(data);
    const row = await this.repo.update(slug, artifact);
    return row ? new Artifact(row) : null;
  }

  async submit(slug) {
    const row = await this.repo.setStatus(slug, { status: ArtifactStatus.PENDING });
    return row ? new Artifact(row) : null;
  }

  async returnToNew(slug) {
    const row = await this.repo.setStatus(slug, { status: ArtifactStatus.NEW });
    return row ? new Artifact(row) : null;
  }

  async delete(slug) {
    return this.repo.delete(slug);
  }
}

export const artifactService = new ArtifactService();
