import { locationRepository } from "../data/LocationRepository.js";
import { Location } from "../entities/Location.js";

export class LocationService {
  constructor(repo = locationRepository) {
    this.repo = repo;
  }

  async setLocation(artifactId, locationData) {
    const location = new Location({ ...locationData, artifactId });
    return this.repo.save(location);
  }

  async getLocation(artifactId) {
    return this.repo.findByArtifactId(artifactId);
  }
}

export const locationService = new LocationService();
