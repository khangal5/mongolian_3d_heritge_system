import { findSessionWithUserByTokenHash, touchSession } from "../repositories/authRepository.js";
import { hashToken } from "../utils/tokens.js";
import { AUTH_COOKIE_NAME } from "../utils/cookies.js";

function extractBearerToken(headerValue) {
  if (!headerValue || !headerValue.startsWith("Bearer ")) {
    return null;
  }

  return headerValue.slice("Bearer ".length).trim();
}

function extractToken(req) {
  const cookieToken = req.cookies?.[AUTH_COOKIE_NAME];
  if (cookieToken) {
    return cookieToken;
  }
  return extractBearerToken(req.headers.authorization);
}

export async function optionalAuth(req, _res, next) {
  try {
    const token = extractToken(req);

    if (!token) {
      req.user = null;
      return next();
    }

    const session = await findSessionWithUserByTokenHash(hashToken(token));

    if (!session) {
      req.user = null;
      return next();
    }

    if (new Date(session.expires_at) < new Date()) {
      req.user = null;
      return next();
    }

    await touchSession(session.session_id);
    req.user = {
      id: session.id,
      fullName: session.full_name,
      email: session.email,
      institutionEmail: session.institution_email,
      role: session.role,
      organization: session.organization,
      departmentName: session.department_name,
      positionTitle: session.position_title,
      phoneNumber: session.phone_number,
      employeeCode: session.employee_code,
      researchFocus: session.research_focus,
      verificationDocumentName: session.verification_document_name,
      verificationDocumentUrl: session.verification_document_url,
      verificationStatus: session.verification_status,
      status: session.status
    };

    return next();
  } catch (error) {
    return next(error);
  }
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Нэвтэрсэн хэрэглэгч шаардлагатай" });
  }

  return next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Нэвтэрсэн хэрэглэгч шаардлагатай" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Энэ үйлдэлд таны эрх хүрэхгүй байна" });
    }

    return next();
  };
}

export function requireVerifiedResearcher(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Нэвтэрсэн хэрэглэгч шаардлагатай" });
  }

  if (req.user.role === "admin") {
    return next();
  }

  if (req.user.role !== "researcher") {
    return res.status(403).json({ message: "Энэ үйлдэлд таны эрх хүрэхгүй байна" });
  }

  if (req.user.verificationStatus !== "verified") {
    return res.status(403).json({
      message:
        "Эхлээд албан имэйл рүү илгээсэн холбоосыг дарж имэйлээ баталгаажуулна уу"
    });
  }

  return next();
}
