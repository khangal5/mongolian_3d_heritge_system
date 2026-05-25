import { artifactRepository } from "../data/ArtifactRepository.js";
import { ArtifactStatus } from "../entities/Artifact.js";

export class SearchService {
  constructor(repo = artifactRepository) {
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
    includeItems = true,
    status = ArtifactStatus.APPROVED
  } = {}) {
    return this.repo.searchArtifact({
      q,
      searchBy,
      category,
      province,
      has3d,
      userLat,
      userLng,
      sort,
      includeItems,
      status
    });
  }
}

export const searchService = new SearchService();
