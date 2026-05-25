import { randomUUID } from "node:crypto";
import { query } from "../db/pool.js";
import { Location } from "../entities/Location.js";

export class LocationRepository {
  async save(location) {
    const id = location.id || randomUUID();
    await query(
      `INSERT INTO locations (id, artifact_id, province, location, latitude, longitude, geom)
       VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($6, $5), 4326)::geography)
       ON CONFLICT (artifact_id) DO UPDATE
         SET province = EXCLUDED.province,
             location = EXCLUDED.location,
             latitude = EXCLUDED.latitude,
             longitude = EXCLUDED.longitude,
             geom = EXCLUDED.geom`,
      [
        id,
        location.artifactId,
        location.province,
        location.location,
        location.latitude,
        location.longitude
      ]
    );
    return new Location({ ...location, id });
  }

  async findByArtifactId(artifactId) {
    const result = await query(
      `SELECT id, artifact_id, province, location, latitude, longitude
       FROM locations WHERE artifact_id = $1 LIMIT 1`,
      [artifactId]
    );
    if (!result.rowCount) return null;
    return new Location(result.rows[0]);
  }
}

export const locationRepository = new LocationRepository();
