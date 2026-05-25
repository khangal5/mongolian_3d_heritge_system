import { randomUUID } from "node:crypto";
import { Router } from "express";
import { config } from "../config/env.js";
import { requireVerifiedResearcher } from "../middleware/auth.js";
import {
  createPhotoSetWithJob,
  getReconstructionJobById,
  listReconstructionJobs
} from "../repositories/reconstructionRepository.js";
import { enqueueReconstruction } from "../services/reconstructionWorker.js";
import { createUploadHandler } from "../utils/upload.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

const upload = await createUploadHandler({
  destinationDir: config.uploadDir,
  mimeWhitelist: new Set(["image/jpeg", "image/jpg", "image/png"]),
  maxFiles: 200,
  maxFileSizeBytes: 15 * 1024 * 1024,
  errorMessage: "Зөвхөн JPG эсвэл PNG форматтай зураг оруулах боломжтой",
  defaultExtension: ".jpg"
});

router.get("/", asyncHandler(async (_req, res) => {
  const items = await listReconstructionJobs();
  res.json({ items, total: items.length });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const item = await getReconstructionJobById(req.params.id);

  if (!item) {
    return res.status(404).json({ message: "Reconstruction job олдсонгүй" });
  }

  return res.json(item);
}));

router.post(
  "/upload",
  requireVerifiedResearcher,
  upload.array("images", 200),
  asyncHandler(async (req, res) => {
    const files = req.files || [];

    if (!files.length) {
      return res.status(400).json({ message: "Дор хаяж нэг зураг оруулна уу" });
    }

    const created = await createPhotoSetWithJob({
      photoSet: {
        id: randomUUID(),
        title: req.body.title?.trim() || `Туршилтын багц ${Date.now()}`,
        description: req.body.description?.trim() || "",
        captureNotes: req.body.captureNotes?.trim() || "",
        status: "queue"
      },
      images: files.map((file, index) => ({
        id: randomUUID(),
        originalName: file.originalname,
        storedName: file.filename,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        filePath: file.path,
        publicUrl: `/uploads/${file.filename}`,
        sortOrder: index
      })),
      job: {
        id: randomUUID(),
        status: "queue",
        stage: "upload_complete",
        progressPercent: 5,
        engine: "photogrammetry-placeholder",
        engineMode: "mvp-simulation",
        estimatedQuality: "үнэлээгүй",
        resultSummary: "Зургууд амжилттай хадгалагдлаа. Processing эхлэхийг хүлээж байна.",
        generatedModelUrl: null,
        generatedFormat: null,
        processingLog: [
          {
            createdAt: new Date().toISOString(),
            stage: "upload_complete",
            message: `${files.length} зураг хүлээн авч reconstruction job үүсгэлээ.`
          }
        ]
      },
      createdByUserId: req.user?.id || null
    });

    enqueueReconstruction(created.id);
    res.status(201).json(created);
  })
);

export default router;
