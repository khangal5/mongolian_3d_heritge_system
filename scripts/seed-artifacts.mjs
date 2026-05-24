// Seed 7 real Mongolian heritage artifacts directly into the DB.
// Run from backend folder so it picks up the .env automatically:
//   node ../scripts/seed-artifacts.mjs
//
// Or from project root:
//   node scripts/seed-artifacts.mjs

import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

const here = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(here, "..", "backend", ".env");

// Minimal .env loader (no dotenv dep here).
const envText = readFileSync(envPath, "utf8");
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/i);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const ARTIFACTS = [
  {
    slug: "uushigiin-uvur-deer-stones",
    name: "Uushigiin Övör Deer Stones",
    name_mn: "Уушигийн өвөрийн буган чулууны цогцолбор",
    category: "Чулуун хөшөө",
    period: "Хүрлийн ба төмөр зэвсгийн үе",
    short_description:
      "Хөвсгөл аймгийн Мөрөн хотын баруун урд орших Монгол улсын хамгийн томоохон буган чулууны цогцолборын нэг.",
    description:
      "Уушигийн өвөрийн буган чулууны цогцолбор нь Хөвсгөл аймгийн Мөрөн хотоос 20 км зайд орших Хүрэл ба эртний төмөр зэвсгийн үеийн (МЭӨ 1300–700) дурсгал юм. Энд 14 ширхэг сонгодог хэлбэрийн буган чулуу олдсон бөгөөд тус бүр нь стилист хэлбэрээр дүрсэлсэн нисэх цаа буга, нар сар, бүс, морин толгой, зэвсэг зэрэг олон зургаар чимэглэгдсэн. ОУ-ын Монгол-Японы хамтарсан экспедицээр 2003-2010 онд иж бүрэн судалгаа хийсэн.",
    tags: ["буган чулуу", "хүрлийн үе", "цаа буга", "Хөвсгөл", "Уушиг"],
    province: "Хөвсгөл",
    location: "Мөрөн",
    latitude: 49.65,
    longitude: 99.9833,
    image_url:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Deer_stones_at_Uushgiin_Uvur%2C_Mongolia.jpg/800px-Deer_stones_at_Uushgiin_Uvur%2C_Mongolia.jpg"
  },
  {
    slug: "gol-mod-xiongnu-burial",
    name: "Gol-Mod Xiongnu Necropolis",
    name_mn: "Гол-Мод Хүннүгийн язгууртны булшны цогцолбор",
    category: "Булш бунхан",
    period: "Хүннүгийн үе (МЭӨ III зуун – МЭ I зуун)",
    short_description:
      "Хүннү гүрний язгууртны 200 гаруй жаран хэлбэрийн булш бүхий томоохон цогцолбор.",
    description:
      "Гол-Мод I & II цогцолборууд нь Архангай аймгийн Хайрхан сумын нутаг дахь Хүннү гүрний хааны овгийн булш юм. Терасс хэлбэрийн жаран булш, дугуй чулуун дугуйлан бүхий энэхүү site нь МЭӨ 80 — МЭ 100 онд оршин тогтсон. Монгол-Францын хамтарсан төслөөр 2000-2014 онуудад малталт хийж, тэрэг, торгон даавуу, алт мөнгөн эдлэл, хятад толин олдсон. Хүннү гүрний нийгмийн зохион байгуулалт, оршуулгын ёслол, олон улсын худалдааны харилцаа судлахад үнэт чухал материал.",
    tags: ["Хүннү", "булш", "язгууртан", "Гол-Мод", "археологи"],
    province: "Архангай",
    location: "Хайрхан",
    latitude: 47.6833,
    longitude: 102.7333,
    image_url:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Xiongnu_tomb_at_Gol_Mod.jpg/800px-Xiongnu_tomb_at_Gol_Mod.jpg"
  },
  {
    slug: "khar-balgas-uyghur-capital",
    name: "Khar Balgas (Ordu-Baliq)",
    name_mn: "Хар Балгасын туурь — Уйгур хааны нийслэл хот",
    category: "Хөшөө дурсгал",
    period: "Уйгурын хаант улсын үе (VIII – IX зуун)",
    short_description:
      "Уйгур хааны нийслэл Ордубалик хотын туурь, Орхоны хөндийн ЮНЕСКО-гийн өвийн нэгээхэн хэсэг.",
    description:
      "Хар Балгас нь Орхоны хөндийн дотор Уйгур хааны нийслэл байсан Ордубалик хотын туурь юм. МЭ 745 онд Биллиг каган үндэслэж 840 онд Киргиз нарт сүйрсэн. 30 км² талбайтай, төв ордон, гар урлалын дүүрэг, мусульман худалдаачдын хороо, манихеи шашны сүмтэй байсан. ЮНЕСКО-гийн \"Орхоны хөндийн соёлын ландшафт\" (#1081) нэрийн дор 2004 онд Дэлхийн өвийн жагсаалтад орсон. Монгол-Шведийн хамтарсан экспедицээр 2007-2011 онд geophysical survey хийсэн.",
    tags: ["Уйгур", "Ордубалик", "нийслэл хот", "Орхон", "ЮНЕСКО"],
    province: "Архангай",
    location: "Хотонт",
    latitude: 47.5567,
    longitude: 102.7058,
    image_url:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Khar_Balgas_ruins.jpg/800px-Khar_Balgas_ruins.jpg"
  },
  {
    slug: "khoid-tsenkher-cave-paintings",
    name: "Khoid Tsenkher Cave Paintings",
    name_mn: "Хойд Цэнхэрийн агуйн палеолитын зургийн цогцолбор",
    category: "Хадны зураг",
    period: "Палеолитын үе (МЭӨ 2.5 сая – 12000)",
    short_description:
      "МЭӨ 20,000-15,000 жилийн өмнө улаан охроор зурсан Монголын анхны хадны зургийн жишээ.",
    description:
      "Хойд Цэнхэрийн агуй нь Ховд аймгийн Манхан сумын нутаг, Алтайн нурууны хадан хавцалд орших дээд палеолитын үеийн дурсгалт газар. Агуйн доторх 20 гаруй хадны зураг улаан охроор зурсан — мамонт, ноосон хирс, тэмээ, тахь, цаа буга, шувуу, антилоп зэрэг ангийн дүрс гарна. Зарим зураг МЭӨ 40,000 жилийн настай гэж онолд тавьсан ч одоо нийтлэг хүлээн зөвшөөрсөн нь МЭӨ 20,000-12,000 он. Монголд олдсон хамгийн эртний дүрслэлийн урлагийн дурсгал.",
    tags: ["палеолит", "агуйн зураг", "охр", "мамонт", "Алтай", "Ховд"],
    province: "Ховд",
    location: "Манхан",
    latitude: 47.4167,
    longitude: 92.0833,
    image_url:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Hoit-Tsenher-Cave.jpg/800px-Hoit-Tsenher-Cave.jpg"
  },
  {
    slug: "tonyukuk-stele",
    name: "Tonyukuk Stele",
    name_mn: "Тоньюкукийн гэрэлт хөшөө",
    category: "Чулуун бичээс",
    period: "Түрэгийн хаант улсын үе (VI – VIII зуун)",
    short_description:
      "Хоёр дахь Түрэгийн хаант улсын төрийн зүтгэлтэн Тоньюкукийн өөрийн биеэр зохиосон руни бичээс.",
    description:
      "Тоньюкукийн гэрэлт хөшөө нь Хэрлэн голын дунд урсгалын дагуу Налайхын баруун хойно, Эрдэнэ сумын нутагт босгогдсон хоёр чулуун хөшөө юм. МЭ 716-720 онд Тоньюкук гэгээн (Билгэ кагний бичиг бий хийсэн төрийн зүтгэлтэн) өөрийн биеэр зохиогдсон 62 мөр руни бичээс агуулдаг. Энэ нь Түрэг хүний автобиографийн анхны бичээс бөгөөд Хельсинкийн их сургуулийн профессор Маркел Эрделанд анхны хэлмэрчээ хийсэн. УБ-аас 56 км зайтай учир жуулчдад нэлээд алдартай.",
    tags: ["Түрэг", "руни бичиг", "Тоньюкук", "гэрэлт хөшөө", "Хэрлэн"],
    province: "Төв",
    location: "Эрдэнэ",
    latitude: 47.7167,
    longitude: 107.4667,
    image_url:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Tonyukuk_Inscription.jpg/800px-Tonyukuk_Inscription.jpg"
  },
  {
    slug: "erdene-zuu-monastery",
    name: "Erdene Zuu Monastery",
    name_mn: "Эрдэнэ зуу хийд",
    category: "Хөшөө дурсгал",
    period: "Хожуу Монгол (XV – XVI зуун)",
    short_description:
      "Монголын анхны Буддын хийд. 1586 онд Каракорумын чулуугаар барьсан, ЮНЕСКО-гийн дэлхийн өв.",
    description:
      "Эрдэнэ зуу хийдийг 1586 онд Абтай Сайн хаан Каракорумын эртний нийслэл хотын чулуу, хөшөөг ашиглан бариулсан Монгол улсын анхны Буддын лам нарын хийд юм. 108 суварган хана, 3 гол сүм, 60-аад бяцхан сүмтэй байсан. Социалист үед сүйтгэгдсэн ч одоо музей болон зарим сүмтэй сэргээгдсэн. ЮНЕСКО-гийн \"Орхоны хөндийн соёлын ландшафт\" (#1081) нэрийн дор 2004 онд Дэлхийн өвийн жагсаалтад орсон.",
    tags: ["Буддизм", "Эрдэнэ зуу", "хийд", "Хархорин", "ЮНЕСКО"],
    province: "Өвөрхангай",
    location: "Хархорин",
    latitude: 47.2,
    longitude: 102.8333,
    image_url:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Erdene_Zuu_Khiid.jpg/800px-Erdene_Zuu_Khiid.jpg"
  },
  {
    slug: "bichigt-khairkhan-petroglyphs",
    name: "Bichigt Khairkhan Petroglyphs",
    name_mn: "Бичигт хайрхан уулын хадны зураг",
    category: "Хадны зураг",
    period: "Хүрлийн ба төмөр зэвсгийн үе",
    short_description:
      "Зүүн Монголын хамгийн томоохон петроглифийн цогцолбор — 1000 гаруй хадны зураг.",
    description:
      "Бичигт хайрхан уулын хадны зурагнууд Дорнод аймгийн Дашбалбар сумын нутагт орших Хүрлийн ба эртний төмөр зэвсгийн үеийн (МЭӨ 1500-200) дурсгал. Цогцолборт цаа буга, морьт цэрэг, тэрэг, гэр, гахайн ан, тамга, монгол үсэгтэй ижил руни бичиг зэрэг 1000 гаруй зураг сийлэгджээ. Эл нутаг Монголд эртний Хүннү, Сяньби, Кидань үе дамжсан соёлын зөрлөг болж байжээ. Эрдэмтэн Ц.Доржсүрэн анх 1958 онд олжээ.",
    tags: ["петроглиф", "Дорнод", "цаа буга", "морьт цэрэг", "тамга"],
    province: "Дорнод",
    location: "Дашбалбар",
    latitude: 49.65,
    longitude: 114.7833,
    image_url:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Mongolian_petroglyphs.jpg/800px-Mongolian_petroglyphs.jpg"
  }
];

let inserted = 0;
let skipped = 0;

try {
  await client.query("BEGIN");

  for (const a of ARTIFACTS) {
    const existing = await client.query(
      "SELECT id FROM artifacts WHERE slug = $1",
      [a.slug]
    );
    if (existing.rowCount > 0) {
      console.log(`skip: ${a.slug} (already exists)`);
      skipped++;
      continue;
    }

    const artifactId = randomUUID();
    const locationId = randomUUID();
    const mediaId = randomUUID();

    await client.query(
      `INSERT INTO artifacts
       (id, slug, name, name_mn, category, period, short_description, description, tags, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,'APPROVED')`,
      [
        artifactId,
        a.slug,
        a.name,
        a.name_mn,
        a.category,
        a.period,
        a.short_description,
        a.description,
        JSON.stringify(a.tags)
      ]
    );

    await client.query(
      `INSERT INTO locations (id, artifact_id, province, location, latitude, longitude, geom)
       VALUES ($1,$2,$3,$4,$5,$6, ST_SetSRID(ST_MakePoint($6,$5),4326)::geography)`,
      [locationId, artifactId, a.province, a.location, a.latitude, a.longitude]
    );

    await client.query(
      `INSERT INTO media_files (id, artifact_id, file_url, file_type, is_primary, sort_order)
       VALUES ($1,$2,$3,'image',TRUE,0)`,
      [mediaId, artifactId, a.image_url]
    );

    console.log(`insert: ${a.slug}`);
    inserted++;
  }

  await client.query("COMMIT");
} catch (err) {
  await client.query("ROLLBACK");
  console.error("ROLLBACK:", err.message);
  process.exit(1);
} finally {
  await client.end();
}

console.log(`\ndone — inserted ${inserted}, skipped ${skipped}`);
