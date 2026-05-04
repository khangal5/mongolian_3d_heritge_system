import * as fns from "../repositories/reconstructionRepository.js";
import { ReconstructionJob } from "../entities/PhotoSet.js";

export class ReconstructionJobRepository {
  async save(job) {
    return fns.createPhotoSetWithJob({ photoSet: null, images: [], job, createdByUserId: null });
  }

  async findById(id) {
    const row = await fns.getReconstructionJobById(id);
    return row ? new ReconstructionJob(row) : null;
  }

  async findAll() {
    const rows = await fns.listReconstructionJobs();
    return rows.map((row) => new ReconstructionJob(row));
  }

  async updateStatus(id, status, extra = {}) {
    const row = await fns.updateReconstructionJob(id, { status, ...extra });
    return row ? new ReconstructionJob(row) : null;
  }
}

export const reconstructionJobRepository = new ReconstructionJobRepository();
