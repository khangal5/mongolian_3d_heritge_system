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

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function registerFailedLogin(userId) {
  const result = await query(
    `
      UPDATE users
      SET
        failed_login_count = failed_login_count + 1,
        locked_until = CASE
          WHEN failed_login_count + 1 >= $2 THEN NOW() + ($3 || ' minutes')::INTERVAL
          ELSE locked_until
        END,
        updated_at = NOW()
      WHERE id = $1
      RETURNING failed_login_count, locked_until
    `,
    [userId, MAX_FAILED_ATTEMPTS, String(LOCKOUT_MINUTES)]
  );

  return result.rows[0] || null;
}

export async function resetFailedLoginCount(userId) {
  await query(
    `
      UPDATE users
      SET failed_login_count = 0, locked_until = NULL, updated_at = NOW()
      WHERE id = $1
    `,
    [userId]
  );
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
      INSERT INTO auth_sessions (id, user_id, token_hash, expires_at, remember_me)
      VALUES ($1, $2, $3, $4, $5)
    `,
    [session.id, session.userId, session.tokenHash, session.expiresAt, Boolean(session.rememberMe)]
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
      SET
        last_used_at = NOW(),
        expires_at = CASE
          WHEN remember_me THEN LEAST(NOW() + INTERVAL '7 days', created_at + INTERVAL '30 days')
          ELSE LEAST(NOW() + INTERVAL '2 hours', created_at + INTERVAL '24 hours')
        END
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

export async function createEmailVerification({ id, userId, tokenHash, email, expiresAt }) {
  await query(
    `
      INSERT INTO email_verifications (id, user_id, token_hash, email, expires_at)
      VALUES ($1, $2, $3, LOWER($4), $5)
    `,
    [id, userId, tokenHash, email, expiresAt]
  );
}

export async function findEmailVerificationByTokenHash(tokenHash) {
  const result = await query(
    `
      SELECT *
      FROM email_verifications
      WHERE token_hash = $1
      LIMIT 1
    `,
    [tokenHash]
  );

  return result.rows[0] || null;
}

export async function consumeEmailVerification(id) {
  await query(
    `
      UPDATE email_verifications
      SET consumed_at = NOW()
      WHERE id = $1
    `,
    [id]
  );
}

export async function deletePendingVerificationsForUser(userId) {
  await query(
    `
      DELETE FROM email_verifications
      WHERE user_id = $1 AND consumed_at IS NULL
    `,
    [userId]
  );
}

export async function createPasswordResetToken({ id, userId, tokenHash, expiresAt }) {
  await query(
    `
      INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at)
      VALUES ($1, $2, $3, $4)
    `,
    [id, userId, tokenHash, expiresAt]
  );
}

export async function findPasswordResetTokenByHash(tokenHash) {
  const result = await query(
    `
      SELECT *
      FROM password_reset_tokens
      WHERE token_hash = $1
      LIMIT 1
    `,
    [tokenHash]
  );

  return result.rows[0] || null;
}

export async function consumePasswordResetToken(tokenId) {
  await query(
    `
      UPDATE password_reset_tokens
      SET consumed_at = NOW()
      WHERE id = $1
    `,
    [tokenId]
  );
}

export async function deletePendingPasswordResets(userId) {
  await query(
    `
      DELETE FROM password_reset_tokens
      WHERE user_id = $1 AND consumed_at IS NULL
    `,
    [userId]
  );
}

export async function updateUserPassword(userId, passwordHash) {
  await query(
    `
      UPDATE users
      SET
        password_hash = $2,
        failed_login_count = 0,
        locked_until = NULL,
        updated_at = NOW()
      WHERE id = $1
    `,
    [userId, passwordHash]
  );
}

export async function deleteAllSessionsForUser(userId) {
  await query(
    `
      DELETE FROM auth_sessions
      WHERE user_id = $1
    `,
    [userId]
  );
}

export async function setUserVerificationStatus(userId, status) {
  await query(
    `
      UPDATE users
      SET verification_status = $2,
          updated_at = NOW()
      WHERE id = $1
    `,
    [userId, status]
  );
}

export async function listResearchersWithVerifications() {
  const result = await query(
    `
      SELECT
        u.id,
        u.full_name,
        u.email,
        u.institution_email,
        u.role,
        u.organization,
        u.department_name,
        u.position_title,
        u.phone_number,
        u.employee_code,
        u.research_focus,
        u.verification_document_name,
        u.verification_document_url,
        u.verification_status,
        u.status,
        u.created_at,
        u.updated_at,
        (
          SELECT json_agg(
            json_build_object(
              'id', ev.id,
              'email', ev.email,
              'createdAt', ev.created_at,
              'expiresAt', ev.expires_at,
              'consumedAt', ev.consumed_at
            )
            ORDER BY ev.created_at DESC
          )
          FROM email_verifications ev
          WHERE ev.user_id = u.id
        ) AS verifications
      FROM users u
      WHERE u.role = 'researcher'
      ORDER BY
        CASE u.verification_status WHEN 'submitted' THEN 0 ELSE 1 END,
        u.created_at DESC
    `
  );

  return result.rows.map((row) => ({
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    verifications: row.verifications || []
  }));
}
