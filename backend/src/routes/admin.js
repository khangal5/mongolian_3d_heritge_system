import { Router } from "express";
import { requireRole } from "../middleware/auth.js";
import { listRecentAudit } from "../repositories/auditRepository.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get(
  "/audit-log",
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const items = await listRecentAudit({
      limit: req.query.limit,
      action: req.query.action || null,
      targetType: req.query.targetType || null
    });
    res.json({ items, total: items.length });
  })
);

export default router;
