import pptxgen from "pptxgenjs";
import { existsSync } from "node:fs";
import path from "node:path";

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 inches (16:9)
pres.author = "Н.Хангал";
pres.company = "ШУТИС - МХТС";
pres.title = "Монголын түүхэн өвийг 3D веб системээр харуулах";

const NAVY = "1F3A93";
const ACCENT = "C0392B";
const TEXT = "111111";
const MUTED = "666666";
const BG = "FFFFFF";

const FIG = "../DIPLOM__1_/Figures";

function addHeader(slide) {
  // Faculty name top-right
  slide.addText("Компьютерын Ухааны Тэнхим", {
    x: 8.5, y: 0.2, w: 4.5, h: 0.35,
    fontSize: 11, fontFace: "Calibri", color: TEXT,
    bold: true, align: "right"
  });
}

function addFooter(slide, pageNum) {
  slide.addText(String(pageNum), {
    x: 12.7, y: 7.05, w: 0.5, h: 0.3,
    fontSize: 11, color: MUTED, align: "right"
  });
}

function addTitle(slide, text) {
  slide.addText(text, {
    x: 0.5, y: 0.5, w: 12.3, h: 0.7,
    fontSize: 28, fontFace: "Calibri", color: NAVY, bold: true
  });
}

function tryImage(slide, fileRel, opts) {
  const abs = path.resolve(process.cwd(), FIG, fileRel);
  if (existsSync(abs)) {
    slide.addImage({ path: abs, ...opts });
    return true;
  }
  // placeholder rectangle if missing
  slide.addShape("rect", {
    ...opts,
    fill: { color: "EEEEEE" },
    line: { color: "CCCCCC", width: 1 }
  });
  slide.addText(`[Зургийн файл: ${fileRel}]`, {
    ...opts,
    fontSize: 11, color: MUTED, align: "center", valign: "middle"
  });
  return false;
}

// ============================================================
// Slide 1 — Cover
// ============================================================
{
  const s = pres.addSlide();
  addHeader(s);
  s.addText("Монголын түүхэн өвийг 3D интерактив\nвеб системээр харуулах", {
    x: 0.7, y: 2.1, w: 12, h: 1.6,
    fontSize: 36, fontFace: "Calibri", color: NAVY, bold: true,
    align: "center"
  });
  s.addText("Н. ХАНГАЛ", {
    x: 0.5, y: 4.0, w: 12.3, h: 0.5,
    fontSize: 22, color: TEXT, bold: true, align: "center"
  });
  s.addText([
    { text: "Удирдагч багш: ", options: { color: TEXT } },
    { text: "Доктор (Ph.D) [НЭР]", options: { color: TEXT, bold: true } }
  ], {
    x: 0.5, y: 4.7, w: 12.3, h: 0.4,
    fontSize: 16, align: "center"
  });
  s.addText([
    { text: "Зөвлөх багш: ", options: { color: TEXT } },
    { text: "Магистр [НЭР]", options: { color: TEXT, bold: true } }
  ], {
    x: 0.5, y: 5.1, w: 12.3, h: 0.4,
    fontSize: 16, align: "center"
  });
  s.addText("2026 оны 05 сарын [өдөр]", {
    x: 0.5, y: 5.8, w: 12.3, h: 0.4,
    fontSize: 16, color: TEXT, bold: true, align: "center"
  });
}

// ============================================================
// Slide 2 — Агуулга
// ============================================================
{
  const s = pres.addSlide();
  addHeader(s);
  addTitle(s, "Агуулга");

  const items = [
    "Удиртгал",
    "Зорилго, зорилт",
    "Систем хөгжүүлэх үндэслэл",
    "Ижил төстэй системийн судалгаа",
    "Ашиглагдсан технологи",
    "Архитектур",
    "Юзкейс диаграмм",
    "Класс диаграмм",
    "Үйл ажиллагааны диаграмм",
    "Дарааллын диаграмм",
    "Өгөгдлийн сангийн схем",
    "Дүгнэлт"
  ];
  s.addText(items.map((t) => ({ text: t, options: { bullet: { code: "25CF" }, color: NAVY, bold: true } })), {
    x: 1.0, y: 1.5, w: 11, h: 5,
    fontSize: 22, fontFace: "Calibri",
    paraSpaceAfter: 8
  });
  addFooter(s, 2);
}

// ============================================================
// Slide 3 — Удиртгал
// ============================================================
{
  const s = pres.addSlide();
  addHeader(s);
  addTitle(s, "Удиртгал");

  s.addText([
    { text: "Соёлын өв", options: { bold: true, color: NAVY } },
    { text: " нь үндэстний түүх, соёлыг илэрхийлэх биет ба биет бус үнэт зүйлс юм.\n\n", options: { color: TEXT } },
    { text: "Монголд ", options: { color: TEXT } },
    { text: "хадны зураг, чулуун хөшөө, бичээс", options: { color: NAVY, bold: true } },
    { text: " зэрэг олон төрлийн дурсгалууд алслагдсан газарт байрладаг.\n\n", options: { color: TEXT } },
    { text: "Бодит газарт очиж үзэх боломж хязгаарлагдмал учир ", options: { color: TEXT } },
    { text: "3D технологи болон веб орчинд хүртээмжтэй болгох шаардлага ", options: { color: ACCENT, bold: true } },
    { text: "үүсэв.", options: { color: TEXT } }
  ], {
    x: 0.7, y: 1.5, w: 12, h: 5,
    fontSize: 20, fontFace: "Calibri", paraSpaceAfter: 10
  });
  addFooter(s, 3);
}

// ============================================================
// Slide 4 — Зорилго, зорилт
// ============================================================
{
  const s = pres.addSlide();
  addHeader(s);
  addTitle(s, "Зорилго, зорилт");

  s.addText("Зорилго:", {
    x: 0.7, y: 1.3, w: 12, h: 0.4,
    fontSize: 20, color: ACCENT, bold: true
  });
  s.addText(
    "Монгол орны түүхэн олдворуудын мэдээлэл, зураг болон 3D загварыг нэгтгэн харуулах, газрын зураг бүхий интерактив веб платформ бүтээх.",
    {
      x: 0.7, y: 1.7, w: 12, h: 0.9,
      fontSize: 17, color: TEXT, fontFace: "Calibri"
    }
  );

  s.addText("Зорилт:", {
    x: 0.7, y: 2.9, w: 12, h: 0.4,
    fontSize: 20, color: ACCENT, bold: true
  });
  const tasks = [
    "Түүхэн олдворыг олон шалгуураар хайх боломж олгох",
    "3D загварыг интерактив байдлаар (эргүүлэх, томруулах) үзүүлэх",
    "Олдворын байршлыг газрын зураг дээр харуулах",
    "Судлаачийн оруулсан мэдээллийг админ баталгаажуулах урсгал",
    "Photogrammetry эх өгөгдлийн чанарыг автоматаар шалгах Reconstruction Lab модуль"
  ];
  s.addText(tasks.map((t) => ({ text: t, options: { bullet: { code: "25CF" }, color: TEXT } })), {
    x: 0.9, y: 3.3, w: 11.8, h: 3,
    fontSize: 17, fontFace: "Calibri", paraSpaceAfter: 6
  });
  addFooter(s, 4);
}

// ============================================================
// Slide 5 — Систем хөгжүүлэх үндэслэл
// ============================================================
{
  const s = pres.addSlide();
  addHeader(s);
  addTitle(s, "Систем хөгжүүлэх үндэслэл");

  s.addText([
    { text: "Google Forms судалгаа: ", options: { bold: true, color: NAVY } },
    { text: "61 оролцогч (оюутан, судлаач, музейн ажилтан)\n\n", options: { color: TEXT } },
    { text: "Музейн мэргэжилтэнтэй ", options: { color: TEXT } },
    { text: "ярилцлага", options: { bold: true, color: NAVY } },
    { text: " — албан зөвшөөрөл, баталгаажуулалт шаардлагатай", options: { color: TEXT } }
  ], {
    x: 0.7, y: 1.4, w: 6.5, h: 2,
    fontSize: 16, fontFace: "Calibri", paraSpaceAfter: 4
  });

  // Big stat numbers
  const stats = [
    { num: "100%", label: "3D дүрслэлд сонирхолтой", y: 3.6 },
    { num: "95%+", label: "олон шалгуурт хайлт чухал", y: 4.4 },
    { num: "100%", label: "газрын зураг + баталгаатай эх сурвалж", y: 5.2 }
  ];
  for (const stat of stats) {
    s.addText(stat.num, {
      x: 0.7, y: stat.y, w: 1.5, h: 0.6,
      fontSize: 28, color: ACCENT, bold: true, align: "left"
    });
    s.addText(stat.label, {
      x: 2.3, y: stat.y + 0.1, w: 5, h: 0.5,
      fontSize: 16, color: TEXT, fontFace: "Calibri"
    });
  }

  // Try to add chart image
  tryImage(s, "Chart/5.png", { x: 8.0, y: 1.4, w: 4.5, h: 3.0 });
  tryImage(s, "Chart/6.png", { x: 8.0, y: 4.5, w: 4.5, h: 2.3 });

  addFooter(s, 5);
}

// ============================================================
// Slide 6 — Ижил төстэй системийн судалгаа
// ============================================================
{
  const s = pres.addSlide();
  addHeader(s);
  addTitle(s, "Ижил төстэй системийн судалгаа");

  const rows = [
    [
      { text: "Систем", options: { bold: true, color: BG, fill: NAVY, align: "left" } },
      { text: "3D", options: { bold: true, color: BG, fill: NAVY, align: "center" } },
      { text: "Хайлт", options: { bold: true, color: BG, fill: NAVY, align: "center" } },
      { text: "Газрын зураг", options: { bold: true, color: BG, fill: NAVY, align: "center" } },
      { text: "Баталгаажуулалт", options: { bold: true, color: BG, fill: NAVY, align: "center" } },
      { text: "MN хэл", options: { bold: true, color: BG, fill: NAVY, align: "center" } }
    ],
    ["Google Arts & Culture", "Хэсэгчлэн", "Тийм", "Тийм", "Тийм", "Үгүй"],
    ["Sketchfab", "Тийм", "Тийм", "Үгүй", "Үгүй", "Үгүй"],
    ["Smithsonian 3D", "Тийм", "Хязгаарлагдмал", "Үгүй", "Тийм", "Үгүй"],
    ["CyArk", "Тийм", "Үгүй", "Тийм", "Тийм", "Үгүй"],
    ["Mongoltoli", "Үгүй", "Тийм", "Үгүй", "Тийм", "Тийм"],
    [
      { text: "Бидний систем", options: { bold: true, color: ACCENT } },
      { text: "Тийм", options: { bold: true, color: ACCENT } },
      { text: "Тийм", options: { bold: true, color: ACCENT } },
      { text: "Тийм", options: { bold: true, color: ACCENT } },
      { text: "Тийм", options: { bold: true, color: ACCENT } },
      { text: "Тийм", options: { bold: true, color: ACCENT } }
    ]
  ];
  s.addTable(rows, {
    x: 0.5, y: 1.5, w: 12.3, h: 4.5,
    fontSize: 14, fontFace: "Calibri",
    border: { type: "solid", color: "DDDDDD", pt: 0.5 },
    align: "center", valign: "middle"
  });
  addFooter(s, 6);
}

// ============================================================
// Slide 7 — Ашиглагдсан технологи
// ============================================================
{
  const s = pres.addSlide();
  addHeader(s);
  addTitle(s, "Ашиглагдсан технологи");

  const cols = [
    {
      title: "Frontend",
      x: 0.7,
      items: ["React.js + Vite", "Three.js (3D viewer)", "Leaflet (газрын зураг)", "React Router"]
    },
    {
      title: "Backend",
      x: 5.0,
      items: ["Node.js + Express", "Multer (file upload)", "Sharp + Laplacian", "Helmet, Zod, scrypt", "Resend / Nodemailer"]
    },
    {
      title: "Database / Tools",
      x: 9.3,
      items: ["PostgreSQL + PostGIS", "GiST индекс", "Meshroom / RealityCapture", "Blender (mesh cleanup)"]
    }
  ];
  for (const col of cols) {
    s.addText(col.title, {
      x: col.x, y: 1.4, w: 3.8, h: 0.5,
      fontSize: 20, color: ACCENT, bold: true
    });
    s.addText(col.items.map((t) => ({ text: t, options: { bullet: { code: "25CF" }, color: TEXT } })), {
      x: col.x, y: 1.9, w: 3.8, h: 4.5,
      fontSize: 16, fontFace: "Calibri", paraSpaceAfter: 8
    });
  }
  addFooter(s, 7);
}

// ============================================================
// Slide 8 — Архитектур
// ============================================================
{
  const s = pres.addSlide();
  addHeader(s);
  addTitle(s, "Системийн архитектур");

  s.addText([
    { text: "Үзүүлэлтийн давхарга\n", options: { bold: true, color: NAVY } },
    { text: "React.js + Three.js + Leaflet\n\n", options: { color: TEXT, fontSize: 14 } },
    { text: "Хэрэглээний давхарга\n", options: { bold: true, color: NAVY } },
    { text: "Express (Auth, Artifact, Map, Recon Lab)\n\n", options: { color: TEXT, fontSize: 14 } },
    { text: "Өгөгдлийн давхарга\n", options: { bold: true, color: NAVY } },
    { text: "PostgreSQL + PostGIS + локал файл", options: { color: TEXT, fontSize: 14 } }
  ], {
    x: 0.7, y: 1.5, w: 4.5, h: 5,
    fontSize: 17, fontFace: "Calibri", paraSpaceAfter: 4
  });

  tryImage(s, "chapter3/architecture.png", { x: 5.5, y: 1.4, w: 7.3, h: 5.2 });
  addFooter(s, 8);
}

// ============================================================
// Slide 9 — Юзкейс диаграмм
// ============================================================
{
  const s = pres.addSlide();
  addHeader(s);
  addTitle(s, "Юзкейс диаграмм");

  s.addText([
    { text: "3 актор:\n", options: { bold: true, color: NAVY } },
    { text: "• Зочин хэрэглэгч\n• Судлаач\n• Администратор\n\n", options: { color: TEXT } },
    { text: "Нийт 12 юзкейс\n\n", options: { bold: true, color: NAVY } },
    { text: "Үндсэн: хайх, дэлгэрэнгүй үзэх, бүртгүүлэх, олдвор үүсгэх, илгээх, баталгаажуулах", options: { color: TEXT, fontSize: 14 } }
  ], {
    x: 0.7, y: 1.5, w: 4, h: 5,
    fontSize: 17, fontFace: "Calibri", paraSpaceAfter: 4
  });

  tryImage(s, "chapter2/Level 1.png", { x: 5.0, y: 1.4, w: 7.8, h: 5.2 });
  addFooter(s, 9);
}

// ============================================================
// Slide 10 — Класс диаграмм
// ============================================================
{
  const s = pres.addSlide();
  addHeader(s);
  addTitle(s, "Класс диаграмм");

  tryImage(s, "chapter3/Class Diagram.png", { x: 0.5, y: 1.4, w: 12.3, h: 4.7 });

  s.addText([
    { text: "User → Researcher/Admin наследлэг • Artifact+Location+MediaFile composition • PhotoSet+PhotoImage+ReconstructionJob (Recon Lab) • NEW→PENDING→APPROVED/REJECTED", options: { color: TEXT } }
  ], {
    x: 0.5, y: 6.2, w: 12.3, h: 0.7,
    fontSize: 12, fontFace: "Calibri", color: TEXT, italic: true, align: "center"
  });
  addFooter(s, 10);
}

// ============================================================
// Slide 11 — Үйл ажиллагааны диаграмм
// ============================================================
{
  const s = pres.addSlide();
  addHeader(s);
  addTitle(s, "Үйл ажиллагааны диаграмм");

  s.addText([
    { text: "3 swimlane:\n", options: { bold: true, color: NAVY } },
    { text: "• Судлаач\n• Систем\n• Админ\n\n", options: { color: TEXT } },
    { text: "Гол урсгал:\n", options: { bold: true, color: NAVY } },
    { text: "Судлаач мэдээлэл оруулна → Систем validation → PENDING → Админ хянана → APPROVED эсвэл REJECTED (шалтгаан заавал)", options: { color: TEXT, fontSize: 14 } }
  ], {
    x: 0.7, y: 1.5, w: 4.5, h: 5,
    fontSize: 17, fontFace: "Calibri", paraSpaceAfter: 4
  });

  tryImage(s, "chapter2/Activity.png", { x: 5.5, y: 1.4, w: 7.3, h: 5.2 });
  addFooter(s, 11);
}

// ============================================================
// Slide 12 — Дарааллын диаграмм
// ============================================================
{
  const s = pres.addSlide();
  addHeader(s);
  addTitle(s, "Дарааллын диаграмм — Хайлт ба дэлгэрэнгүй");

  tryImage(s, "chapter3/Search view.png", { x: 0.5, y: 1.4, w: 12.3, h: 5 });

  s.addText("Controller → Service → DB → үр дүнг буцаах. PostGIS ST_Distance-ээр газарзүйн эрэмбэлэлт.", {
    x: 0.5, y: 6.5, w: 12.3, h: 0.4,
    fontSize: 13, color: TEXT, italic: true, align: "center"
  });
  addFooter(s, 12);
}

// ============================================================
// Slide 13 — Өгөгдлийн сангийн схем
// ============================================================
{
  const s = pres.addSlide();
  addHeader(s);
  addTitle(s, "Өгөгдлийн сангийн схем (ERD)");

  tryImage(s, "chapter3/ERD.png", { x: 0.5, y: 1.4, w: 8.5, h: 5.3 });

  s.addText([
    { text: "10 хүснэгт · 3 бүлэг\n\n", options: { bold: true, color: NAVY, fontSize: 18 } },
    { text: "• Хэрэглэгч/токены (4)\n• Олдвор/байршил/медиа (3)\n• Зургийн багц/боловсруулалт (3)\n\n", options: { color: TEXT } },
    { text: "PostGIS:\n", options: { bold: true, color: NAVY } },
    { text: "geography(POINT, 4326) + GiST индекс\n\n", options: { color: TEXT } },
    { text: "ON DELETE CASCADE", options: { bold: true, color: ACCENT } }
  ], {
    x: 9.2, y: 1.5, w: 3.6, h: 5,
    fontSize: 14, fontFace: "Calibri", paraSpaceAfter: 4
  });
  addFooter(s, 13);
}

// ============================================================
// Slide 14 — Дүгнэлт
// ============================================================
{
  const s = pres.addSlide();
  addHeader(s);
  addTitle(s, "Дүгнэлт");

  s.addText("Хийсэн ажил:", {
    x: 0.7, y: 1.3, w: 12, h: 0.5,
    fontSize: 20, color: ACCENT, bold: true
  });
  const done = [
    "18 функцийн / 12 функцийн бус шаардлагыг бүрэн хэрэгжүүлсэн",
    "3D viewer + Leaflet газрын зураг + Sharp/Laplacian зургийн чанарын автомат шалгалт",
    "httpOnly cookie, scrypt, helmet, zod, RBAC, имэйл verify, нууц үг сэргээх",
    "Олдвор үүсгэх → админ баталгаажуулах урсгал бүрэн ажиллана"
  ];
  s.addText(done.map((t) => ({ text: t, options: { bullet: { code: "25CF" }, color: TEXT } })), {
    x: 0.9, y: 1.8, w: 11.8, h: 2.2,
    fontSize: 15, fontFace: "Calibri", paraSpaceAfter: 4
  });

  s.addText("Цаашдын ажил:", {
    x: 0.7, y: 4.2, w: 12, h: 0.5,
    fontSize: 20, color: ACCENT, bold: true
  });
  const future = [
    "Илүү олон төрлийн олдвор хамруулах",
    "Photogrammetry боловсруулалтыг сервер дээр автоматжуулах (COLMAP integration)",
    "Файл хадгалалтыг cloud руу шилжүүлэх (AWS S3 г.м.)",
    "Penetration test болон гүйцэтгэлийн benchmark"
  ];
  s.addText(future.map((t) => ({ text: t, options: { bullet: { code: "25CF" }, color: TEXT } })), {
    x: 0.9, y: 4.7, w: 11.8, h: 2.2,
    fontSize: 15, fontFace: "Calibri", paraSpaceAfter: 4
  });
  addFooter(s, 14);
}

// ============================================================
// Slide 15 — Ашигласан материал
// ============================================================
{
  const s = pres.addSlide();
  addHeader(s);
  addTitle(s, "Ашигласан материал");

  const refs = [
    "UNESCO. Recommendation Concerning the Protection of Museums. 2018",
    "Remondino, F. Heritage Recording and 3D Modeling with Photogrammetry. 2014",
    "Three.js, React.js, Node.js албан ёсны баримтбичиг",
    "PostgreSQL + PostGIS албан ёсны баримтбичиг",
    "Google Arts & Culture · https://artsandculture.google.com",
    "Sketchfab · https://sketchfab.com",
    "Smithsonian 3D · https://3d.si.edu",
    "CyArk Open Heritage 3D · https://openheritage3d.org",
    "Mongoltoli · https://mongoltoli.mn"
  ];
  s.addText(refs.map((t, i) => ({ text: `[${i + 1}] ${t}`, options: { color: TEXT } })), {
    x: 0.7, y: 1.5, w: 12, h: 5,
    fontSize: 14, fontFace: "Calibri", paraSpaceAfter: 6
  });
  addFooter(s, 15);
}

// ============================================================
// Slide 16 — Анхаарал тавьсанд баярлалаа
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: "F4F4F5" };
  s.addText("Анхаарал тавьсанд\nбаярлалаа", {
    x: 1.0, y: 2.2, w: 11.3, h: 2.5,
    fontSize: 60, fontFace: "Calibri", color: NAVY, bold: true,
    align: "center"
  });
  s.addShape("line", {
    x: 9.5, y: 3.5, w: 3.0, h: 0,
    line: { color: NAVY, width: 4 }
  });
  s.addText("Дараа нь системийн live demo үргэлжлүүлнэ", {
    x: 1.0, y: 5.5, w: 11.3, h: 0.5,
    fontSize: 16, color: MUTED, align: "center", italic: true
  });
}

// ============================================================
// Save
// ============================================================
const outputPath = path.resolve(process.cwd(), "../DIPLOM__1_/Defense-presentation.pptx");
await pres.writeFile({ fileName: outputPath });
console.log("✓ Presentation saved:", outputPath);
