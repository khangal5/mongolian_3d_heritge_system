import { Router } from "express";
import { randomUUID } from "node:crypto";
import {
  createArtifact,
  deleteArtifact,
  getArtifactBySlug,
  getArtifacts,
  updateArtifact
} from "../repositories/artifactsRepository.js";

const router = Router();

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
    modelEmbedUrl: body.modelEmbedUrl,
    tags: Array.isArray(body.tags) ? body.tags : [],
    status: body.status || "нийтлэгдсэн"
  };
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
    artifact.modelEmbedUrl
  ];

  if (requiredFields.some((field) => !field)) {
    return "Шаардлагатай талбарууд дутуу байна";
  }

  if (Number.isNaN(artifact.coordinates.lat) || Number.isNaN(artifact.coordinates.lng)) {
    return "Координатын утга буруу байна";
  }

  return null;
}

router.get("/", async (req, res, next) => {
  try {
    const data = await getArtifacts({
      q: (req.query.q || "").toString().trim(),
      category: (req.query.category || "").toString().trim(),
      province: (req.query.province || "").toString().trim()
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get("/:slug", async (req, res, next) => {
  try {
    const artifact = await getArtifactBySlug(req.params.slug);

    if (!artifact) {
      return res.status(404).json({ message: "Өвийн бүртгэл олдсонгүй" });
    }

    return res.json(artifact);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const artifact = normalizeArtifactPayload(req.body);
    const validationMessage = validateArtifactPayload(artifact);

    if (validationMessage) {
      return res.status(400).json({ message: validationMessage });
    }

    const created = await createArtifact(artifact);
    return res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

router.put("/:slug", async (req, res, next) => {
  try {
    const current = await getArtifactBySlug(req.params.slug);

    if (!current) {
      return res.status(404).json({ message: "Өвийн бүртгэл олдсонгүй" });
    }

    const artifact = normalizeArtifactPayload(req.body, current.id);
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

router.delete("/:slug", async (req, res, next) => {
  try {
    const deleted = await deleteArtifact(req.params.slug);

    if (!deleted) {
      return res.status(404).json({ message: "Өвийн бүртгэл олдсонгүй" });
    }

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
