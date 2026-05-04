import * as fns from "../repositories/reconstructionRepository.js";
import { PhotoSet } from "../entities/PhotoSet.js";

export class PhotoSetRepository {
  async save(photoSet) {
    return fns.createPhotoSetWithJob({
      photoSet,
      images: photoSet.images || [],
      job: photoSet.job || null,
      createdByUserId: photoSet.userId || null
    });
  }

  async findById(id) {
    const jobs = await fns.listReconstructionJobs();
    const job = jobs.find((j) => j.photoSetId === id);
    if (!job) return null;
    return new PhotoSet({ id, job });
  }

  async findAll() {
    const jobs = await fns.listReconstructionJobs();
    return jobs.map((job) => new PhotoSet({ id: job.photoSetId, job }));
  }
}

export const photoSetRepository = new PhotoSetRepository();
