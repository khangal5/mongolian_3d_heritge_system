import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { Router } from "express";
import multer from "multer";
import { config } from "../config/env.js";
import {
  createSession,
  createUser,
  deleteSessionByTokenHash,
  findUserByEmail
} from "../repositories/authRepository.js";
import { requireAuth } from "../middleware/auth.js";
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

const upload = multer({
  storage,
  limits: {
    files: 1,
    fileSize: 10 * 1024 * 1024
  }
});

router.post("/register-researcher", upload.single("proofImage"), async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      institutionEmail,
      password,
      organization,
      departmentName,
      positionTitle,
      phoneNumber,
      employeeCode,
      researchFocus
    } = req.body;

    if (!fullName || !email || !institutionEmail || !password || !organization || !positionTitle) {
      return res.status(400).json({
        message: "Овог нэр, имэйл, байгууллагын имэйл, байгууллага, албан тушаал, нууц үг шаардлагатай"
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

    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return res.status(409).json({ message: "Энэ имэйлтэй хэрэглэгч бүртгэлтэй байна" });
    }

    const user = await createUser({
      id: randomUUID(),
      fullName: fullName.trim(),
      email: email.trim(),
      institutionEmail: institutionEmail.trim(),
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

    return res.status(201).json({
      message: "Бүртгэл амжилттай үүслээ. Таны судлаачийн мэдээлэл баталгаажуулах баримттай хамт хадгалагдлаа.",
      user
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

export default router;
