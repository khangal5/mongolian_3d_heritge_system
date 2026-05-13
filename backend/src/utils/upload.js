import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import multer from "multer";

export async function createUploadHandler({
  destinationDir,
  mimeWhitelist = null,
  extensionWhitelist = null,
  maxFiles,
  maxFileSizeBytes,
  errorMessage,
  defaultExtension
}) {
  await mkdir(destinationDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (_req, _file, callback) => {
      callback(null, destinationDir);
    },
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname) || defaultExtension;
      callback(null, `${Date.now()}-${randomUUID()}${extension}`);
    }
  });

  return multer({
    storage,
    limits: {
      files: maxFiles,
      fileSize: maxFileSizeBytes
    },
    fileFilter: (_req, file, callback) => {
      if (mimeWhitelist && !mimeWhitelist.has(file.mimetype)) {
        const error = new Error(errorMessage);
        error.statusCode = 400;
        callback(error);
        return;
      }
      if (extensionWhitelist) {
        const extension = path.extname(file.originalname).toLowerCase();
        if (!extensionWhitelist.has(extension)) {
          const error = new Error(errorMessage);
          error.statusCode = 400;
          callback(error);
          return;
        }
      }
      callback(null, true);
    }
  });
}
