import { config } from "../config/env.js";

export function isWhitelistedEmail(email) {
  if (config.emailDomainBypass) {
    return true;
  }
  if (!email || typeof email !== "string") {
    return false;
  }
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) {
    return false;
  }
  return config.emailDomainWhitelist.some(
    (allowed) => domain === allowed || domain.endsWith(`.${allowed}`)
  );
}

export function whitelistDescription() {
  return config.emailDomainWhitelist
    .map((domain) => `*.${domain}`)
    .join(", ");
}

let etherealTransport = null;
let etherealAccount = null;

async function loadNodemailer() {
  const nodemailer = await import("nodemailer").catch(() => null);
  if (!nodemailer) {
    throw new Error(
      "nodemailer суулгагдаагүй байна. SMTP идэвхжүүлэхдээ npm i nodemailer хийнэ үү"
    );
  }
  return nodemailer.default;
}

async function sendViaResend({ to, subject, text, html }) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: config.emailFrom,
      to: [to],
      subject,
      text,
      html
    })
  });

  if (!response.ok) {
    let detail = "";
    try {
      const data = await response.json();
      detail = data?.message || JSON.stringify(data);
    } catch {
      detail = await response.text();
    }
    throw new Error(`Resend API алдаа (${response.status}): ${detail}`);
  }

  return response.json();
}

async function sendViaSmtp({ to, subject, text, html }) {
  const nodemailer = await loadNodemailer();

  const transport = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    auth:
      config.smtpUser && config.smtpPassword
        ? { user: config.smtpUser, pass: config.smtpPassword }
        : undefined
  });

  await transport.sendMail({
    from: config.smtpFrom,
    to,
    subject,
    text,
    html
  });
}

async function sendViaEthereal({ to, subject, text, html }) {
  const nodemailer = await loadNodemailer();

  if (!etherealTransport) {
    etherealAccount = await nodemailer.createTestAccount();
    etherealTransport = nodemailer.createTransport({
      host: etherealAccount.smtp.host,
      port: etherealAccount.smtp.port,
      secure: etherealAccount.smtp.secure,
      auth: { user: etherealAccount.user, pass: etherealAccount.pass }
    });
    console.log(`[email] Ethereal test account: ${etherealAccount.user}`);
  }

  const info = await etherealTransport.sendMail({
    from: config.smtpFrom,
    to,
    subject,
    text,
    html
  });

  return nodemailer.getTestMessageUrl(info);
}

async function dispatchEmail({ to, subject, text, html, link, label }) {
  if (config.resendApiKey) {
    await sendViaResend({ to, subject, text, html });
    console.log(`[email] Resend → ${to} (${label})`);
    return { delivered: "resend", link };
  }

  if (config.smtpHost) {
    await sendViaSmtp({ to, subject, text, html });
    console.log(`[email] SMTP → ${to} (${label})`);
    return { delivered: "smtp", link };
  }

  if (config.emailUseEthereal) {
    const previewUrl = await sendViaEthereal({ to, subject, text, html });
    console.log(`[email] Ethereal preview: ${previewUrl}`);
    return { delivered: "ethereal", link, previewUrl };
  }

  console.log(`[email] dev console → ${to}: ${link}`);
  return { delivered: "console", link };
}

export async function sendVerificationEmail({ to, fullName, token }) {
  const link = `${config.publicAppUrl}/verify-email?token=${encodeURIComponent(token)}`;
  const subject = "Имэйл баталгаажуулах — Монголын 3D өвийн сан";
  const text = `Сайн байна уу, ${fullName}!\n\nДараах холбоосоор имэйлээ баталгаажуулна уу:\n${link}\n\nЭнэ холбоос 24 цагийн дараа хүчингүй болно.`;
  const html = `
    <p>Сайн байна уу, <strong>${fullName}</strong>!</p>
    <p>Дараах товчоор имэйлээ баталгаажуулна уу:</p>
    <p><a href="${link}" style="background:#2b1b13;color:#fff8ec;padding:10px 18px;border-radius:999px;text-decoration:none;">Имэйл баталгаажуулах</a></p>
    <p>Эсвэл линкийг хуулж нээнэ үү:<br/><a href="${link}">${link}</a></p>
    <p style="color:#6b6258;font-size:0.9em;">Энэ холбоос 24 цагийн дараа хүчингүй болно.</p>
  `;

  return dispatchEmail({ to, subject, text, html, link, label: "verification" });
}

export async function sendPasswordResetEmail({ to, fullName, token }) {
  const link = `${config.publicAppUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const subject = "Нууц үг сэргээх — Монголын 3D өвийн сан";
  const text = `Сайн байна уу, ${fullName || ""}!\n\nТаны бүртгэлийн нууц үгийг сэргээх хүсэлт ирлээ. Дараах холбоосоор шинэ нууц үгээ тохируулна уу:\n${link}\n\nЭнэ холбоос 1 цагийн дараа хүчингүй болно. Хэрэв та энэ хүсэлтийг хийгээгүй бол энэ имэйлийг үл хэрэгсээрэй.`;
  const html = `
    <p>Сайн байна уу, <strong>${fullName || ""}</strong>!</p>
    <p>Таны бүртгэлийн нууц үгийг сэргээх хүсэлт ирлээ. Дараах товчоор шинэ нууц үгээ тохируулна уу:</p>
    <p><a href="${link}" style="background:#2b1b13;color:#fff8ec;padding:10px 18px;border-radius:999px;text-decoration:none;">Шинэ нууц үг тохируулах</a></p>
    <p>Эсвэл линкийг хуулж нээнэ үү:<br/><a href="${link}">${link}</a></p>
    <p style="color:#6b6258;font-size:0.9em;">Энэ холбоос 1 цагийн дараа хүчингүй болно. Хэрэв та энэ хүсэлтийг хийгээгүй бол энэ имэйлийг үл хэрэгсээрэй.</p>
  `;

  return dispatchEmail({ to, subject, text, html, link, label: "password-reset" });
}