import { query } from "../db/pool.js";

function mapArtifact(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    nameMn: row.name_mn,
    category: row.category,
    period: row.period,
    province: row.province,
    location: row.location,
    coordinates: {
      lat: row.latitude,
      lng: row.longitude
    },
    shortDescription: row.short_description,
    description: row.description,
    imageUrl: row.image_url,
    gallery: row.gallery,
    modelEmbedUrl: row.model_embed_url,
    tags: row.tags,
    status: row.status,
    createdByUserId: row.created_by_user_id || null
  };
}

export async function getArtifacts({ q = "", category = "", province = "" } = {}) {
  const params = [];
  const conditions = [];

  if (q) {
    params.push(`%${q}%`);
    conditions.push(`(
      name ILIKE $${params.length}
      OR name_mn ILIKE $${params.length}
      OR category ILIKE $${params.length}
      OR period ILIKE $${params.length}
      OR province ILIKE $${params.length}
      OR location ILIKE $${params.length}
      OR short_description ILIKE $${params.length}
      OR tags::text ILIKE $${params.length}
    )`);
  }

  if (category) {
    params.push(category);
    conditions.push(`LOWER(category) = LOWER($${params.length})`);
  }

  if (province) {
    params.push(province);
    conditions.push(`LOWER(province) = LOWER($${params.length})`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const itemsResult = await query(
    `
      SELECT *
      FROM artifacts
      ${whereClause}
      ORDER BY created_at DESC, name ASC
    `,
    params
  );

  const filterResult = await query(`
    SELECT
      ARRAY(SELECT DISTINCT category FROM artifacts ORDER BY category) AS categories,
      ARRAY(SELECT DISTINCT province FROM artifacts ORDER BY province) AS provinces
  `);

  return {
    items: itemsResult.rows.map(mapArtifact),
    total: itemsResult.rowCount,
    filters: {
      categories: filterResult.rows[0]?.categories || [],
      provinces: filterResult.rows[0]?.provinces || []
    }
  };
}

export async function getArtifactBySlug(slug) {
  const result = await query(
    `
      SELECT *
      FROM artifacts
      WHERE slug = $1
      LIMIT 1
    `,
    [slug]
  );

  if (!result.rowCount) {
    return null;
  }

  return mapArtifact(result.rows[0]);
}

export async function createArtifact(artifact) {
  const result = await query(
    `
      INSERT INTO artifacts (
        id,
        slug,
        name,
        name_mn,
        category,
        period,
        province,
        location,
        latitude,
        longitude,
        short_description,
        description,
        image_url,
        gallery,
        model_embed_url,
        tags,
        status,
        created_by_user_id
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14::jsonb, $15, $16::jsonb, $17, $18
      )
      RETURNING *
    `,
    [
      artifact.id,
      artifact.slug,
      artifact.name,
      artifact.nameMn,
      artifact.category,
      artifact.period,
      artifact.province,
      artifact.location,
      artifact.coordinates.lat,
      artifact.coordinates.lng,
      artifact.shortDescription,
      artifact.description,
      artifact.imageUrl,
      JSON.stringify(artifact.gallery),
      artifact.modelEmbedUrl,
      JSON.stringify(artifact.tags),
      artifact.status,
      artifact.createdByUserId || null
    ]
  );

  return mapArtifact(result.rows[0]);
}

export async function updateArtifact(slug, artifact) {
  const result = await query(
    `
      UPDATE artifacts
      SET
        slug = $2,
        name = $3,
        name_mn = $4,
        category = $5,
        period = $6,
        province = $7,
        location = $8,
        latitude = $9,
        longitude = $10,
        short_description = $11,
        description = $12,
        image_url = $13,
        gallery = $14::jsonb,
        model_embed_url = $15,
        tags = $16::jsonb,
        status = $17,
        updated_at = NOW()
      WHERE slug = $1
      RETURNING *
    `,
    [
      slug,
      artifact.slug,
      artifact.name,
      artifact.nameMn,
      artifact.category,
      artifact.period,
      artifact.province,
      artifact.location,
      artifact.coordinates.lat,
      artifact.coordinates.lng,
      artifact.shortDescription,
      artifact.description,
      artifact.imageUrl,
      JSON.stringify(artifact.gallery),
      artifact.modelEmbedUrl,
      JSON.stringify(artifact.tags),
      artifact.status
    ]
  );

  if (!result.rowCount) {
    return null;
  }

  return mapArtifact(result.rows[0]);
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
