export class MediaFile {
  constructor(row = {}) {
    this.id = row.id || null;
    this.artifactId = row.artifact_id || row.artifactId || null;
    this.fileUrl = row.file_url || row.fileUrl || "";
    this.fileType = row.file_type || row.fileType || "image";
    this.isPrimary = Boolean(row.is_primary ?? row.isPrimary);
    this.sortOrder = row.sort_order ?? row.sortOrder ?? 0;
  }

  isImage() { return this.fileType === "image"; }
  isModel() { return this.fileType === "model"; }
}
