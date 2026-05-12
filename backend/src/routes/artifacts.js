import { randomUUID } from "node:crypto";
import path from "node:path";
import { Router } from "express";
import { config } from "../config/env.js";
import { ArtifactStatus as ARTIFACT_STATUSES } from "../entities/Artifact.js";
import { requireAuth, requireRole, requireVerifiedResearcher } from "../middleware/auth.js";
import { createUploadHandler } from "../utils/upload.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { artifactController } from "../controllers/ArtifactController.js";
import { adminController } from "../controllers/AdminController.js";
import { mediaService } from "../services/MediaService.js";
import { locationService } from "../services/LocationService.js";

const router = Router();

const modelUpload = await createUploadHandler({
  destinationDir: path.join(config.uploadDir, "models"),
  extensionWhitelist: new Set([".glb", ".gltf"]),
  maxFiles: 1,
  maxFileSizeBytes: 150 * 1024 * 1024,
  errorMessage: "Only .glb or .gltf files are allowed",
  defaultExtension: ".glb"
});

const imageUpload = await createUploadHandler({
  destinationDir: path.join(config.uploadDir, "images"),
  extensionWhitelist: new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]),
  maxFiles: 1,
  maxFileSizeBytes: 10 * 1024 * 1024,
  errorMessage: "Only .jpg, .png, .webp, or .gif images are allowed",
  defaultExtension: ".jpg"
});

const galleryUpload = await createUploadHandler({
  destinationDir: path.join(config.uploadDir, "images"),
  extensionWhitelist: new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]),
  maxFiles: 20,
  maxFileSizeBytes: 10 * 1024 * 1024,
  errorMessage: "Only .jpg, .png, .webp, or .gif images are allowed",
  defaultExtension: ".jpg"
});

function buildPublicAssetUrl(req, pathname) {
  // In production the App Service proxy strips TLS, so req.protocol can be
  // "http" even though the public URL is HTTPS. Force https when the request
  // came in via TLS (X-Forwarded-Proto) or NODE_ENV=production.
  const forwarded = req.get("x-forwarded-proto");
  const protocol =
    forwarded?.split(",")[0].trim() ||
    (config.nodeEnv === "production" ? "https" : req.protocol);
  return `${protocol}://${req.get("host")}${pathname}`;
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
    artifact.imageUrl
  ];

  if (requiredFields.some((field) => !field)) {
    return "Шаардлагатай талбарууд дутуу байна";
  }

  if (Number.isNaN(artifact.coordinates.lat) || Number.isNaN(artifact.coordinates.lng)) {
    return "Координатын утга буруу байна";
  }

  // 3D model is optional (admin uploads after photogrammetry).
  // Only validate format if a URL was provided.
  if (artifact.modelUrl && !isSupportedModelUrl(artifact.modelUrl)) {
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

router.get("/", asyncHandler(async (req, res) => {
  const userLatRaw = req.query.userLat;
  const userLngRaw = req.query.userLng;
  const userLat =
    userLatRaw !== undefined && userLatRaw !== "" ? Number(userLatRaw) : null;
  const userLng =
    userLngRaw !== undefined && userLngRaw !== "" ? Number(userLngRaw) : null;

  const has3dRaw = (req.query.has3d || "").toString().trim().toLowerCase();
  const has3d = has3dRaw === "1" || has3dRaw === "true" ? true
    : has3dRaw === "0" || has3dRaw === "false" ? false
    : null;

  const data = await artifactController.list({
    q: (req.query.q || "").toString().trim(),
    searchBy: (req.query.searchBy || "all").toString().trim(),
    category: (req.query.category || "").toString().trim(),
    province: (req.query.province || "").toString().trim(),
    has3d,
    userLat: Number.isFinite(userLat) ? userLat : null,
    userLng: Number.isFinite(userLng) ? userLng : null,
    sort: (req.query.sort || "newest").toString().trim(),
    includeItems:
      (req.query.includeItems || "true").toString().trim().toLowerCase() !== "false",
    status: ARTIFACT_STATUSES.APPROVED
  });

  res.json(data);
}));

router.get("/mine", requireRole("researcher", "admin"), asyncHandler(async (req, res) => {
  const items = await artifactController.listOwn(req.user.id);
  res.json({ items, total: items.length });
}));

router.get("/admin/queue", requireRole("admin"), asyncHandler(async (req, res) => {
  const status = (req.query.status || ARTIFACT_STATUSES.PENDING).toString().toUpperCase();

  if (!Object.values(ARTIFACT_STATUSES).includes(status)) {
    return res.status(400).json({ message: "Тодорхойгүй төлөв" });
  }

  const items = status === ARTIFACT_STATUSES.PENDING
    ? await adminController.listPending()
    : await artifactController.listByStatus(status);
  return res.json({ items, total: items.length, status });
}));

router.get("/:slug", asyncHandler(async (req, res) => {
  const artifact = await artifactController.getBySlug(req.params.slug);

  if (!artifact || !canViewArtifact(artifact, req.user)) {
    return res.status(404).json({ message: "Өвийн бүртгэл олдсонгүй" });
  }

  return res.json(artifact);
}));

router.get("/:slug/location", asyncHandler(async (req, res) => {
  const artifact = await artifactController.getBySlug(req.params.slug);
  if (!artifact || !canViewArtifact(artifact, req.user)) {
    return res.status(404).json({ message: "Өвийн бүртгэл олдсонгүй" });
  }
  const location = await locationService.getLocation(artifact.id);
  if (!location) {
    return res.status(404).json({ message: "Байршил тохируулагдаагүй" });
  }
  return res.json(location.toJSON());
}));

router.post(
  "/upload-model",
  requireVerifiedResearcher,
  modelUpload.single("model"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "3D model file required" });
    }
    if (!mediaService.validateFileType(req.file)) {
      return res.status(400).json({ message: "Only .glb or .gltf files are allowed" });
    }

    const publicPath = `/uploads/models/${mediaService.saveToStorage({ filename: req.file.filename })}`;

    return res.status(201).json({
      fileName: req.file.originalname,
      publicUrl: publicPath,
      modelUrl: buildPublicAssetUrl(req, publicPath)
    });
  }
);

router.post(
  "/upload-image",
  requireVerifiedResearcher,
  imageUpload.single("image"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "Image file required" });
    }
    if (!mediaService.validateFileType(req.file)) {
      return res.status(400).json({ message: "Only image files are allowed" });
    }

    const publicPath = `/uploads/images/${req.file.filename}`;

    return res.status(201).json({
      fileName: req.file.originalname,
      publicUrl: publicPath,
      imageUrl: buildPublicAssetUrl(req, publicPath)
    });
  }
);

router.post(
  "/upload-images",
  requireVerifiedResearcher,
  galleryUpload.array("images", 20),
  (req, res) => {
    if (!req.files?.length) {
      return res.status(400).json({ message: "At least one image required" });
    }

    const items = req.files.map((file) => {
      const publicPath = `/uploads/images/${file.filename}`;
      return {
        fileName: file.originalname,
        publicUrl: publicPath,
        imageUrl: buildPublicAssetUrl(req, publicPath)
      };
    });

    return res.status(201).json({ items });
  }
);

router.post("/", requireVerifiedResearcher, asyncHandler(async (req, res) => {
  const artifact = normalizeArtifactPayload(req.body);
  const validationMessage = validateArtifactPayload(artifact);

  if (validationMessage) {
    return res.status(400).json({ message: validationMessage });
  }

  const created = await artifactController.create({
    ...artifact,
    createdByUserId: req.user.id
  });
  return res.status(201).json(created);
}));

router.put("/:slug", requireAuth, asyncHandler(async (req, res) => {
  const current = await artifactController.getBySlug(req.params.slug);

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

  const updated = await artifactController.update(req.params.slug, artifact);
  return res.json(updated);
}));

router.delete("/:slug", requireAuth, asyncHandler(async (req, res) => {
  const current = await artifactController.getBySlug(req.params.slug);

  if (!current) {
    return res.status(404).json({ message: "Өвийн бүртгэл олдсонгүй" });
  }

  if (!canModifyArtifact(current, req.user)) {
    return res.status(403).json({
      message: "Зөвхөн NEW төлөвт байгаа өөрийн өвийг устгах боломжтой."
    });
  }

  const deleted = await artifactController.delete(req.params.slug);

  if (!deleted) {
    return res.status(404).json({ message: "Өвийн бүртгэл олдсонгүй" });
  }

  return res.status(204).send();
}));

function ensureOwnerOrAdmin(artifact, user, message) {
  if (user.role !== "admin" && artifact.createdByUserId !== user.id) {
    return message;
  }
  return null;
}

router.post("/:slug/revert", requireVerifiedResearcher, asyncHandler(async (req, res) => {
  const current = await artifactController.getBySlug(req.params.slug);

  if (!current) {
    return res.status(404).json({ message: "Өвийн бүртгэл олдсонгүй" });
  }

  const ownershipError = ensureOwnerOrAdmin(current, req.user, "Зөвхөн өөрийн өвийг засах боломжтой");
  if (ownershipError) {
    return res.status(403).json({ message: ownershipError });
  }

  if (current.status !== ARTIFACT_STATUSES.REJECTED) {
    return res
      .status(409)
      .json({ message: "Зөвхөн REJECTED төлөвтэй өвийг NEW рүү буцаах боломжтой" });
  }

  const updated = await artifactController.returnToNew(req.params.slug);
  return res.json(updated);
}));

router.post("/:slug/submit", requireVerifiedResearcher, asyncHandler(async (req, res) => {
  const current = await artifactController.getBySlug(req.params.slug);

  if (!current) {
    return res.status(404).json({ message: "Өвийн бүртгэл олдсонгүй" });
  }

  const ownershipError = ensureOwnerOrAdmin(current, req.user, "Зөвхөн өөрийн өвийг илгээх боломжтой");
  if (ownershipError) {
    return res.status(403).json({ message: ownershipError });
  }

  if (current.status !== ARTIFACT_STATUSES.NEW) {
    return res
      .status(409)
      .json({ message: "Зөвхөн NEW төлөвтэй өвийг шалгуулахаар илгээх боломжтой" });
  }

  const updated = await artifactController.submit(req.params.slug);
  return res.json(updated);
}));

router.post("/:slug/approve", requireRole("admin"), asyncHandler(async (req, res) => {
  const current = await artifactController.getBySlug(req.params.slug);

  if (!current) {
    return res.status(404).json({ message: "Өвийн бүртгэл олдсонгүй" });
  }

  if (current.status !== ARTIFACT_STATUSES.PENDING) {
    return res
      .status(409)
      .json({ message: "Зөвхөн PENDING төлөвтэй өвийг баталгаажуулах боломжтой" });
  }

  const updated = await adminController.approve(req.params.slug, {
    reviewerId: req.user.id,
    reviewNote: typeof req.body?.note === "string" ? req.body.note : null
  });
  return res.json(updated);
}));

router.post("/:slug/reject", requireRole("admin"), asyncHandler(async (req, res) => {
  const current = await artifactController.getBySlug(req.params.slug);

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

  const updated = await adminController.reject(req.params.slug, {
    reviewerId: req.user.id,
    reviewNote: note
  });
  return res.json(updated);
}));

export default router;