import { photoSetRepository } from "../data/PhotoSetRepository.js";
import { reconstructionJobRepository } from "../data/ReconstructionJobRepository.js";
import { analyzePhotoSet, summarizeReport, estimateQualityFromReport } from "../utils/imageQuality.js";

export class ReconstructionService {
  constructor({
    photoSets = photoSetRepository,
    jobs = reconstructionJobRepository
  } = {}) {
    this.photoSets = photoSets;
    this.jobs = jobs;
  }

  async listJobs() {
    return this.jobs.findAll();
  }

  async getJobById(id) {
    return this.jobs.findById(id);
  }

  async submitPhotoSet({ photoSet, images, job, createdByUserId }) {
    return this.photoSets.save({
      ...photoSet,
      images,
      job,
      userId: createdByUserId
    });
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
    return this.jobs.updateStatus(id, patch.status, patch);
  }
}

export const reconstructionService = new ReconstructionService();
