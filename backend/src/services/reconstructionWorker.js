import { reconstructionJobRepository } from "../data/ReconstructionJobRepository.js";
import {
  analyzePhotoSet,
  estimateQualityFromReport,
  summarizeReport
} from "../utils/imageQuality.js";

const getReconstructionJobById = (id) => reconstructionJobRepository.findById(id);
const updateReconstructionJob = (id, patch) =>
  reconstructionJobRepository.updateStatus(id, patch.status, patch);

const activeJobs = new Set();

function appendLog(log, entry) {
  return [...(log || []), { createdAt: new Date().toISOString(), ...entry }];
}

export async function enqueueReconstruction(jobId) {
  if (activeJobs.has(jobId)) {
    return;
  }

  activeJobs.add(jobId);

  try {
    const current = await getReconstructionJobById(jobId);

    if (!current) {
      activeJobs.delete(jobId);
      return;
    }

    await updateReconstructionJob(jobId, {
      status: "processing",
      stage: "image_analysis",
      progressPercent: 15,
      startedAt: new Date().toISOString(),
      photoSetStatus: "шалгаж байна",
      processingLog: appendLog(current.processingLog, {
        stage: "image_analysis",
        message: `${current.images.length} зургийн чанарын шалгалт эхэллээ.`
      })
    });

    const report = await analyzePhotoSet(current.images);
    const summary = summarizeReport(report);
    const quality = estimateQualityFromReport(report);

    const findingsLog = appendLog(current.processingLog, {
      stage: "image_analysis",
      message: `${current.images.length} зургийн чанарын шалгалт эхэллээ.`
    });

    findingsLog.push({
      createdAt: new Date().toISOString(),
      stage: "report_ready",
      message: summary,
      findings: report
    });

    const failingImages = report.perImage
      .filter((r) => !r.ok)
      .slice(0, 8)
      .map((r) => `${r.name}: ${(r.issues || []).join("; ")}`);

    if (failingImages.length) {
      findingsLog.push({
        createdAt: new Date().toISOString(),
        stage: "image_issues",
        message: failingImages.join(" | ")
      });
    }

    await updateReconstructionJob(jobId, {
      status: "completed",
      stage: "report_ready",
      progressPercent: 100,
      estimatedQuality: quality,
      resultSummary: summary,
      generatedFormat: "Чанарын тайлан (3D mesh үүсгээгүй)",
      generatedModelUrl: null,
      completedAt: new Date().toISOString(),
      photoSetStatus: report.okCount === report.total ? "шалгалт амжилттай" : "анхаарах зүйлтэй",
      processingLog: findingsLog
    });
  } catch (error) {
    const failed = await getReconstructionJobById(jobId);
    await updateReconstructionJob(jobId, {
      status: "failed",
      stage: "failed",
      photoSetStatus: "алдаа",
      processingLog: appendLog(failed?.processingLog, {
        stage: "failed",
        message: `Алдаа гарлаа: ${error.message}`
      })
    });
  } finally {
    activeJobs.delete(jobId);
  }
}
