import { query } from "../db/pool.js";
import { logger } from "../utils/logger.js";

const auditLogger = logger.child({ module: "audit" });

export async function recordAudit({
  actorUserId = null,
  actorEmail = null,
  actorRole = null,
  action,
  targetType = null,
  targetId = null,
  details = {},
  ipAddress = null,
  userAgent = null
}) {
  try {
    await query(
      `
        INSERT INTO audit_log (
          actor_user_id, actor_email, actor_role, action,
          target_type, target_id, details, ip_address, user_agent
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)
      `,
      [
        actorUserId,
        actorEmail,
        actorRole,
        action,
        targetType,
        targetId,
        JSON.stringify(details || {}),
        ipAddress,
        userAgent
      ]
    );
  } catch (error) {
    auditLogger.error({ err: error, action }, "Audit log бичигдсэнгүй");
  }
}

export async function listRecentAudit({ limit = 100, action = null, targetType = null } = {}) {
  const conditions = [];
  const params = [];

  if (action) {
    params.push(action);
    conditions.push(`action = $${params.length}`);
  }
  if (targetType) {
    params.push(targetType);
    conditions.push(`target_type = $${params.length}`);
  }

  params.push(Math.min(Math.max(Number(limit) || 100, 1), 500));

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await query(
    `
      SELECT id, actor_user_id, actor_email, actor_role, action,
             target_type, target_id, details, ip_address, user_agent, created_at
      FROM audit_log
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length}
    `,
    params
  );

  return result.rows.map((row) => ({
    id: row.id,
    actor: {
      userId: row.actor_user_id,
      email: row.actor_email,
      role: row.actor_role
    },
    action: row.action,
    target: row.target_type ? { type: row.target_type, id: row.target_id } : null,
    details: row.details,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    createdAt: row.created_at
  }));
}
