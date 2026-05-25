export const JobStatus = Object.freeze({
  QUEUE: "queue",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed"
});

export class PhotoImage {
  constructor(row = {}) {
    this.id = row.id || null;
    this.photoSetId = row.photo_set_id || row.photoSetId || null;
    this.fileName = row.file_name || row.fileName || "";
    this.filePath = row.file_path || row.filePath || "";
    this.sortOrder = row.sort_order ?? row.sortOrder ?? 0;
  }
}

export class ReconstructionJob {
  constructor(row = {}) {
    this.id = row.id || null;
    this.photoSetId = row.photo_set_id || row.photoSetId || null;
    this.status = row.status || JobStatus.QUEUE;
    this.report = row.report || null;
    this.createdAt = row.created_at || row.createdAt || null;
    this.updatedAt = row.updated_at || row.updatedAt || null;
  }

  isQueued() { return this.status === JobStatus.QUEUE; }
  isCompleted() { return this.status === JobStatus.COMPLETED; }
  isFailed() { return this.status === JobStatus.FAILED; }
}

export class PhotoSet {
  constructor(data = {}) {
    this.id = data.id || null;
    this.userId = data.userId || data.user_id || null;
    this.title = data.title || "";
    this.description = data.description || "";
    this.captureNotes = data.captureNotes || data.capture_notes || "";
    this.images = (data.images || []).map((img) =>
      img instanceof PhotoImage ? img : new PhotoImage(img)
    );
    this.job = data.job
      ? data.job instanceof ReconstructionJob
        ? data.job
        : new ReconstructionJob(data.job)
      : null;
    this.createdAt = data.created_at || data.createdAt || null;
  }

  imageCount() { return this.images.length; }
}
