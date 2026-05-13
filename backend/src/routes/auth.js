import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { Router } from "express";
import multer from "multer";
import { config } from "../config/env.js";
import {
  consumeEmailVerification,
  createEmailVerification,
  createSession,
  createUser,
  deletePendingVerificationsForUser,
  deleteSessionByTokenHash,
  findEmailVerificationByTokenHash,
  findUserByEmail,
  findUserById,
  listResearchersWithVerifications,
  setUserVerificationStatus
} from "../repositories/authRepository.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  isWhitelistedEmail,
  sendVerificationEmail,
  whitelistDescription
} from "../utils/email.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { generateToken, hashToken } from "../utils/tokens.js";

const router = Router();
const proofDir = path.join(config.uploadDir, "researcher-proofs");

await mkdir(proofDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, proofDir);
  },
  filename: (_req, file, callback) => {
    callback(null, `${Date.now()}-${randomUUID()}${path.extname(file.originalname) || ".jpg"}`);
  }
});

const ALLOWED_PROOF_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/pdf"
]);

const upload = multer({
  storage,
  limits: {
    files: 1,
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_PROOF_MIME_TYPES.has(file.mimetype)) {
      const error = new Error(
        "Зөвхөн JPG, PNG зураг эсвэл PDF файл хавсаргах боломжтой"
      );
      error.statusCode = 400;
      callback(error);
      return;
    }
    callback(null, true);
  }
});

const VERIFICATION_TTL_MS = 1000 * 60 * 60 * 24;

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

router.post("/register-researcher", upload.single("proofImage"), async (req, res, next) => {
  try {
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

    if (!fullName || !email || !password || !organization || !positionTitle) {
      return res.status(400).json({
        message: "Овог нэр, имэйл, байгууллага, албан тушаал, нууц үг шаардлагатай"
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    if (!isWhitelistedEmail(normalizedEmail)) {
      return res.status(400).json({
        message: `Зөвхөн ${whitelistDescription()} төгсгөлтэй албан имэйл хэрэглэх боломжтой`
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Байгууллагын үнэмлэх эсвэл баталгаажуулах баримтын зураг шаардлагатай"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Нууц үг хамгийн багадаа 8 тэмдэгт байна" });
    }

    const existingUser = await findUserByEmail(normalizedEmail);

    if (existingUser) {
      return res.status(409).json({ message: "Энэ имэйлтэй хэрэглэгч бүртгэлтэй байна" });
    }

    const user = await createUser({
      id: randomUUID(),
      fullName: fullName.trim(),
      email: normalizedEmail,
      institutionEmail: normalizedEmail,
      passwordHash: hashPassword(password),
      role: "researcher",
      organization: organization.trim(),
      departmentName: departmentName?.trim() || null,
      positionTitle: positionTitle.trim(),
      phoneNumber: phoneNumber?.trim() || null,
      employeeCode: employeeCode?.trim() || null,
      researchFocus: researchFocus?.trim() || null,
      verificationDocumentName: req.file.originalname,
      verificationDocumentUrl: `/uploads/researcher-proofs/${req.file.filename}`,
      verificationStatus: "submitted"
    });

    const verification = await issueVerification(user);

    return res.status(201).json({
      message:
        "Бүртгэл амжилттай үүслээ. Албан имэйлд илгээсэн баталгаажуулах холбоосыг дарж, имэйлээ баталгаажуулна уу.",
      user,
      verification: {
        delivered: verification.delivered,
        ...(verification.delivered === "console" ? { devLink: verification.link } : {}),
        ...(verification.delivered === "ethereal"
          ? { previewUrl: verification.previewUrl }
          : {})
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Имэйл болон нууц үг шаардлагатай" });
    }

    const userRow = await findUserByEmail(email);

    if (!userRow || !verifyPassword(password, userRow.password_hash)) {
      return res.status(401).json({ message: "Имэйл эсвэл нууц үг буруу байна" });
    }

    const token = generateToken();

    await createSession({
      id: randomUUID(),
      userId: userRow.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString()
    });

    return res.json({
      token,
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
  } catch (error) {
    return next(error);
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.post("/logout", requireAuth, async (req, res, next) => {
  try {
    const token = req.headers.authorization?.slice("Bearer ".length).trim();

    if (token) {
      await deleteSessionByTokenHash(hashToken(token));
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

router.post("/verify-email", async (req, res, next) => {
  try {
    const token = req.body?.token;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ message: "Баталгаажуулах токен шаардлагатай" });
    }

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
  } catch (error) {
    return next(error);
  }
});

router.post("/resend-verification", requireAuth, async (req, res, next) => {
  try {
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
      verification: {
        delivered: verification.delivered,
        ...(verification.delivered === "console" ? { devLink: verification.link } : {}),
        ...(verification.delivered === "ethereal"
          ? { previewUrl: verification.previewUrl }
          : {})
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/admin/researchers", requireRole("admin"), async (_req, res, next) => {
  try {
    const items = await listResearchersWithVerifications();
    res.json({ items, total: items.length });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/admin/researchers/:id/verify",
  requireRole("admin"),
  async (req, res, next) => {
    try {
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
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  "/admin/researchers/:id/revoke",
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const target = await findUserById(req.params.id);
      if (!target) {
        return res.status(404).json({ message: "Хэрэглэгч олдсонгүй" });
      }
      await setUserVerificationStatus(target.id, "submitted");
      await deletePendingVerificationsForUser(target.id);
      return res.json({ message: "Баталгаажуулалтыг хүчингүй болголоо" });
    } catch (error) {
      return next(error);
    }
  }
);

export default router;