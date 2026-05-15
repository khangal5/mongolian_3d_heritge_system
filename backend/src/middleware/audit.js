import { recordAudit } from "../repositories/auditRepository.js";

export function auditAction(action, { targetType, targetIdFrom = "params.id", detailsFrom } = {}) {
  return async (req, res, next) => {
    res.on("finish", () => {
      if (res.statusCode >= 400) return;

      const targetId = resolvePath(req, targetIdFrom);
      const details =
        typeof detailsFrom === "function"
          ? detailsFrom(req, res) || {}
          : detailsFrom || {};

      recordAudit({
        actorUserId: req.user?.id || null,
        actorEmail: req.user?.email || null,
        actorRole: req.user?.role || null,
        action,
        targetType,
        targetId,
        details,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"] || null
      });
    });
    return next();
  };
}

function resolvePath(req, path) {
  if (!path) return null;
  const parts = path.split(".");
  let value = req;
  for (const part of parts) {
    if (value == null) return null;
    value = value[part];
  }
  return value ?? null;
}
