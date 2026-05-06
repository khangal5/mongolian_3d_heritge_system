import { artifactsRepository } from "../data/ArtifactsRepository.js";
import { Artifact, ArtifactStatus } from "../entities/Artifact.js";

export class SearchService {
  constructor(repo = artifactsRepository) {
    this.repo = repo;
  }

  async search({
    q = "",
    searchBy = "all",
    category = "",
    province = "",
    has3d = null,
    userLat = null,
    userLng = null,
    sort = "newest",
    status = ArtifactStatus.APPROVED
  } = {}) {
    const { items, total, filters } = await this.repo.findAll({
      q,
      searchBy,
      category,
      province,
      has3d,
      userLat,
      userLng,
      sort,
      status
    });
    return {
      items: items.map((row) => new Artifact(row)),
      total,
      filters
    };
  }
}

export const searchService = new SearchService();
