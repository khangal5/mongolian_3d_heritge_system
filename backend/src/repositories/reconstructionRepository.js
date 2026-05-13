import { query, withTransaction } from "../db/pool.js";

function mapReconstructionJob(row) {
  return {
    id: row.job_id,
    photoSetId: row.photo_set_id,
    status: row.job_status,
    stage: row.stage,
    progressPercent: row.progress_percent,
    engine: row.engine,
    engineMode: row.engine_mode,
    estimatedQuality: row.estimated_quality,
    resultSummary: row.result_summary,
    generatedModelUrl: row.generated_model_url,
    generatedFormat: row.generated_format,
    processingLog: row.processing_log || [],
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.job_created_at,
    updatedAt: row.job_updated_at,
    photoSet: {
      id: row.photo_set_id,
      title: row.title,
      description: row.description,
      captureNotes: row.capture_notes,
      status: row.photo_set_status,
      imageCount: row.image_count,
      createdByUserId: row.photo_set_created_by || null,
      createdAt: row.photo_set_created_at,
      updatedAt: row.photo_set_updated_at
    },
    images: row.images || []
  };
}

const selectJobsSql = `
  SELECT
    rj.id AS job_id,
    rj.photo_set_id,
    rj.status AS job_status,
    rj.stage,
    rj.progress_percent,
    rj.engine,
    rj.engine_mode,
    rj.estimated_quality,
    rj.result_summary,
    rj.generated_model_url,
    rj.generated_format,
    rj.processing_log,
    rj.started_at,
    rj.completed_at,
    rj.created_at AS job_created_at,
    rj.updated_at AS job_updated_at,
    ps.title,
    ps.description,
    ps.capture_notes,
    ps.status AS photo_set_status,
    ps.image_count,
    ps.created_by_user_id AS photo_set_created_by,
    ps.created_at AS photo_set_created_at,
    ps.updated_at AS photo_set_updated_at,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', pi.id,
          'originalName', pi.original_name,
          'storedName', pi.stored_name,
          'mimeType', pi.mime_type,
          'sizeBytes', pi.size_bytes,
          'filePath', pi.file_path,
          'publicUrl', pi.public_url,
          'sortOrder', pi.sort_order
        )
        ORDER BY pi.sort_order
      ) FILTER (WHERE pi.id IS NOT NULL),
      '[]'::jsonb
    ) AS images
  FROM reconstruction_jobs rj
  JOIN photo_sets ps ON ps.id = rj.photo_set_id
  LEFT JOIN photo_images pi ON pi.photo_set_id = ps.id
`;

export async function createPhotoSetWithJob({ photoSet, images, job, createdByUserId = null }) {
  return withTransaction(async (client) => {
    await client.query(
      `
        INSERT INTO photo_sets (id, title, description, capture_notes, status, image_count, created_by_user_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        photoSet.id,
        photoSet.title,
        photoSet.description,
        photoSet.captureNotes,
        photoSet.status,
        images.length,
        createdByUserId
      ]
    );

    for (const image of images) {
      await client.query(
        `
          INSERT INTO photo_images (
            id, photo_set_id, original_name, stored_name, mime_type,
            size_bytes, file_path, public_url, sort_order
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        [
          image.id,
          photoSet.id,
          image.originalName,
          image.storedName,
          image.mimeType,
          image.sizeBytes,
          image.filePath,
          image.publicUrl,
          image.sortOrder
        ]
      );
    }

    await client.query(
      `
        INSERT INTO reconstruction_jobs (
          id, photo_set_id, status, stage, progress_percent, engine,
          engine_mode, estimated_quality, result_summary, generated_model_url,
          generated_format, processing_log
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)
      `,
      [
        job.id,
        photoSet.id,
        job.status,
        job.stage,
        job.progressPercent,
        job.engine,
        job.engineMode,
        job.estimatedQuality,
        job.resultSummary,
        job.generatedModelUrl,
        job.generatedFormat,
        JSON.stringify(job.processingLog)
      ]
    );

    return job.id;
  }).then((jobId) => getReconstructionJobById(jobId));
}

export async function listReconstructionJobs() {
  const result = await query(
    `
      ${selectJobsSql}
      GROUP BY rj.id, ps.id
      ORDER BY rj.created_at DESC
    `
  );

  return result.rows.map(mapReconstructionJob);
}

export async function getReconstructionJobById(id) {
  const result = await query(
    `
      ${selectJobsSql}
      WHERE rj.id = $1
      GROUP BY rj.id, ps.id
      LIMIT 1
    `,
    [id]
  );

  if (!result.rowCount) {
    return null;
  }

  return mapReconstructionJob(result.rows[0]);
}

export async function updateReconstructionJob(id, patch) {
  const current = await query(
    `
      SELECT *
      FROM reconstruction_jobs
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );

  if (!current.rowCount) {
    return null;
  }

  const row = current.rows[0];

  await query(
    `
      UPDATE reconstruction_jobs
      SET
        status = $2,
        stage = $3,
        progress_percent = $4,
        estimated_quality = $5,
        result_summary = $6,
        generated_model_url = $7,
        generated_format = $8,
        processing_log = $9::jsonb,
        started_at = COALESCE($10, started_at),
        completed_at = $11,
        updated_at = NOW()
      WHERE id = $1
    `,
    [
      id,
      patch.status ?? row.status,
      patch.stage ?? row.stage,
      patch.progressPercent ?? row.progress_percent,
      patch.estimatedQuality ?? row.estimated_quality,
      patch.resultSummary ?? row.result_summary,
      patch.generatedModelUrl ?? row.generated_model_url,
      patch.generatedFormat ?? row.generated_format,
      JSON.stringify(patch.processingLog ?? row.processing_log ?? []),
      patch.startedAt ?? row.started_at,
      patch.completedAt ?? row.completed_at
    ]
  );

  if (patch.photoSetStatus) {
    await query(
      `
        UPDATE photo_sets
        SET status = $2, updated_at = NOW()
        WHERE id = $1
      `,
      [row.photo_set_id, patch.photoSetStatus]
    );
  }

  return getReconstructionJobById(id);
}
