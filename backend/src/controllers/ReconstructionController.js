import { reconstructionService } from "../services/ReconstructionService.js";

export class ReconstructionController {
  constructor(service = reconstructionService) {
    this.service = service;
  }

  async listJobs() {
    return this.service.listJobs();
  }

  async getJobById(id) {
    return this.service.getJobById(id);
  }

  async uploadPhotoSet(payload) {
    return this.service.submitPhotoSet(payload);
  }

  async analyzeImages(images) {
    return this.service.analyzeImages(images);
  }
}

export const reconstructionController = new ReconstructionController();
