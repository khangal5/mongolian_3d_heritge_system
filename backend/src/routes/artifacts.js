import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { Router } from "express";
import multer from "multer";
import { config } from "../config/env.js";
import {
  ARTIFACT_STATUSES,
  createArtifact,
  deleteArtifact,
  getArtifactBySlug,
  getArtifacts,
  getArtifactsByOwner,
  getArtifactsByStatus,
  setArtifactStatus,
  updateArtifact
} from "../repositories/artifactsRepository.js";
import { requireAuth, requireRole, requireVerifiedResearcher } from "../middleware/auth.js";

const router = Router();
const modelsDir = path.join(config.uploadDir, "models");
const allowedExtensions = new Set([".glb", ".gltf"]);

await mkdir(modelsDir, { recursive: true });

const modelStorage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, modelsDir);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${Date.now()}-${randomUUID()}${extension || ".glb"}`);
  }
});

const modelUpload = multer({
  storage: modelStorage,
  limits: {
    files: 1,
    fileSize: 150 * 1024 * 1024
  },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.has(extension)) {
      const error = new Error("Only .glb or .gltf files are allowed");
      error.statusCode = 400;
      callback(error);
      return;
    }

    callback(null, true);
  }
});

function buildPublicAssetUrl(req, pathname) {
  return `${req.protocol}://${req.get("host")}${pathname}`;
}

function normalizeArtifactPayload(body, fallbackId) {
  return {
    id: body.id || fallbackId || randomUUID(),
    slug: body.slug,
    name: body.name,
    nameMn: body.nameMn || body.name,
    category: body.category,
    period: body.period,
    province: body.province,
    location: body.location,
    coordinates: {
      lat: Number(body.coordinates?.lat),
      lng: Number(body.coordinates?.lng)
    },
    shortDescription: body.shortDescription,
    description: body.description,
    imageUrl: body.imageUrl,
    gallery: Array.isArray(body.gallery) ? body.gallery : [],
    modelUrl: body.modelUrl || body.modelEmbedUrl,
    tags: Array.isArray(body.tags) ? body.tags : [],
    status: ARTIFACT_STATUSES.NEW
  };
}

function isSupportedModelUrl(modelUrl) {
  if (!modelUrl) {
    return false;
  }

  try {
    const parsed = new URL(modelUrl, "http://localhost");
    const pathname = parsed.pathname.toLowerCase();
    return pathname.endsWith(".glb") || pathname.endsWith(".gltf");
  } catch {
    return false;
  }
}

function validateArtifactPayload(artifact) {
  const requiredFields = [
    artifact.slug,
    artifact.name,
    artifact.category,
    artifact.period,
    artifact.province,
    artifact.location,
    artifact.shortDescription,
    artifact.description,
    artifact.imageUrl,
    artifact.modelUrl
  ];

  if (requiredFields.some((field) => !field)) {
    return "Шаардлагатай талбарууд дутуу байна";
  }

  if (Number.isNaN(artifact.coordinates.lat) || Number.isNaN(artifact.coordinates.lng)) {
    return "Координатын утга буруу байна";
  }

  if (!isSupportedModelUrl(artifact.modelUrl)) {
    return "3D model URL нь .glb эсвэл .gltf файл руу заасан байх ёстой";
  }

  return null;
}

function canViewArtifact(artifact, user) {
  if (artifact.status === ARTIFACT_STATUSES.APPROVED) {
    return true;
  }
  if (!user) {
    return false;
  }
  if (user.role === "admin") {
    return true;
  }
  return user.role === "researcher" && artifact.createdByUserId === user.id;
}

function canModifyArtifact(artifact, user) {
  if (!user) {
    return false;
  }
  if (user.role === "admin") {
    return true;
  }
  return (
    user.role === "researcher" &&
    artifact.createdByUserId === user.id &&
    artifact.status === ARTIFACT_STATUSES.NEW
  );
}

router.get("/", async (req, res, next) => {
  try {
    const userLatRaw = req.query.userLat;
    const userLngRaw = req.query.userLng;
    const userLat =
      userLatRaw !== undefined && userLatRaw !== "" ? Number(userLatRaw) : null;
    const userLng =
      userLngRaw !== undefined && userLngRaw !== "" ? Number(userLngRaw) : null;

    const data = await getArtifacts({
      q: (req.query.q || "").toString().trim(),
      searchBy: (req.query.searchBy || "all").toString().trim(),
      category: (req.query.category || "").toString().trim(),
      province: (req.query.province || "").toString().trim(),
      userLat: Number.isFinite(userLat) ? userLat : null,
      userLng: Number.isFinite(userLng) ? userLng : null,
      includeItems:
        (req.query.includeItems || "true").toString().trim().toLowerCase() !== "false",
      status: ARTIFACT_STATUSES.APPROVED
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get("/mine", requireRole("researcher", "admin"), async (req, res, next) => {
  try {
    const items = await getArtifactsByOwner(req.user.id);
    res.json({ items, total: items.length });
  } catch (error) {
    next(error);
  }
});

router.get("/admin/queue", requireRole("admin"), async (req, res, next) => {
  try {
    const status = (req.query.status || ARTIFACT_STATUSES.PENDING).toString().toUpperCase();

    if (!Object.values(ARTIFACT_STATUSES).includes(status)) {
      return res.status(400).json({ message: "Тодорхойгүй төлөв" });
    }

    const items = await getArtifactsByStatus(status);
    return res.json({ items, total: items.length, status });
  } catch (error) {
    return next(error);
  }
});

router.get("/:slug", async (req, res, next) => {
  try {
    const artifact = await getArtifactBySlug(req.params.slug);

    if (!artifact) {
      return res.status(404).json({ message: "Өвийн бүртгэл олдсонгүй" });
    }

    if (!canViewArtifact(artifact, req.user)) {
      return res.status(404).json({ message: "Өвийн бүртгэл олдсонгүй" });
    }

    return res.json(artifact);
  } catch (error) {
    next(error);
  }
});

router.post(
  "/upload-model",
  requireVerifiedResearcher,
  modelUpload.single("model"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "3D model file required" });
    }

    const publicPath = `/uploads/models/${req.file.filename}`;

    return res.status(201).json({
      fileName: req.file.originalname,
      publicUrl: publicPath,
      modelUrl: buildPublicAssetUrl(req, publicPath)
    });
  }
);

router.post("/", requireVerifiedResearcher, async (req, res, next) => {
  try {
    const artifact = normalizeArtifactPayload(req.body);
    const validationMessage = validateArtifactPayload(artifact);

    if (validationMessage) {
      return res.status(400).json({ message: validationMessage });
    }

    const created = await createArtifact({
      ...artifact,
      createdByUserId: req.user.id
    });
    return res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

router.put("/:slug", requireAuth, async (req, res, next) => {
  try {
    const current = await getArtifactBySlug(req.params.slug);

    if (!current) {
      return res.status(404).json({ message: "Өвийн бүртгэл олдсонгүй" });
    }

    if (!canModifyArtifact(current, req.user)) {
      return res.status(403).json({
        message:
          "Зөвхөн NEW төлөвт байгаа өөрийн өвийг засах боломжтой. Илгээсэн эсвэл баталгаажсан өвийг засах эрхгүй."
      });
    }

    const artifact = normalizeArtifactPayload(req.body, current.id);
    artifact.status = current.status;
    const validationMessage = validateArtifactPayload(artifact);

    if (validationMessage) {
      return res.status(400).json({ message: validationMessage });
    }

    const updated = await updateArtifact(req.params.slug, artifact);
    return res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete("/:slug", requireAuth, async (req, res, next) => {
  try {
    const current = await getArtifactBySlug(req.params.slug);

    if (!current) {
      return res.status(404).json({ message: "Өвийн бүртгэл олдсонгүй" });
    }

    if (!canModifyArtifact(current, req.user)) {
      return res.status(403).json({
        message: "Зөвхөн NEW төлөвт байгаа өөрийн өвийг устгах боломжтой."
      });
    }

    const deleted = await deleteArtifact(req.params.slug);

    if (!deleted) {
      return res.status(404).json({ message: "Өвийн бүртгэл олдсонгүй" });
    }

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post("/:slug/revert", requireVerifiedResearcher, async (req, res, next) => {
  try {
    const current = await getArtifactBySlug(req.params.slug);

    if (!current) {
      return res.status(404).json({ message: "Өвийн бүртгэл олдсонгүй" });
    }

    if (req.user.role !== "admin" && current.createdByUserId !== req.user.id) {
      return res.status(403).json({ message: "Зөвхөн өөрийн өвийг засах боломжтой" });
    }

    if (current.status !== ARTIFACT_STATUSES.REJECTED) {
      return res
        .status(409)
        .json({ message: "Зөвхөн REJECTED төлөвтэй өвийг NEW рүү буцаах боломжтой" });
    }

    const updated = await setArtifactStatus(req.params.slug, {
      status: ARTIFACT_STATUSES.NEW
    });
    return res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.post("/:slug/submit", requireVerifiedResearcher, async (req, res, next) => {
  try {
    const current = await getArtifactBySlug(req.params.slug);

    if (!current) {
      return res.status(404).json({ message: "Өвийн бүртгэл олдсонгүй" });
    }

    if (req.user.role !== "admin" && current.createdByUserId !== req.user.id) {
      return res.status(403).json({ message: "Зөвхөн өөрийн өвийг илгээх боломжтой" });
    }

    if (current.status !== ARTIFACT_STATUSES.NEW) {
      return res
        .status(409)
        .json({ message: "Зөвхөн NEW төлөвтэй өвийг шалгуулахаар илгээх боломжтой" });
    }

    const updated = await setArtifactStatus(req.params.slug, {
      status: ARTIFACT_STATUSES.PENDING
    });
    return res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.post("/:slug/approve", requireRole("admin"), async (req, res, next) => {
  try {
    const current = await getArtifactBySlug(req.params.slug);

    if (!current) {
      return res.status(404).json({ message: "Өвийн бүртгэл олдсонгүй" });
    }

    if (current.status !== ARTIFACT_STATUSES.PENDING) {
      return res
        .status(409)
        .json({ message: "Зөвхөн PENDING төлөвтэй өвийг баталгаажуулах боломжтой" });
    }

    const updated = await setArtifactStatus(req.params.slug, {
      status: ARTIFACT_STATUSES.APPROVED,
      reviewerId: req.user.id,
      reviewNote: typeof req.body?.note === "string" ? req.body.note : null
    });
    return res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.post("/:slug/reject", requireRole("admin"), async (req, res, next) => {
  try {
    const current = await getArtifactBySlug(req.params.slug);

    if (!current) {
      return res.status(404).json({ message: "Өвийн бүртгэл олдсонгүй" });
    }

    if (current.status !== ARTIFACT_STATUSES.PENDING) {
      return res
        .status(409)
        .json({ message: "Зөвхөн PENDING төлөвтэй өвийг татгалзах боломжтой" });
    }

    const note = typeof req.body?.note === "string" ? req.body.note.trim() : "";

    if (!note) {
      return res.status(400).json({ message: "Татгалзах шалтгаан тэмдэглэгээ заавал шаардлагатай" });
    }

    const updated = await setArtifactStatus(req.params.slug, {
      status: ARTIFACT_STATUSES.REJECTED,
      reviewerId: req.user.id,
      reviewNote: note
    });
    return res.json(updated);
  } catch (error) {
    next(error);
  }
});

export default router;