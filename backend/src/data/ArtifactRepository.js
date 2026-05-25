import * as fns from "../repositories/artifactsRepository.js";

export class ArtifactRepository {
  async save(artifact) {
    return fns.createArtifact(artifact);
  }

  async findById(id) {
    return fns.getArtifactBySlug(id);
  }

  async findBySlug(slug) {
    return fns.getArtifactBySlug(slug);
  }

  async searchArtifact(criteria) {
    return fns.getArtifacts(criteria);
  }

  async findByOwner(ownerId) {
    return fns.getArtifactsByOwner(ownerId);
  }

  async findByStatus(status) {
    return fns.getArtifactsByStatus(status);
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
