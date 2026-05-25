import { randomUUID } from "node:crypto";
import { query } from "../db/pool.js";
import { MediaFile } from "../entities/MediaFile.js";

export class MediaRepository {
  async save(media) {
    const id = media.id || randomUUID();
    await query(
      `INSERT INTO media_files (id, artifact_id, file_url, file_type, is_primary, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        id,
        media.artifactId,
        media.fileUrl,
        media.fileType,
        Boolean(media.isPrimary),
        media.sortOrder ?? 0
      ]
    );
    return new MediaFile({ ...media, id });
  }

  async findByArtifactId(artifactId) {
    const result = await query(
      `SELECT * FROM media_files WHERE artifact_id = $1 ORDER BY is_primary DESC, sort_order ASC`,
      [artifactId]
    );
    return result.rows.map((row) => new MediaFile(row));
  }

  async deleteById(id) {
    const result = await query(`DELETE FROM media_files WHERE id = $1 RETURNING id`, [id]);
    return Boolean(result.rowCount);
  }

  async deleteByArtifactId(artifactId) {
    await query(`DELETE FROM media_files WHERE artifact_id = $1`, [artifactId]);
  }
}

export const mediaRepository = new MediaRepository();
