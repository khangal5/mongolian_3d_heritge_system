import { reconstructionRepository } from "../data/ReconstructionRepository.js";
import { analyzePhotoSet, summarizeReport, estimateQualityFromReport } from "../utils/imageQuality.js";
import { PhotoSet, ReconstructionJob } from "../entities/PhotoSet.js";

export class ReconstructionService {
  constructor(repo = reconstructionRepository) {
    this.repo = repo;
  }

  async listJobs() {
    const rows = await this.repo.listJobs();
    return rows.map((row) => new ReconstructionJob(row));
  }

  async getJobById(id) {
    const row = await this.repo.findJobById(id);
    return row ? new ReconstructionJob(row) : null;
  }

  async submitPhotoSet({ photoSet, images, job, createdByUserId }) {
    return this.repo.createPhotoSetWithJob({ photoSet, images, job, createdByUserId });
  }

  async analyzeImages(images) {
    const report = await analyzePhotoSet(images);
    return {
      report,
      summary: summarizeReport(report),
      quality: estimateQualityFromReport(report)
    };
  }

  async updateJobStatus(id, patch) {
    const row = await this.repo.updateJob(id, patch);
    return row ? new ReconstructionJob(row) : null;
  }
}

export const reconstructionService = new ReconstructionService();
