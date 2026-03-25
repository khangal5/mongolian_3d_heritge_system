import { query } from "../db/pool.js";

function mapUser(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    institutionEmail: row.institution_email,
    role: row.role,
    organization: row.organization,
    departmentName: row.department_name,
    positionTitle: row.position_title,
    phoneNumber: row.phone_number,
    employeeCode: row.employee_code,
    researchFocus: row.research_focus,
    verificationDocumentName: row.verification_document_name,
    verificationDocumentUrl: row.verification_document_url,
    verificationStatus: row.verification_status,
    status: row.status,
    createdAt: row.created_at
  };
}

export async function createUser(user) {
  const result = await query(
    `
      INSERT INTO users (
        id,
        full_name,
        email,
        institution_email,
        password_hash,
        role,
        organization,
        department_name,
        position_title,
        phone_number,
        employee_code,
        research_focus,
        verification_document_name,
        verification_document_url,
        verification_status,
        status
      )
      VALUES (
        $1, $2, LOWER($3), LOWER($4), $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, 'active'
      )
      RETURNING *
    `,
    [
      user.id,
      user.fullName,
      user.email,
      user.institutionEmail || user.email,
      user.passwordHash,
      user.role,
      user.organization || null,
      user.departmentName || null,
      user.positionTitle || null,
      user.phoneNumber || null,
      user.employeeCode || null,
      user.researchFocus || null,
      user.verificationDocumentName || null,
      user.verificationDocumentUrl || null,
      user.verificationStatus || "submitted"
    ]
  );

  return mapUser(result.rows[0]);
}

export async function findUserByEmail(email) {
  const result = await query(
    `
      SELECT *
      FROM users
      WHERE email = LOWER($1)
      LIMIT 1
    `,
    [email]
  );

  return result.rows[0] || null;
}

export async function findUserById(id) {
  const result = await query(
    `
      SELECT *
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );

  if (!result.rowCount) {
    return null;
  }

  return mapUser(result.rows[0]);
}

export async function createSession(session) {
  await query(
    `
      INSERT INTO auth_sessions (id, user_id, token_hash, expires_at)
      VALUES ($1, $2, $3, $4)
    `,
    [session.id, session.userId, session.tokenHash, session.expiresAt]
  );
}

export async function findSessionWithUserByTokenHash(tokenHash) {
  const result = await query(
    `
      SELECT
        s.id AS session_id,
        s.user_id,
        s.expires_at,
        u.*
      FROM auth_sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1
      LIMIT 1
    `,
    [tokenHash]
  );

  return result.rows[0] || null;
}

export async function touchSession(sessionId) {
  await query(
    `
      UPDATE auth_sessions
      SET last_used_at = NOW()
      WHERE id = $1
    `,
    [sessionId]
  );
}

export async function deleteSessionByTokenHash(tokenHash) {
  await query(
    `
      DELETE FROM auth_sessions
      WHERE token_hash = $1
    `,
    [tokenHash]
  );
}
