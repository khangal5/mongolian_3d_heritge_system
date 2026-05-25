import * as fns from "../repositories/reconstructionRepository.js";

export class PhotoSetRepository {
  async save({ id, title, description, captureNotes, status, images, job, userId }) {
    return fns.createPhotoSetWithJob({
      photoSet: { id, title, description, captureNotes, status },
      images: images || [],
      job: job || null,
      createdByUserId: userId || null
    });
  }

  async findById(id) {
    const jobs = await fns.listReconstructionJobs();
    return jobs.find((j) => j.photoSetId === id) || null;
  }

  async findAll() {
    return fns.listReconstructionJobs();
  }
}

export const photoSetRepository = new PhotoSetRepository();
