import path from "node:path";
import { mkdir, unlink } from "node:fs/promises";
import sharp from "sharp";
import { logger } from "./logger.js";

const imageLogger = logger.child({ module: "image-processor" });

const SUPPORTED_MIMES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

const DEFAULT_VARIANTS = [
  { name: "thumb", width: 320, height: 320, fit: "cover" },
  { name: "medium", width: 1024, height: 1024, fit: "inside" },
  { name: "large", width: 1920, height: 1920, fit: "inside" }
];

export function isProcessableImage(mimeType) {
  return SUPPORTED_MIMES.has(mimeType);
}

export async function generateImageVariants(filePath, { variants = DEFAULT_VARIANTS } = {}) {
  const directory = path.dirname(filePath);
  const baseName = path.basename(filePath, path.extname(filePath));
  const variantsDir = path.join(directory, "variants");
  await mkdir(variantsDir, { recursive: true });

  const output = {};

  for (const variant of variants) {
    const outName = `${baseName}-${variant.name}.webp`;
    const outPath = path.join(variantsDir, outName);
    try {
      await sharp(filePath)
        .rotate()
        .resize({
          width: variant.width,
          height: variant.height,
          fit: variant.fit,
          withoutEnlargement: true
        })
        .webp({ quality: 82 })
        .toFile(outPath);

      output[variant.name] = {
        path: outPath,
        publicSuffix: path.posix.join("variants", outName),
        width: variant.width,
        height: variant.height
      };
    } catch (error) {
      imageLogger.warn({ err: error, variant: variant.name, filePath }, "Variant үүсгэх амжилтгүй");
    }
  }

  return output;
}

export async function tryDeleteVariants(originalFilePath) {
  const directory = path.dirname(originalFilePath);
  const baseName = path.basename(originalFilePath, path.extname(originalFilePath));
  const variantsDir = path.join(directory, "variants");

  for (const variant of DEFAULT_VARIANTS) {
    const outPath = path.join(variantsDir, `${baseName}-${variant.name}.webp`);
    await unlink(outPath).catch(() => {});
  }
}
