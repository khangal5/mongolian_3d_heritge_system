export const ArtifactStatus = Object.freeze({
  NEW: "NEW",
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED"
});

export class Artifact {
  constructor(data = {}) {
    this.id = data.id || null;
    this.slug = data.slug || "";
    this.name = data.name || "";
    this.nameMn = data.nameMn || data.name_mn || "";
    this.category = data.category || "";
    this.period = data.period || "";
    this.province = data.province || "";
    this.location = data.location || "";
    this.coordinates = data.coordinates || { lat: null, lng: null };
    this.shortDescription = data.shortDescription || data.short_description || "";
    this.description = data.description || "";
    this.imageUrl = data.imageUrl || "";
    this.gallery = Array.isArray(data.gallery) ? data.gallery : [];
    this.modelUrl = data.modelUrl || null;
    this.modelEmbedUrl = data.modelEmbedUrl || data.modelUrl || null;
    this.tags = data.tags || [];
    this.status = data.status || ArtifactStatus.NEW;
    this.createdByUserId = data.createdByUserId || data.created_by_user_id || null;
    this.reviewedByUserId = data.reviewedByUserId || data.reviewed_by_user_id || null;
    this.reviewedAt = data.reviewedAt || data.reviewed_at || null;
    this.reviewNote = data.reviewNote || data.review_note || null;
    this.createdAt = data.createdAt || data.created_at || null;
    this.updatedAt = data.updatedAt || data.updated_at || null;
  }

  isApproved() { return this.status === ArtifactStatus.APPROVED; }
  isPending() { return this.status === ArtifactStatus.PENDING; }
  isNew() { return this.status === ArtifactStatus.NEW; }
  isRejected() { return this.status === ArtifactStatus.REJECTED; }
  isOwnedBy(userId) { return this.createdByUserId === userId; }
  canBeEditedBy(user) {
    if (!user) return false;
    if (user.isAdmin && user.isAdmin()) return true;
    return this.isOwnedBy(user.id) && this.isNew();
  }
}
