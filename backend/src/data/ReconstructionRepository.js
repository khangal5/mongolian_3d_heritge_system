import * as fns from "../repositories/reconstructionRepository.js";

export class ReconstructionRepository {
  async createPhotoSetWithJob(payload) { return fns.createPhotoSetWithJob(payload); }
  async listJobs() { return fns.listReconstructionJobs(); }
  async findJobById(id) { return fns.getReconstructionJobById(id); }
  async updateJob(id, patch) { return fns.updateReconstructionJob(id, patch); }
}

export const reconstructionRepository = new ReconstructionRepository();
