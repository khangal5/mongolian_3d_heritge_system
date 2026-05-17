import { randomUUID } from "node:crypto";
import path from "node:path";
import { Router } from "express";
import { config } from "../config/env.js";
import {
  consumeEmailVerification,
  consumePasswordResetToken,
  createEmailVerification,
  createPasswordResetToken,
  createSession,
  createUser,
  deleteAllSessionsForUser,
  deletePendingPasswordResets,
  deletePendingVerificationsForUser,
  deleteSessionByTokenHash,
  findEmailVerificationByTokenHash,
  findPasswordResetTokenByHash,
  findUserByEmail,
  findUserById,
  listResearchersWithVerifications,
  setUserVerificationStatus,
  updateUserPassword
} from "../repositories/authRepository.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  forgotPasswordSchema,
  loginSchema,
  registerResearcherSchema,
  resetPasswordSchema,
  verifyEmailSchema
} from "../schemas/auth.js";
import {
  isWhitelistedEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
  whitelistDescription
} from "../utils/email.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { generateToken, hashToken } from "../utils/tokens.js";
import { createUploadHandler } from "../utils/upload.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { clearAuthCookie, setAuthCookie } from "../utils/cookies.js";

const router = Router();

const upload = await createUploadHandler({
  destinationDir: path.join(config.uploadDir, "researcher-proofs"),
  mimeWhitelist: new Set(["image/jpeg", "image/jpg", "image/png", "application/pdf"]),
  maxFiles: 1,
  maxFileSizeBytes: 10 * 1024 * 1024,
  errorMessage: "Зөвхөн JPG, PNG зураг эсвэл PDF файл хавсаргах боломжтой",
  defaultExtension: ".jpg"
});

const VERIFICATION_TTL_MS = 1000 * 60 * 60 * 24;

function presentVerification(verification) {
  const payload = { delivered: verification.delivered };
  if (verification.delivered === "console") {
    payload.devLink = verification.link;
  }
  if (verification.delivered === "ethereal") {
    payload.previewUrl = verification.previewUrl;
  }
  return payload;
}

async function issueVerification(user) {
  await deletePendingVerificationsForUser(user.id);
  const token = generateToken();
  const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS).toISOString();

  await createEmailVerification({
    id: randomUUID(),
    userId: user.id,
    tokenHash: hashToken(token),
    email: user.email,
    expiresAt
  });

  const sendResult = await sendVerificationEmail({
    to: user.email,
    fullName: user.fullName,
    token
  });

  return sendResult;
}

router.post(
  "/register-researcher",
  upload.single("proofImage"),
  validate({ body: registerResearcherSchema }),
  asyncHandler(async (req, res) => {
    const {
      fullName,
      email,
      password,
      organization,
      departmentName,
      positionTitle,
      phoneNumber,
      employeeCode,
      researchFocus
    } = req.body;

    if (!isWhitelistedEmail(email)) {
      return res.status(400).json({
        message: `Зөвхөн ${whitelistDescription()} төгсгөлтэй албан имэйл хэрэглэх боломжтой`
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Байгууллагын үнэмлэх эсвэл баталгаажуулах баримтын зураг шаардлагатай"
      });
    }

    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return res.status(409).json({ message: "Энэ имэйлтэй хэрэглэгч бүртгэлтэй байна" });
    }

    const user = await createUser({
      id: randomUUID(),
      fullName,
      email,
      institutionEmail: email,
      passwordHash: hashPassword(password),
      role: "researcher",
      organization,
      departmentName: departmentName || null,
      positionTitle,
      phoneNumber: phoneNumber || null,
      employeeCode: employeeCode || null,
      researchFocus: researchFocus || null,
      verificationDocumentName: req.file.originalname,
      verificationDocumentUrl: `/uploads/researcher-proofs/${req.file.filename}`,
      verificationStatus: "submitted"
    });

    const verification = await issueVerification(user);

    return res.status(201).json({
      message:
        "Бүртгэл амжилттай үүслээ. Албан имэйлд илгээсэн баталгаажуулах холбоосыг дарж, имэйлээ баталгаажуулна уу.",
      user,
      verification: presentVerification(verification)
    });
  })
);

router.post(
  "/login",
  validate({ body: loginSchema }),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const userRow = await findUserByEmail(email);

    if (!userRow || !verifyPassword(password, userRow.password_hash)) {
      return res.status(401).json({ message: "Имэйл эсвэл нууц үг буруу байна" });
    }

    const token = generateToken();
    const SESSION_TTL_MS = 1000 * 60 * 60 * 24;

    await createSession({
      id: randomUUID(),
      userId: userRow.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString()
    });

    setAuthCookie(res, token);

    return res.json({
      user: {
        id: userRow.id,
        fullName: userRow.full_name,
        email: userRow.email,
        institutionEmail: userRow.institution_email,
        role: userRow.role,
        organization: userRow.organization,
        departmentName: userRow.department_name,
        positionTitle: userRow.position_title,
        phoneNumber: userRow.phone_number,
        employeeCode: userRow.employee_code,
        researchFocus: userRow.research_focus,
        verificationDocumentName: userRow.verification_document_name,
        verificationDocumentUrl: userRow.verification_document_url,
        verificationStatus: userRow.verification_status,
        status: userRow.status
      }
    });
  })
);

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.post("/logout", requireAuth, asyncHandler(async (req, res) => {
    const cookieToken = req.cookies?.heritage_session;
    const headerToken = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice("Bearer ".length).trim()
      : null;
    const token = cookieToken || headerToken;

    if (token) {
      await deleteSessionByTokenHash(hashToken(token));
    }

    clearAuthCookie(res);

    return res.status(204).send();
}));

const PASSWORD_RESET_TTL_MS = 1000 * 60 * 60;

router.post(
  "/forgot-password",
  validate({ body: forgotPasswordSchema }),
  asyncHandler(async (req, res) => {
    const email = req.body.email;

    const genericResponse = {
      message: "Хэрэв энэ имэйлтэй бүртгэл олдвол нууц үг сэргээх холбоос илгээгдэнэ."
    };

    if (!email) {
      return res.json(genericResponse);
    }

    const userRow = await findUserByEmail(email);
    if (!userRow) {
      return res.json(genericResponse);
    }

    await deletePendingPasswordResets(userRow.id);

    const token = generateToken();
    await createPasswordResetToken({
      id: randomUUID(),
      userId: userRow.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS).toISOString()
    });

    const payload = { ...genericResponse };
    try {
      const sendResult = await sendPasswordResetEmail({
        to: userRow.email,
        fullName: userRow.full_name,
        token
      });
      if (sendResult.delivered === "console") {
        payload.devLink = sendResult.link;
      }
      if (sendResult.delivered === "ethereal") {
        payload.previewUrl = sendResult.previewUrl;
      }
    } catch (sendError) {
      console.error("[email] password reset илгээх алдаа:", sendError.message);
    }

    return res.json(payload);
  })
);

router.post(
  "/reset-password",
  validate({ body: resetPasswordSchema }),
  asyncHandler(async (req, res) => {
    const { token, password } = req.body;

    const record = await findPasswordResetTokenByHash(hashToken(token));

    if (!record) {
      return res.status(404).json({ message: "Холбоос буруу эсвэл ашиглагдсан" });
    }

    if (record.consumed_at) {
      return res.status(409).json({ message: "Энэ холбоосоор аль хэдийн нууц үг сэргээгдсэн" });
    }

    if (new Date(record.expires_at) < new Date()) {
      return res.status(410).json({ message: "Холбоосын хүчинтэй хугацаа дууссан" });
    }

    await updateUserPassword(record.user_id, hashPassword(password));
    await consumePasswordResetToken(record.id);
    await deleteAllSessionsForUser(record.user_id);

    return res.json({ message: "Нууц үг амжилттай сэргээгдлээ. Та шинэ нууц үгээрээ нэвтэрнэ үү." });
  })
);

router.post(
  "/verify-email",
  validate({ body: verifyEmailSchema }),
  asyncHandler(async (req, res) => {
    const { token } = req.body;

    const record = await findEmailVerificationByTokenHash(hashToken(token));

    if (!record) {
      return res.status(404).json({ message: "Баталгаажуулах холбоос буруу эсвэл ашиглагдсан" });
    }

    if (record.consumed_at) {
      return res.status(409).json({ message: "Энэ холбоосоор аль хэдийн баталгаажсан" });
    }

    if (new Date(record.expires_at) < new Date()) {
      return res.status(410).json({ message: "Баталгаажуулах холбоосын хүчинтэй хугацаа дууссан" });
    }

    await setUserVerificationStatus(record.user_id, "verified");
    await consumeEmailVerification(record.id);

    return res.json({
      message: "Имэйл амжилттай баталгаажлаа."
    });
  })
);

router.post("/resend-verification", requireAuth, asyncHandler(async (req, res) => {
    const userRow = await findUserById(req.user.id);

    if (!userRow) {
      return res.status(404).json({ message: "Хэрэглэгч олдсонгүй" });
    }

    if (userRow.verificationStatus === "verified") {
      return res.status(409).json({ message: "Имэйл аль хэдийн баталгаажсан" });
    }

    const verification = await issueVerification(userRow);

    return res.json({
      message: "Шинэ баталгаажуулах холбоос албан имэйл рүү илгээгдлээ",
      verification: presentVerification(verification)
    });
}));

router.get("/admin/researchers", requireRole("admin"), asyncHandler(async (_req, res) => {
  const items = await listResearchersWithVerifications();
  res.json({ items, total: items.length });
}));

router.post(
  "/admin/researchers/:id/verify",
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const target = await findUserById(req.params.id);
    if (!target) {
      return res.status(404).json({ message: "Хэрэглэгч олдсонгүй" });
    }
    if (target.verificationStatus === "verified") {
      return res.status(409).json({ message: "Аль хэдийн баталгаажсан" });
    }
    await setUserVerificationStatus(target.id, "verified");
    await deletePendingVerificationsForUser(target.id);
    return res.json({ message: "Хэрэглэгчийг гар аргаар баталгаажууллаа" });
  })
);

router.post(
  "/admin/researchers/:id/revoke",
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const target = await findUserById(req.params.id);
    if (!target) {
      return res.status(404).json({ message: "Хэрэглэгч олдсонгүй" });
    }
    await setUserVerificationStatus(target.id, "submitted");
    await deletePendingVerificationsForUser(target.id);
    return res.json({ message: "Баталгаажуулалтыг хүчингүй болголоо" });
  })
);

export default router;