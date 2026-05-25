import { randomUUID } from "node:crypto";
import path from "node:path";
import { Router } from "express";
import { config } from "../config/env.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { authController } from "../controllers/AuthController.js";
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

async function issueAndSendVerification(user) {
  const token = await authController.issueEmailVerification(user);
  return sendVerificationEmail({
    to: user.email,
    fullName: user.fullName || user.full_name,
    token
  });
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

    const existingUser = await authController.findUserByEmail(email);

    if (existingUser) {
      return res.status(409).json({ message: "Энэ имэйлтэй хэрэглэгч бүртгэлтэй байна" });
    }

    const user = await authController.createUser({
      id: randomUUID(),
      fullName,
      email,
      institutionEmail: email,
      passwordHash: undefined,
      password,
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

    const verification = await issueAndSendVerification(user);

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

    const userRow = await authController.verifyCredentials(email, password);

    if (!userRow) {
      return res.status(401).json({ message: "Имэйл эсвэл нууц үг буруу байна" });
    }

    const { token } = await authController.createSession(userRow.id);
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

  await authController.logout(token);
  clearAuthCookie(res);

  return res.status(204).send();
}));

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

    const result = await authController.requestPasswordReset(email);
    if (!result) {
      return res.json(genericResponse);
    }

    const payload = { ...genericResponse };
    try {
      const sendResult = await sendPasswordResetEmail({
        to: result.user.email,
        fullName: result.user.full_name,
        token: result.token
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
    const result = await authController.resetPassword(token, password);

    if (result.status === "not_found") {
      return res.status(404).json({ message: "Холбоос буруу эсвэл ашиглагдсан" });
    }
    if (result.status === "consumed") {
      return res.status(409).json({ message: "Энэ холбоосоор аль хэдийн нууц үг сэргээгдсэн" });
    }
    if (result.status === "expired") {
      return res.status(410).json({ message: "Холбоосын хүчинтэй хугацаа дууссан" });
    }

    return res.json({ message: "Нууц үг амжилттай сэргээгдлээ. Та шинэ нууц үгээрээ нэвтэрнэ үү." });
  })
);

router.post(
  "/verify-email",
  validate({ body: verifyEmailSchema }),
  asyncHandler(async (req, res) => {
    const { token } = req.body;
    const result = await authController.verifyEmail(token);

    if (result.status === "not_found") {
      return res.status(404).json({ message: "Баталгаажуулах холбоос буруу эсвэл ашиглагдсан" });
    }
    if (result.status === "consumed") {
      return res.status(409).json({ message: "Энэ холбоосоор аль хэдийн баталгаажсан" });
    }
    if (result.status === "expired") {
      return res.status(410).json({ message: "Баталгаажуулах холбоосын хүчинтэй хугацаа дууссан" });
    }

    return res.json({ message: "Имэйл амжилттай баталгаажлаа." });
  })
);

router.post("/resend-verification", requireAuth, asyncHandler(async (req, res) => {
  const userRow = await authController.findUserById(req.user.id);

  if (!userRow) {
    return res.status(404).json({ message: "Хэрэглэгч олдсонгүй" });
  }

  if (userRow.verificationStatus === "verified") {
    return res.status(409).json({ message: "Имэйл аль хэдийн баталгаажсан" });
  }

  const verification = await issueAndSendVerification(userRow);

  return res.json({
    message: "Шинэ баталгаажуулах холбоос албан имэйл рүү илгээгдлээ",
    verification: presentVerification(verification)
  });
}));

router.get("/admin/researchers", requireRole("admin"), asyncHandler(async (_req, res) => {
  const items = await authController.listResearchers();
  res.json({ items, total: items.length });
}));

router.post(
  "/admin/researchers/:id/verify",
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const target = await authController.findUserById(req.params.id);
    if (!target) {
      return res.status(404).json({ message: "Хэрэглэгч олдсонгүй" });
    }
    if (target.verificationStatus === "verified") {
      return res.status(409).json({ message: "Аль хэдийн баталгаажсан" });
    }
    await authController.setVerificationStatus(target.id, "verified");
    return res.json({ message: "Хэрэглэгчийг гар аргаар баталгаажууллаа" });
  })
);

router.post(
  "/admin/researchers/:id/revoke",
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const target = await authController.findUserById(req.params.id);
    if (!target) {
      return res.status(404).json({ message: "Хэрэглэгч олдсонгүй" });
    }
    await authController.setVerificationStatus(target.id, "submitted");
    return res.json({ message: "Баталгаажуулалтыг хүчингүй болголоо" });
  })
);

export default router;
