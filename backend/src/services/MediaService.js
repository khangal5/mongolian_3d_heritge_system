import { mediaRepository } from "../data/MediaRepository.js";
import { MediaFile } from "../entities/MediaFile.js";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_MODEL_EXTENSIONS = new Set([".glb", ".gltf"]);

export class MediaService {
  constructor(repo = mediaRepository) {
    this.repo = repo;
  }

  validateFileType(file) {
    if (!file) return false;
    if (file.mimetype && ALLOWED_IMAGE_TYPES.has(file.mimetype)) return true;
    if (file.originalname) {
      const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf("."));
      if (ALLOWED_MODEL_EXTENSIONS.has(ext)) return true;
    }
    return false;
  }

  saveToStorage(file) {
    return file?.path || file?.filename || "";
  }

  async uploadMedia({ artifactId, fileUrl, fileType, isPrimary = false, sortOrder = 0 }) {
    const media = new MediaFile({ artifactId, fileUrl, fileType, isPrimary, sortOrder });
    return this.repo.save(media);
  }

  async deleteMedia(id) {
    await this.repo.deleteById(id);
  }

  async getMediaByArtifactId(artifactId) {
    return this.repo.findByArtifactId(artifactId);
  }
}

export const mediaService = new MediaService();
