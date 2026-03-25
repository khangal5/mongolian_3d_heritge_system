import { getReconstructionJobById, updateReconstructionJob } from "../repositories/reconstructionRepository.js";

const activeJobs = new Set();

function appendLog(log, entry) {
  return [...(log || []), { createdAt: new Date().toISOString(), ...entry }];
}

function estimateQuality(imageCount) {
  if (imageCount >= 30) {
    return "өндөр";
  }
  if (imageCount >= 16) {
    return "дунд";
  }
  return "бага";
}

function buildSummary(imageCount) {
  if (imageCount >= 30) {
    return "Зургийн тоо хангалттай байна. Бодит photogrammetry engine холбоход сайн туршилтын багц байна.";
  }
  if (imageCount >= 16) {
    return "Зургийн тоо боломжийн байна. Гэрэл ба өнцгийн тогтвортой байдлыг сайжруулбал reconstruction чанар нэмэгдэнэ.";
  }
  return "Зургийн тоо цөөн байна. Илүү олон өнцгөөс дахин зураг авахыг зөвлөж байна.";
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
      stage: "feature_matching",
      progressPercent: 20,
      startedAt: new Date().toISOString(),
      photoSetStatus: "боловсруулж байна",
      processingLog: appendLog(current.processingLog, {
        stage: "feature_matching",
        message: "Онцлог цэгүүд илрүүлэх шат эхэллээ."
      })
    });

    setTimeout(async () => {
      const mid = await getReconstructionJobById(jobId);

      if (!mid) {
        activeJobs.delete(jobId);
        return;
      }

      await updateReconstructionJob(jobId, {
        stage: "dense_reconstruction",
        progressPercent: 55,
        processingLog: appendLog(mid.processingLog, {
          stage: "dense_reconstruction",
          message: "Point cloud болон surface reconstruction шат симуляци хийгдэж байна."
        })
      });

      setTimeout(async () => {
        const last = await getReconstructionJobById(jobId);

        if (!last) {
          activeJobs.delete(jobId);
          return;
        }

        await updateReconstructionJob(jobId, {
          status: "completed",
          stage: "report_ready",
          progressPercent: 100,
          estimatedQuality: estimateQuality(last.photoSet.imageCount),
          resultSummary: buildSummary(last.photoSet.imageCount),
          generatedFormat: "GLB (санал болгох формат)",
          generatedModelUrl: null,
          completedAt: new Date().toISOString(),
          photoSetStatus: "туршилт дууссан",
          processingLog: appendLog(last.processingLog, {
            stage: "report_ready",
            message: "Туршилтын тайлан бэлэн боллоо. Одоо бодит engine холбоход бэлэн."
          })
        });

        activeJobs.delete(jobId);
      }, 3000);
    }, 2500);
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
    activeJobs.delete(jobId);
  }
}

