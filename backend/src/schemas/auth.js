import { z } from "zod";

const emailField = z
  .string({ message: "Имэйл шаардлагатай" })
  .trim()
  .toLowerCase()
  .email("Имэйл буруу форматтай байна");

const passwordField = z
  .string({ message: "Нууц үг шаардлагатай" })
  .min(8, "Нууц үг хамгийн багадаа 8 тэмдэгт байна")
  .max(128, "Нууц үг хэт урт байна");

const trimmedString = (max) =>
  z.string().trim().min(1).max(max);

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Нууц үг шаардлагатай"),
  rememberMe: z.boolean().optional()
});

export const registerResearcherSchema = z.object({
  fullName: trimmedString(120),
  email: emailField,
  password: passwordField,
  organization: trimmedString(200),
  departmentName: trimmedString(200).optional().or(z.literal("")),
  positionTitle: trimmedString(120),
  phoneNumber: trimmedString(40).optional().or(z.literal("")),
  employeeCode: trimmedString(60).optional().or(z.literal("")),
  researchFocus: trimmedString(500).optional().or(z.literal(""))
});

export const verifyEmailSchema = z.object({
  token: z.string().min(10, "Токен буруу")
});

export const forgotPasswordSchema = z.object({
  email: emailField.or(z.literal(""))
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, "Токен буруу"),
  password: passwordField
});
