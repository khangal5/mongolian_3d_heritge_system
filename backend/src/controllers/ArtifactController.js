import { artifactService } from "../services/ArtifactService.js";
import { approvalService } from "../services/ApprovalService.js";
import { searchService } from "../services/SearchService.js";

export class ArtifactController {
  constructor({
    artifacts = artifactService,
    approval = approvalService,
    search = searchService
  } = {}) {
    this.artifacts = artifacts;
    this.approval = approval;
    this.search = search;
  }

  async list(query) {
    return this.search.search(query);
  }

  async listOwn(ownerId) {
    return this.artifacts.listByOwner(ownerId);
  }

  async listPending() {
    return this.approval.listPending();
  }

  async getBySlug(slug) {
    return this.artifacts.getBySlug(slug);
  }

  async create(data) {
    return this.artifacts.create(data);
  }

  async update(slug, data) {
    return this.artifacts.update(slug, data);
  }

  async submit(slug) {
    return this.artifacts.submit(slug);
  }

  async returnToNew(slug) {
    return this.artifacts.returnToNew(slug);
  }

  async approve(slug, reviewer) {
    return this.approval.approve(slug, reviewer);
  }

  async reject(slug, reviewer) {
    return this.approval.reject(slug, reviewer);
  }

  async delete(slug) {
    return this.artifacts.delete(slug);
  }
}

export const artifactController = new ArtifactController();
