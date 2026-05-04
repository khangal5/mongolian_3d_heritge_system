import * as fns from "../repositories/artifactsRepository.js";
import { Artifact } from "../entities/Artifact.js";

export class ArtifactRepository {
  async save(artifact) {
    return fns.createArtifact(artifact);
  }

  async findById(id) {
    // ID-р хайх — odoogiyn function-ууд slug-р хайдаг тул slug-ыг ашиглана
    const row = await fns.getArtifactBySlug(id);
    return row ? new Artifact(row) : null;
  }

  async findBySlug(slug) {
    const row = await fns.getArtifactBySlug(slug);
    return row ? new Artifact(row) : null;
  }

  async searchArtifact(criteria) {
    const { items, total, filters } = await fns.getArtifacts(criteria);
    return {
      items: items.map((row) => new Artifact(row)),
      total,
      filters
    };
  }

  async findByOwner(ownerId) {
    const rows = await fns.getArtifactsByOwner(ownerId);
    return rows.map((row) => new Artifact(row));
  }

  async findByStatus(status) {
    const rows = await fns.getArtifactsByStatus(status);
    return rows.map((row) => new Artifact(row));
  }

  async update(slug, artifact) {
    return fns.updateArtifact(slug, artifact);
  }

  async setStatus(slug, payload) {
    return fns.setArtifactStatus(slug, payload);
  }

  async delete(slug) {
    return fns.deleteArtifact(slug);
  }
}

export const artifactRepository = new ArtifactRepository();
