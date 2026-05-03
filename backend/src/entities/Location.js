export class Location {
  constructor(row = {}) {
    this.id = row.id || null;
    this.artifactId = row.artifact_id || row.artifactId || null;
    this.province = row.province || "";
    this.location = row.location || "";
    this.latitude = row.latitude ?? null;
    this.longitude = row.longitude ?? null;
  }

  toJSON() {
    return {
      province: this.province,
      location: this.location,
      coordinates: { lat: this.latitude, lng: this.longitude }
    };
  }
}
