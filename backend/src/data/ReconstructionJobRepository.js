import * as fns from "../repositories/reconstructionRepository.js";

export class ReconstructionJobRepository {
  async save(job) {
    return fns.createPhotoSetWithJob({ photoSet: null, images: [], job, createdByUserId: null });
  }

  async findById(id) {
    return fns.getReconstructionJobById(id);
  }

  async findAll() {
    return fns.listReconstructionJobs();
  }

  async updateStatus(id, status, extra = {}) {
    return fns.updateReconstructionJob(id, { status, ...extra });
  }
}

export const reconstructionJobRepository = new ReconstructionJobRepository();
