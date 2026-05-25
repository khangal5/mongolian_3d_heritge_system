import sharp from "sharp";

const MIN_MEGAPIXELS = 4;
const BLUR_VARIANCE_THRESHOLD = 80;
const DARK_BRIGHTNESS_THRESHOLD = 55;
const BRIGHT_BRIGHTNESS_THRESHOLD = 220;

async function laplacianVariance(filePath) {
  const buffer = await sharp(filePath)
    .resize({ width: 800, withoutEnlargement: true })
    .greyscale()
    .convolve({
      width: 3,
      height: 3,
      kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0]
    })
    .raw()
    .toBuffer();

  let sum = 0;
  let sumSq = 0;

  for (let i = 0; i < buffer.length; i++) {
    const v = buffer[i];
    sum += v;
    sumSq += v * v;
  }

  const mean = sum / buffer.length;
  return sumSq / buffer.length - mean * mean;
}

export async function analyzeImage(image) {
  try {
    const meta = await sharp(image.filePath).metadata();
    const stats = await sharp(image.filePath).stats();
    const blurScore = await laplacianVariance(image.filePath);

    const width = meta.width || 0;
    const height = meta.height || 0;
    const megapixels = (width * height) / 1e6;
    const brightness =
      stats.channels?.length === 3
        ? (stats.channels[0].mean + stats.channels[1].mean + stats.channels[2].mean) / 3
        : stats.channels?.[0]?.mean || 0;

    const issues = [];

    if (megapixels < MIN_MEGAPIXELS) {
      issues.push(`Resolution бага (${megapixels.toFixed(1)}MP, санал болгох ≥ ${MIN_MEGAPIXELS}MP)`);
    }
    if (blurScore < BLUR_VARIANCE_THRESHOLD) {
      issues.push(`Blur их (${blurScore.toFixed(0)}, тогтворгүй фокус)`);
    }
    if (brightness < DARK_BRIGHTNESS_THRESHOLD) {
      issues.push(`Хэт харанхуй (brightness ${brightness.toFixed(0)})`);
    }
    if (brightness > BRIGHT_BRIGHTNESS_THRESHOLD) {
      issues.push(`Хэт цайвар / overexposed (brightness ${brightness.toFixed(0)})`);
    }

    return {
      id: image.id,
      name: image.originalName,
      width,
      height,
      megapixels: Number(megapixels.toFixed(1)),
      brightness: Number(brightness.toFixed(0)),
      blurScore: Number(blurScore.toFixed(0)),
      issues,
      ok: issues.length === 0
    };
  } catch (error) {
    return {
      id: image.id,
      name: image.originalName,
      ok: false,
      issues: [`Уншигдсангүй: ${error.message}`]
    };
  }
}

async function analyzeInBatches(images, batchSize = 5) {
  const results = [];
  for (let i = 0; i < images.length; i += batchSize) {
    const batch = images.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(analyzeImage));
    results.push(...batchResults);
  }
  return results;
}

export async function analyzePhotoSet(images) {
  const results = await analyzeInBatches(images, 5);

  const total = results.length;
  const okCount = results.filter((r) => r.ok).length;
  const blurry = results.filter((r) => r.issues?.some((m) => m.startsWith("Blur"))).length;
  const dark = results.filter((r) => r.issues?.some((m) => m.startsWith("Хэт харанхуй"))).length;
  const overexposed = results.filter((r) =>
    r.issues?.some((m) => m.startsWith("Хэт цайвар"))
  ).length;
  const lowRes = results.filter((r) =>
    r.issues?.some((m) => m.startsWith("Resolution"))
  ).length;
  const unread = results.filter((r) => r.issues?.some((m) => m.startsWith("Уншигдсангүй"))).length;

  const validResults = results.filter((r) => r.megapixels);
  const avgMegapixels = validResults.length
    ? validResults.reduce((a, r) => a + r.megapixels, 0) / validResults.length
    : 0;
  const avgBrightness = validResults.length
    ? validResults.reduce((a, r) => a + r.brightness, 0) / validResults.length
    : 0;

  return {
    total,
    okCount,
    issues: { blurry, dark, overexposed, lowRes, unread },
    avgMegapixels: Number(avgMegapixels.toFixed(1)),
    avgBrightness: Number(avgBrightness.toFixed(0)),
    perImage: results
  };
}

export function summarizeReport(report, recommendedCount = 30) {
  const { total, okCount, issues, avgMegapixels } = report;
  const lines = [];

  if (total < recommendedCount) {
    lines.push(`Зургийн тоо ${total} (санал болгох ≥ ${recommendedCount})`);
  } else {
    lines.push(`Зургийн тоо ${total} ✓`);
  }
  lines.push(`Дундаж resolution ${avgMegapixels}MP`);
  if (issues.blurry) lines.push(`${issues.blurry} зураг blur их`);
  if (issues.dark) lines.push(`${issues.dark} зураг хэт харанхуй`);
  if (issues.overexposed) lines.push(`${issues.overexposed} зураг overexposed`);
  if (issues.lowRes) lines.push(`${issues.lowRes} зураг resolution бага`);
  if (issues.unread) lines.push(`${issues.unread} зургийг уншиж чадсангүй`);
  lines.push(`${okCount}/${total} зураг шаардлага хангалаа`);

  return lines.join(". ");
}

export function estimateQualityFromReport(report, recommendedCount = 30) {
  const { total, okCount } = report;
  const ratio = total ? okCount / total : 0;

  if (total >= recommendedCount && ratio >= 0.85) return "өндөр";
  if (total >= 16 && ratio >= 0.6) return "дунд";
  return "бага";
}
