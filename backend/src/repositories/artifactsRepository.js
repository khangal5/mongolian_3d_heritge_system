import { query } from "../db/pool.js";

const searchColumnsByField = {
  all: [
    "name",
    "name_mn",
    "category",
    "period",
    "province",
    "location",
    "short_description",
    "description",
    "tags::text"
  ],
  name: ["name", "name_mn"],
  category: ["category"],
  period: ["period"],
  province: ["province"],
  location: ["location", "province"],
  description: ["short_description", "description"],
  tags: ["tags::text"]
};

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
    modelUrl: row.model_url || row.model_embed_url,
    modelEmbedUrl: row.model_embed_url,
    tags: row.tags,
    status: row.status,
    createdByUserId: row.created_by_user_id || null
  };
}

export async function getArtifacts({
  q = "",
  searchBy = "all",
  category = "",
  province = "",
  includeItems = true
} = {}) {
  const params = [];
  const conditions = [];

  if (q) {
    const columns = searchColumnsByField[searchBy] || searchColumnsByField.all;
    params.push(`%${q}%`);
    conditions.push(
      `(${columns.map((column) => `${column} ILIKE $${params.length}`).join("\n      OR ")})`
    );
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

  const itemsResult = includeItems
    ? await query(
        `
          SELECT *
          FROM artifacts
          ${whereClause}
          ORDER BY created_at DESC, name ASC
        `,
        params
      )
    : { rows: [], rowCount: 0 };

  const filterResult = await query(`
    SELECT
      ARRAY(
        SELECT DISTINCT COALESCE(NULLIF(name_mn, ''), name) AS item
        FROM artifacts
        WHERE COALESCE(NULLIF(name_mn, ''), name) IS NOT NULL
          AND COALESCE(NULLIF(name_mn, ''), name) <> ''
        ORDER BY item
      ) AS names,
      ARRAY(
        SELECT DISTINCT category
        FROM artifacts
        WHERE category IS NOT NULL AND category <> ''
        ORDER BY category
      ) AS categories,
      ARRAY(
        SELECT DISTINCT period
        FROM artifacts
        WHERE period IS NOT NULL AND period <> ''
        ORDER BY period
      ) AS periods,
      ARRAY(
        SELECT DISTINCT province
        FROM artifacts
        WHERE province IS NOT NULL AND province <> ''
        ORDER BY province
      ) AS provinces,
      ARRAY(
        SELECT DISTINCT location
        FROM artifacts
        WHERE location IS NOT NULL AND location <> ''
        ORDER BY location
      ) AS locations,
      ARRAY(
        SELECT DISTINCT tag
        FROM artifacts
        CROSS JOIN LATERAL jsonb_array_elements_text(tags) AS tag
        ORDER BY tag
      ) AS tags
  `);

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
        model_url,
        model_embed_url,
        tags,
        status,
        created_by_user_id
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14::jsonb, $15, $16, $17::jsonb, $18, $19
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
      artifact.modelUrl,
      artifact.modelUrl,
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
        model_url = $15,
        model_embed_url = $16,
        tags = $17::jsonb,
        status = $18,
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
      artifact.modelUrl,
      artifact.modelUrl,
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
