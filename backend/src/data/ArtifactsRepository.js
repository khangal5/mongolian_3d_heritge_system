import * as fns from "../repositories/artifactsRepository.js";

export class ArtifactsRepository {
  async findAll(options) { return fns.getArtifacts(options); }
  async findByOwner(ownerId) { return fns.getArtifactsByOwner(ownerId); }
  async findByStatus(status) { return fns.getArtifactsByStatus(status); }
  async findBySlug(slug) { return fns.getArtifactBySlug(slug); }
  async create(artifact) { return fns.createArtifact(artifact); }
  async update(slug, artifact) { return fns.updateArtifact(slug, artifact); }
  async setStatus(slug, payload) { return fns.setArtifactStatus(slug, payload); }
  async delete(slug) { return fns.deleteArtifact(slug); }
}

export const artifactsRepository = new ArtifactsRepository();
export { ARTIFACT_STATUSES } from "../repositories/artifactsRepository.js";
