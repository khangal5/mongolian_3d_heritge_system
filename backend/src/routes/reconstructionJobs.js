import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { Router } from "express";
import multer from "multer";
import { config } from "../config/env.js";
import {
  createPhotoSetWithJob,
  getReconstructionJobById,
  listReconstructionJobs
} from "../repositories/reconstructionRepository.js";
import { enqueueReconstruction } from "../services/reconstructionWorker.js";

const router = Router();

await mkdir(config.uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, config.uploadDir);
  },
  filename: (_req, file, callback) => {
    callback(null, `${Date.now()}-${randomUUID()}${path.extname(file.originalname) || ".jpg"}`);
  }
});

const upload = multer({
  storage,
  limits: {
    files: 60,
    fileSize: 15 * 1024 * 1024
  }
});

router.get("/", async (_req, res, next) => {
  try {
    const items = await listReconstructionJobs();
    res.json({ items, total: items.length });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const item = await getReconstructionJobById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Reconstruction job олдсонгүй" });
    }

    return res.json(item);
  } catch (error) {
    next(error);
  }
});

router.post("/upload", upload.array("images", 60), async (req, res, next) => {
  try {
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
      }
    });

    enqueueReconstruction(created.id);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

export default router;
