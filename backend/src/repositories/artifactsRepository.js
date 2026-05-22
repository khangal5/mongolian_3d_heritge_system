import { randomUUID } from "node:crypto";
import { query, withTransaction } from "../db/pool.js";

const searchColumnsByField = {
  all: [
    "a.name",
    "a.name_mn",
    "a.category",
    "a.period",
    "l.province",
    "l.location",
    "a.short_description",
    "a.description",
    "a.tags::text"
  ],
  name: ["a.name", "a.name_mn"],
  category: ["a.category"],
  period: ["a.period"],
  province: ["l.province"],
  location: ["l.location", "l.province"],
  description: ["a.short_description", "a.description"],
  tags: ["a.tags::text"]
};

export const ARTIFACT_STATUSES = Object.freeze({
  NEW: "NEW",
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED"
});

const SELECT_BASE = `
  SELECT
    a.id,
    a.slug,
    a.name,
    a.name_mn,
    a.category,
    a.period,
    a.short_description,
    a.description,
    a.tags,
    a.status,
    a.created_by_user_id,
    a.reviewed_by_user_id,
    a.reviewed_at,
    a.review_note,
    a.created_at,
    a.updated_at,
    l.province AS loc_province,
    l.location AS loc_location,
    l.latitude AS loc_latitude,
    l.longitude AS loc_longitude,
    l.geom AS loc_geom,
    (
      SELECT mf.file_url
      FROM media_files mf
      WHERE mf.artifact_id = a.id
        AND mf.file_type = 'image'
        AND mf.is_primary = TRUE
      LIMIT 1
    ) AS primary_image_url,
    COALESCE(
      (
        SELECT array_agg(mf.file_url ORDER BY mf.sort_order)
        FROM media_files mf
        WHERE mf.artifact_id = a.id
          AND mf.file_type = 'image'
          AND mf.is_primary = FALSE
      ),
      ARRAY[]::text[]
    ) AS gallery_urls,
    (
      SELECT mf.file_url
      FROM media_files mf
      WHERE mf.artifact_id = a.id
        AND mf.file_type = 'model'
      LIMIT 1
    ) AS model_file_url
  FROM artifacts a
  LEFT JOIN locations l ON l.artifact_id = a.id
`;

function mapArtifact(row) {
  const gallery = Array.isArray(row.gallery_urls) ? row.gallery_urls : [];
  const modelUrl = row.model_file_url || null;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    nameMn: row.name_mn,
    category: row.category,
    period: row.period,
    province: row.loc_province ?? "",
    location: row.loc_location ?? "",
    coordinates: {
      lat: row.loc_latitude ?? null,
      lng: row.loc_longitude ?? null
    },
    shortDescription: row.short_description,
    description: row.description,
    imageUrl: row.primary_image_url || "",
    gallery,
    modelUrl,
    modelEmbedUrl: modelUrl,
    tags: row.tags,
    status: row.status,
    createdByUserId: row.created_by_user_id || null,
    reviewedByUserId: row.reviewed_by_user_id || null,
    reviewedAt: row.reviewed_at || null,
    reviewNote: row.review_note || null,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null
  };
}

export async function getArtifacts({
  q = "",
  searchBy = "all",
  category = "",
  province = "",
  has3d = null,
  userLat = null,
  userLng = null,
  sort = "newest",
  includeItems = true,
  status = ARTIFACT_STATUSES.APPROVED
} = {}) {
  const params = [];
  const conditions = [];

  if (status) {
    params.push(status);
    conditions.push(`a.status = $${params.length}`);
  }

  if (q) {
    const columns = searchColumnsByField[searchBy] || searchColumnsByField.all;
    params.push(`%${q}%`);
    conditions.push(
      `(${columns.map((column) => `${column} ILIKE $${params.length}`).join("\n      OR ")})`
    );
  }

  if (category) {
    params.push(category);
    conditions.push(`LOWER(a.category) = LOWER($${params.length})`);
  }

  if (province) {
    params.push(province);
    conditions.push(`LOWER(l.province) = LOWER($${params.length})`);
  }

  if (has3d === true) {
    conditions.push(
      `EXISTS (SELECT 1 FROM media_files mf WHERE mf.artifact_id = a.id AND mf.file_type = 'model')`
    );
  } else if (has3d === false) {
    conditions.push(
      `NOT EXISTS (SELECT 1 FROM media_files mf WHERE mf.artifact_id = a.id AND mf.file_type = 'model')`
    );
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const hasUserLocation =
    userLat !== null &&
    userLng !== null &&
    !Number.isNaN(Number(userLat)) &&
    !Number.isNaN(Number(userLng));

  let orderBy = "ORDER BY a.created_at DESC, a.name ASC";

  if (sort === "distance" && hasUserLocation) {
    params.push(Number(userLng));
    const lngParam = `$${params.length}`;
    params.push(Number(userLat));
    const latParam = `$${params.length}`;
    orderBy = `ORDER BY ST_Distance(l.geom, ST_SetSRID(ST_MakePoint(${lngParam}, ${latParam}), 4326)::geography) ASC NULLS LAST`;
  } else if (sort === "oldest") {
    orderBy = "ORDER BY a.created_at ASC, a.name ASC";
  } else if (sort === "name_asc") {
    orderBy = "ORDER BY COALESCE(NULLIF(a.name_mn, ''), a.name) ASC";
  } else if (sort === "name_desc") {
    orderBy = "ORDER BY COALESCE(NULLIF(a.name_mn, ''), a.name) DESC";
  }
  // default: "newest" → ORDER BY created_at DESC

  const itemsResult = includeItems
    ? await query(
        `
          ${SELECT_BASE}
          ${whereClause}
          ${orderBy}
        `,
        params
      )
    : { rows: [], rowCount: 0 };

  const facetStatus = status || ARTIFACT_STATUSES.APPROVED;
  const filterResult = await query(
    `
      SELECT
        ARRAY(
          SELECT DISTINCT COALESCE(NULLIF(a.name_mn, ''), a.name) AS item
          FROM artifacts a
          WHERE a.status = $1
            AND COALESCE(NULLIF(a.name_mn, ''), a.name) IS NOT NULL
            AND COALESCE(NULLIF(a.name_mn, ''), a.name) <> ''
          ORDER BY item
        ) AS names,
        ARRAY(
          SELECT DISTINCT a.category
          FROM artifacts a
          WHERE a.status = $1 AND a.category IS NOT NULL AND a.category <> ''
          ORDER BY a.category
        ) AS categories,
        ARRAY(
          SELECT DISTINCT a.period
          FROM artifacts a
          WHERE a.status = $1 AND a.period IS NOT NULL AND a.period <> ''
          ORDER BY a.period
        ) AS periods,
        ARRAY(
          SELECT DISTINCT l.province
          FROM artifacts a
          JOIN locations l ON l.artifact_id = a.id
          WHERE a.status = $1 AND l.province IS NOT NULL AND l.province <> ''
          ORDER BY l.province
        ) AS provinces,
        ARRAY(
          SELECT DISTINCT l.location
          FROM artifacts a
          JOIN locations l ON l.artifact_id = a.id
          WHERE a.status = $1 AND l.location IS NOT NULL AND l.location <> ''
          ORDER BY l.location
        ) AS locations,
        ARRAY(
          SELECT DISTINCT tag
          FROM artifacts a
          CROSS JOIN LATERAL jsonb_array_elements_text(a.tags) AS tag
          WHERE a.status = $1
          ORDER BY tag
        ) AS tags
    `,
    [facetStatus]
  );

  return {
    items: itemsResult.rows.map(mapArtifact),
    total: itemsResult.rowCount,
    filters: {
      names: filterResult.rows[0]?.names || [],
      categories: filterResult.rows[0]?.categories || [],
      periods: filterResult.rows[0]?.periods || [],
      provinces: filterResult.rows[0]?.provinces || [],
      locations: filterResult.rows[0]?.locations || [],
      tags: filterResult.rows[0]?.tags || []
    }
  };
}

export async function getArtifactsByOwner(ownerId) {
  const result = await query(
    `
      ${SELECT_BASE}
      WHERE a.created_by_user_id = $1
      ORDER BY
        CASE a.status
          WHEN 'NEW' THEN 0
          WHEN 'PENDING' THEN 1
          WHEN 'REJECTED' THEN 2
          WHEN 'APPROVED' THEN 3
          ELSE 4
        END,
        a.updated_at DESC
    `,
    [ownerId]
  );

  return result.rows.map(mapArtifact);
}

export async function getArtifactsByStatus(status) {
  const result = await query(
    `
      ${SELECT_BASE}
      WHERE a.status = $1
      ORDER BY a.updated_at ASC
    `,
    [status]
  );

  return result.rows.map(mapArtifact);
}

export async function getArtifactBySlug(slug) {
  const result = await query(
    `
      ${SELECT_BASE}
      WHERE a.slug = $1
      LIMIT 1
    `,
    [slug]
  );

  if (!result.rowCount) {
    return null;
  }

  return mapArtifact(result.rows[0]);
}

async function upsertLocation(client, artifactId, artifact) {
  await client.query(
    `
      INSERT INTO locations (id, artifact_id, province, location, latitude, longitude, geom)
      VALUES (
        $1, $2, $3, $4, $5, $6,
        ST_SetSRID(ST_MakePoint($6, $5), 4326)::geography
      )
      ON CONFLICT (artifact_id) DO UPDATE
      SET province = EXCLUDED.province,
          location = EXCLUDED.location,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          geom = EXCLUDED.geom
    `,
    [
      randomUUID(),
      artifactId,
      artifact.province,
      artifact.location,
      artifact.coordinates.lat,
      artifact.coordinates.lng
    ]
  );
}

async function replaceMediaFiles(client, artifactId, artifact) {
  await client.query(`DELETE FROM media_files WHERE artifact_id = $1`, [artifactId]);

  if (artifact.imageUrl) {
    await client.query(
      `
        INSERT INTO media_files (id, artifact_id, file_url, file_type, is_primary, sort_order)
        VALUES ($1, $2, $3, 'image', TRUE, 0)
      `,
      [randomUUID(), artifactId, artifact.imageUrl]
    );
  }

  const gallery = Array.isArray(artifact.gallery) ? artifact.gallery : [];
  for (let i = 0; i < gallery.length; i++) {
    const url = gallery[i];
    if (!url) continue;
    await client.query(
      `
        INSERT INTO media_files (id, artifact_id, file_url, file_type, is_primary, sort_order)
        VALUES ($1, $2, $3, 'image', FALSE, $4)
      `,
      [randomUUID(), artifactId, url, i + 1]
    );
  }

  if (artifact.modelUrl) {
    await client.query(
      `
        INSERT INTO media_files (id, artifact_id, file_url, file_type, is_primary, sort_order)
        VALUES ($1, $2, $3, 'model', TRUE, 0)
      `,
      [randomUUID(), artifactId, artifact.modelUrl]
    );
  }
}

export async function createArtifact(artifact) {
  return withTransaction(async (client) => {
    await client.query(
      `
        INSERT INTO artifacts (
          id, slug, name, name_mn, category, period,
          short_description, description, tags, status, created_by_user_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11)
      `,
      [
        artifact.id,
        artifact.slug,
        artifact.name,
        artifact.nameMn,
        artifact.category,
        artifact.period,
        artifact.shortDescription,
        artifact.description,
        JSON.stringify(artifact.tags || []),
        artifact.status,
        artifact.createdByUserId || null
      ]
    );

    await upsertLocation(client, artifact.id, artifact);
    await replaceMediaFiles(client, artifact.id, artifact);

    const result = await client.query(
      `
        ${SELECT_BASE}
        WHERE a.id = $1
        LIMIT 1
      `,
      [artifact.id]
    );

    return mapArtifact(result.rows[0]);
  });
}

export async function updateArtifact(slug, artifact) {
  return withTransaction(async (client) => {
    const found = await client.query(`SELECT id FROM artifacts WHERE slug = $1`, [slug]);
    if (!found.rowCount) {
      return null;
    }
    const artifactId = found.rows[0].id;

    await client.query(
      `
        UPDATE artifacts
        SET slug = $2,
            name = $3,
            name_mn = $4,
            category = $5,
            period = $6,
            short_description = $7,
            description = $8,
            tags = $9::jsonb,
            status = $10,
            updated_at = NOW()
        WHERE slug = $1
      `,
      [
        slug,
        artifact.slug,
        artifact.name,
        artifact.nameMn,
        artifact.category,
        artifact.period,
        artifact.shortDescription,
        artifact.description,
        JSON.stringify(artifact.tags || []),
        artifact.status
      ]
    );

    await upsertLocation(client, artifactId, artifact);
    await replaceMediaFiles(client, artifactId, artifact);

    const result = await client.query(
      `
        ${SELECT_BASE}
        WHERE a.id = $1
        LIMIT 1
      `,
      [artifactId]
    );

    return mapArtifact(result.rows[0]);
  });
}

export async function setArtifactStatus(slug, { status, reviewerId = null, reviewNote = null }) {
  await query(
    `
      UPDATE artifacts
      SET status = $2,
          reviewed_by_user_id = $3::text,
          reviewed_at = CASE WHEN $3::text IS NULL THEN reviewed_at ELSE NOW() END,
          review_note = COALESCE($4::text, review_note),
          updated_at = NOW()
      WHERE slug = $1
    `,
    [slug, status, reviewerId, reviewNote]
  );

  return getArtifactBySlug(slug);
}

export async function deleteArtifact(slug) {
  const result = await query(
    `
      DELETE FROM artifacts
      WHERE slug = $1
      RETURNING id
    `,
    [slug]
  );

  return Boolean(result.rowCount);
}
