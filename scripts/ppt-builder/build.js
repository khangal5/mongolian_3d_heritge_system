// Diploma defense PPT generator
// Outputs: D:/diplom/DIPLOM__1_/3D-Mongol-Heritage-Web-System-v2.pptx

const PptxGenJS = require("pptxgenjs");
const path = require("path");
const fs = require("fs");

const FIG = path.resolve(__dirname, "..", "..", "DIPLOM__1_", "Figures");
const OUT = path.resolve(__dirname, "..", "..", "DIPLOM__1_", "3D-Mongol-Heritage-Web-System-v2.pptx");

// MUST brand colors (dark blue + gold accent)
const C = {
  navy: "0B2545",
  blue: "13315C",
  azure: "1E4D8C",
  light: "F0F4FA",
  white: "FFFFFF",
  gold: "C49B33",
  red: "B23A48",
  green: "2E7D32",
  textDark: "1A1A2E",
  textMuted: "5A6A85",
  border: "C8D2E2",
};

const FONT_TITLE = "Calibri";
const FONT_BODY = "Calibri";

const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 in
pptx.title = "3D Mongol Heritage Web System - Defense";
pptx.author = "N. Khangal";

// ---------- Master / template ----------
pptx.defineSlideMaster({
  title: "MAIN",
  background: { color: C.white },
  objects: [
    // left vertical band
    { rect: { x: 0, y: 0, w: 0.18, h: 7.5, fill: { color: C.navy } } },
    // bottom thin bar
    { rect: { x: 0, y: 7.35, w: 13.33, h: 0.15, fill: { color: C.gold } } },
    // footer text
    {
      text: {
        text: "ШУТИС  •  Компьютерын Ухааны Тэнхим  •  2026",
        options: {
          x: 0.4, y: 7.05, w: 9, h: 0.3,
          fontSize: 9, color: C.textMuted, fontFace: FONT_BODY,
        },
      },
    },
    // slide number
    {
      text: {
        text: "Slide ",
        options: {
          x: 12.3, y: 7.05, w: 0.6, h: 0.3,
          fontSize: 9, color: C.textMuted, fontFace: FONT_BODY, align: "right",
        },
      },
    },
    { sldNum: { x: 12.85, y: 7.05, w: 0.4, h: 0.3, fontSize: 9, color: C.textMuted, fontFace: FONT_BODY } },
  ],
});

// helper for section header bar
function sectionHeader(slide, title, kicker) {
  if (kicker) {
    slide.addText(kicker.toUpperCase(), {
      x: 0.5, y: 0.35, w: 12, h: 0.3,
      fontSize: 11, color: C.gold, bold: true, fontFace: FONT_BODY, charSpacing: 4,
    });
  }
  slide.addText(title, {
    x: 0.5, y: kicker ? 0.7 : 0.4, w: 12, h: 0.7,
    fontSize: 28, bold: true, color: C.navy, fontFace: FONT_TITLE,
  });
  // accent underline
  slide.addShape("rect", {
    x: 0.5, y: kicker ? 1.45 : 1.15, w: 1.2, h: 0.06, fill: { color: C.gold }, line: { type: "none" },
  });
}

function speakerNote(slide, text) {
  slide.addNotes(text);
}

function img(rel) {
  return path.join(FIG, rel);
}

// =====================================================
// Slide 1 — Cover
// =====================================================
{
  const s = pptx.addSlide(); // no master for cover
  s.background = { color: C.navy };

  // gold band on left
  s.addShape("rect", { x: 0, y: 0, w: 0.6, h: 7.5, fill: { color: C.gold }, line: { type: "none" } });
  // subtle right rectangle
  s.addShape("rect", { x: 9, y: 0, w: 4.33, h: 7.5, fill: { color: C.blue }, line: { type: "none" } });

  // MUST logo
  if (fs.existsSync(img("MUST_logo.png"))) {
    s.addImage({ path: img("MUST_logo.png"), x: 1.0, y: 0.5, w: 1.0, h: 1.0 });
  }

  s.addText("ШУТИС", {
    x: 2.2, y: 0.55, w: 6, h: 0.4, fontSize: 14, bold: true, color: C.white, fontFace: FONT_BODY, charSpacing: 4,
  });
  s.addText("Компьютерын Ухааны Тэнхим", {
    x: 2.2, y: 0.95, w: 6, h: 0.4, fontSize: 12, color: C.light, fontFace: FONT_BODY,
  });

  s.addText("ДИПЛОМЫН ХАМГААЛАЛТ", {
    x: 1.0, y: 2.2, w: 8.5, h: 0.4, fontSize: 12, bold: true, color: C.gold, fontFace: FONT_BODY, charSpacing: 6,
  });

  s.addText("Монголын түүхэн өвийг 3D интерактив\nхэлбэрээр харуулах веб системийн хөгжүүлэлт", {
    x: 1.0, y: 2.7, w: 8.5, h: 2.2, fontSize: 30, bold: true, color: C.white, fontFace: FONT_TITLE, lineSpacingMultiple: 1.1,
  });

  s.addShape("rect", { x: 1.0, y: 5.0, w: 1.2, h: 0.05, fill: { color: C.gold }, line: { type: "none" } });

  s.addText([
    { text: "Оюутан:  ", options: { color: C.light, fontSize: 14 } },
    { text: "Н. Хангал\n", options: { color: C.white, fontSize: 14, bold: true } },
    { text: "Удирдагч багш:  ", options: { color: C.light, fontSize: 14 } },
    { text: "Доктор (Ph.D) [НЭР]\n", options: { color: C.white, fontSize: 14 } },
    { text: "Зөвлөх багш:  ", options: { color: C.light, fontSize: 14 } },
    { text: "Магистр [НЭР]", options: { color: C.white, fontSize: 14 } },
  ], { x: 1.0, y: 5.2, w: 7.5, h: 1.6, fontFace: FONT_BODY, lineSpacingMultiple: 1.3 });

  s.addText("2026 оны 5 сар  •  Улаанбаатар", {
    x: 1.0, y: 6.85, w: 7, h: 0.3, fontSize: 11, color: C.gold, fontFace: FONT_BODY, italic: true,
  });

  // Right panel decoration
  s.addText("3D", {
    x: 9.5, y: 1.5, w: 3.5, h: 2.5, fontSize: 200, bold: true, color: C.azure, fontFace: FONT_TITLE, align: "center",
  });
  s.addText("INTERACTIVE\nWEB SYSTEM", {
    x: 9.5, y: 4.5, w: 3.5, h: 1.0, fontSize: 14, color: C.gold, bold: true, fontFace: FONT_BODY, align: "center", charSpacing: 4,
  });

  speakerNote(s, "Сайн байна уу. Миний дипломын ажлын сэдэв нь Монголын түүхэн өвийг 3D интерактив веб системээр үзүүлэх юм. Удирдагч багш Доктор [НЭР], зөвлөх багш Магистр [НЭР]. 5 минут илтгэлийг та бүхэнд танилцуулъя.");
}

// =====================================================
// Slide 2 — Agenda (4 sections)
// =====================================================
{
  const s = pptx.addSlide({ masterName: "MAIN" });
  sectionHeader(s, "Агуулга", "01  ·  Танилцуулга");

  const groups = [
    { num: "01", title: "Танилцуулга", items: ["Удиртгал", "Зорилго, зорилт", "Систем хөгжүүлэх үндэслэл", "Ижил төстэй системийн судалгаа"] },
    { num: "02", title: "Дизайн ба архитектур", items: ["Ашиглагдсан технологи", "Архитектур"] },
    { num: "03", title: "Загвар ба диаграммууд", items: ["Юзкейс диаграмм", "Класс диаграмм", "Үйл ажиллагааны диаграмм", "Дарааллын диаграмм", "Өгөгдлийн сангийн схем"] },
    { num: "04", title: "Дүгнэлт", items: ["Хийсэн ажил", "Цаашдын ажил"] },
  ];

  const colW = 2.95;
  const startX = 0.5;
  const y = 1.9;
  const h = 4.8;

  groups.forEach((g, i) => {
    const x = startX + i * (colW + 0.1);
    // card
    s.addShape("rect", { x, y, w: colW, h, fill: { color: C.light }, line: { color: C.border, width: 0.5 } });
    // top color band
    s.addShape("rect", { x, y, w: colW, h: 0.5, fill: { color: C.navy }, line: { type: "none" } });
    // big number
    s.addText(g.num, { x, y: 0.05 + y, w: colW, h: 0.4, fontSize: 18, bold: true, color: C.gold, fontFace: FONT_TITLE, align: "center" });
    // title
    s.addText(g.title, { x: x + 0.15, y: y + 0.65, w: colW - 0.3, h: 0.5, fontSize: 16, bold: true, color: C.navy, fontFace: FONT_TITLE });
    // items
    const bulletText = g.items.map(t => ({ text: t, options: { bullet: { code: "25CF" } } }));
    s.addText(bulletText, {
      x: x + 0.2, y: y + 1.25, w: colW - 0.35, h: h - 1.4,
      fontSize: 12, color: C.textDark, fontFace: FONT_BODY, paraSpaceAfter: 6,
    });
  });

  speakerNote(s, "Илтгэлийг дөрвөн хэсгээр бүтэцлэв: танилцуулга, дизайн ба архитектур, диаграмм дүрслэл, дүгнэлт. Эхний хэсэгт сэдвийн ерөнхий танилцуулга, дараа нь системийн техник дизайн, диаграммууд, эцэст нь үр дүн болон цаашдын төлөвлөгөөг танилцуулна.");
}

// =====================================================
// Slide 3 — Introduction
// =====================================================
{
  const s = pptx.addSlide({ masterName: "MAIN" });
  sectionHeader(s, "Удиртгал", "02  ·  Танилцуулга");

  const points = [
    "Соёлын өв нь үндэстний түүх, соёлыг илэрхийлэх биет ба биет бус үнэт зүйлс.",
    "Монголд хадны зураг, чулуун хөшөө, бичээс зэрэг олон төрлийн дурсгалууд алслагдсан газарт байрладаг.",
    "Бодит газарт очиж үзэх боломж хязгаарлагдмал → 3D технологиор веб орчинд хүргэх шаардлага үүсэв.",
  ];

  s.addText(points.map(p => ({ text: p, options: { bullet: { code: "25B8" }, paraSpaceAfter: 14 } })), {
    x: 0.5, y: 2.0, w: 7.0, h: 4.5,
    fontSize: 18, color: C.textDark, fontFace: FONT_BODY, lineSpacingMultiple: 1.3,
  });

  // right side image
  const introImg = img("chapter1/1.jpg");
  if (fs.existsSync(introImg)) {
    s.addImage({ path: introImg, x: 7.9, y: 2.0, w: 5.0, h: 4.0, sizing: { type: "cover", w: 5.0, h: 4.0 } });
  }

  // quote / takeaway
  s.addShape("rect", { x: 7.9, y: 6.2, w: 5.0, h: 0.7, fill: { color: C.navy }, line: { type: "none" } });
  s.addText("Хадгалах × Танилцуулах × Хүртээмжтэй болгох", {
    x: 7.9, y: 6.2, w: 5.0, h: 0.7, fontSize: 13, bold: true, color: C.white, fontFace: FONT_BODY, align: "center", valign: "middle",
  });

  speakerNote(s, "Соёлын өв нь үндэстний өвөрмөц шинж. Монгол улсын хувьд хадны зураг, чулуун хөшөө зэрэг олон дурсгал алслагдсан газарт байх тул бодитоор очиж үзэх боломж хязгаарлагдмал. Иймээс эдгээр өвийг 3D хэлбэрээр веб орчинд хүртээмжтэй болгох шаардлагатай гэж үзлээ.");
}

// =====================================================
// Slide 4 — Goal + Objectives + Recon Lab badge
// =====================================================
{
  const s = pptx.addSlide({ masterName: "MAIN" });
  sectionHeader(s, "Зорилго ба зорилт", "03  ·  Танилцуулга");

  // goal card
  s.addShape("rect", { x: 0.5, y: 1.9, w: 12.3, h: 1.2, fill: { color: C.navy }, line: { type: "none" } });
  s.addText("ЗОРИЛГО", { x: 0.7, y: 1.95, w: 2, h: 0.3, fontSize: 11, bold: true, color: C.gold, fontFace: FONT_BODY, charSpacing: 4 });
  s.addText(
    "Монгол орны түүхэн олдворуудын мэдээлэл, зураг болон 3D загварыг нэгтгэн харуулах, газрын зураг бүхий интерактив веб платформ бүтээх.",
    { x: 0.7, y: 2.25, w: 11.9, h: 0.85, fontSize: 14, color: C.white, fontFace: FONT_BODY, italic: true, valign: "top" }
  );

  // objectives header
  s.addText("ЗОРИЛТУУД", { x: 0.5, y: 3.3, w: 12, h: 0.3, fontSize: 11, bold: true, color: C.gold, fontFace: FONT_BODY, charSpacing: 4 });

  const obj = [
    "3D загварыг интерактив байдлаар үзэх, эргүүлэх, өнцгийг сольж, ойртуулах/холдуулах",
    "Олдворын байршлыг газрын зураг дээр харуулж газарзүйн мэдээллийг хүргэх",
    "Нэр, төрөл, он, байршил зэрэг олон шалгуурт хайлт олгох",
    "Олдворын түүх, гарал үүсэл, зураг, тайлбар бүхий дэлгэрэнгүй харуулах",
    "Судлаачийн оруулсан мэдээллийг админ баталгаажуулах урсгал",
    "Олдворын мэдээлэл, зураг, 3D загварыг өгөгдлийн санд хадгалах, удирдах",
  ];

  // two columns of objectives
  obj.forEach((t, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.5 + col * 6.15;
    const y = 3.7 + row * 0.7;
    // number badge
    s.addShape("ellipse", { x, y, w: 0.45, h: 0.45, fill: { color: C.gold }, line: { type: "none" } });
    s.addText(String(i + 1), { x, y, w: 0.45, h: 0.45, fontSize: 14, bold: true, color: C.white, fontFace: FONT_TITLE, align: "center", valign: "middle" });
    s.addText(t, { x: x + 0.55, y, w: 5.5, h: 0.6, fontSize: 12, color: C.textDark, fontFace: FONT_BODY, valign: "middle" });
  });

  // Recon Lab bonus badge
  s.addShape("rect", { x: 0.5, y: 6.5, w: 12.3, h: 0.5, fill: { color: C.gold }, line: { type: "none" } });
  s.addText("✦ НЭМЭЛТ ОНЦЛОГ: Reconstruction Lab — photogrammetry эх зургийн чанарыг Sharp + Laplacian variance аргаар автоматаар үнэлэх модуль", {
    x: 0.5, y: 6.5, w: 12.3, h: 0.5, fontSize: 12, bold: true, color: C.navy, fontFace: FONT_BODY, align: "center", valign: "middle",
  });

  speakerNote(s, "Зорилго нь Монгол орны түүхэн олдворуудыг 3D-р харуулах, газрын зурагтай интерактив платформ бүтээх явдал. Зорилгод хүрэхийн тулд 6 зорилт дэвшүүлсэн: 3D дүрслэл, газрын зураг, олон шалгуурт хайлт, дэлгэрэнгүй мэдээлэл, админ баталгаажуулалт болон өгөгдлийн санд удирдах. Үүнээс гадна эх зургийн чанарыг автоматаар үнэлэх Reconstruction Lab модулийг нэмэлт онцлог болгон хөгжүүлсэн.");
}

// =====================================================
// Slide 5 — Survey rationale
// =====================================================
{
  const s = pptx.addSlide({ masterName: "MAIN" });
  sectionHeader(s, "Систем хөгжүүлэх үндэслэл", "04  ·  Танилцуулга");

  // left: methodology
  s.addText("Судалгааны арга", { x: 0.5, y: 1.9, w: 6, h: 0.4, fontSize: 14, bold: true, color: C.navy, fontFace: FONT_TITLE });
  const methodItems = [
    { icon: "👥", text: "61 оролцогчтой Google Forms судалгаа" },
    { icon: "🏛", text: "Музейн мэргэжилтэнтэй ярилцлага" },
    { icon: "📊", text: "Үндсэн санал, зөвлөмжийг тогтоосон" },
  ];
  methodItems.forEach((m, i) => {
    const y = 2.4 + i * 0.7;
    s.addShape("rect", { x: 0.5, y, w: 6.0, h: 0.55, fill: { color: C.light }, line: { color: C.border, width: 0.5 } });
    s.addText(m.icon, { x: 0.55, y, w: 0.6, h: 0.55, fontSize: 20, align: "center", valign: "middle" });
    s.addText(m.text, { x: 1.2, y, w: 5.2, h: 0.55, fontSize: 13, color: C.textDark, fontFace: FONT_BODY, valign: "middle" });
  });

  // bottom-left takeaway
  s.addShape("rect", { x: 0.5, y: 4.8, w: 6, h: 1.9, fill: { color: C.navy }, line: { type: "none" } });
  s.addText("ҮНДСЭН ДҮГНЭЛТ", { x: 0.7, y: 4.95, w: 5.6, h: 0.3, fontSize: 10, bold: true, color: C.gold, fontFace: FONT_BODY, charSpacing: 4 });
  s.addText("3D дүрслэл, газрын зураг, олон шалгуурт хайлт, баталгаатай эх сурвалж — эдгээр нь системийн үндсэн шаардлага болж тогтсон.", {
    x: 0.7, y: 5.25, w: 5.6, h: 1.4, fontSize: 13, color: C.white, fontFace: FONT_BODY, italic: true, valign: "top",
  });

  // right: 4 stat cards (gauges)
  const stats = [
    { val: "100%", label: "3D дүрслэлээр түүхэн олдворыг харах сонирхолтой" },
    { val: "95.2%", label: "Олон шалгуурт хайлт чухал" },
    { val: "100%", label: "Олдворын байршлыг газрын зураг дээр харах хэрэгцээтэй" },
    { val: "100%", label: "Баталгаатай эх сурвалжтай мэдээллийг чухалчилдаг" },
  ];
  stats.forEach((st, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 7.0 + col * 3.0;
    const y = 1.95 + row * 2.45;
    s.addShape("rect", { x, y, w: 2.8, h: 2.25, fill: { color: C.white }, line: { color: C.gold, width: 2 } });
    s.addText(st.val, { x, y: y + 0.2, w: 2.8, h: 0.9, fontSize: 36, bold: true, color: C.gold, fontFace: FONT_TITLE, align: "center" });
    s.addShape("rect", { x: x + 1.0, y: y + 1.15, w: 0.8, h: 0.04, fill: { color: C.navy }, line: { type: "none" } });
    s.addText(st.label, { x: x + 0.15, y: y + 1.25, w: 2.5, h: 0.95, fontSize: 11, color: C.textDark, fontFace: FONT_BODY, align: "center", valign: "top" });
  });

  speakerNote(s, "Хэрэглэгчийн судалгаагаар 61 оролцогчоос 100% нь 3D дүрслэл болон газрын зураг ашиглахыг чухалчилсан. 95%-аас дээш нь олон шалгуурт хайлтыг шаардлагатай гэж үзсэн. Эдгээр нь системийн үндсэн функцуудыг тогтооход тулгуурлав.");
}

// =====================================================
// Slide 6 — Comparison table
// =====================================================
{
  const s = pptx.addSlide({ masterName: "MAIN" });
  sectionHeader(s, "Ижил төстэй системийн судалгаа", "05  ·  Танилцуулга");

  const rows = [
    ["Систем", "3D", "Хайлт", "Газрын зураг", "Баталгаажуулалт", "MN хэл"],
    ["Google Arts & Culture", "Хэсэгчлэн", "Тийм", "Тийм", "Тийм", "Үгүй"],
    ["Sketchfab", "Тийм", "Тийм", "Үгүй", "Үгүй", "Үгүй"],
    ["Smithsonian 3D", "Тийм", "Хязгаарлагдмал", "Үгүй", "Тийм", "Үгүй"],
    ["CyArk", "Тийм", "Үгүй", "Тийм", "Тийм", "Үгүй"],
    ["Mongoltoli", "Үгүй", "Тийм", "Үгүй", "Тийм", "Тийм"],
    ["Бидний систем", "Тийм", "Тийм", "Тийм", "Тийм", "Тийм"],
  ];

  function cell(text, opts = {}) {
    return {
      text,
      options: {
        fontSize: opts.size || 12,
        color: opts.color || C.textDark,
        bold: opts.bold || false,
        fill: { color: opts.fill || C.white },
        align: opts.align || "center",
        valign: "middle",
        fontFace: FONT_BODY,
      },
    };
  }

  const tableData = rows.map((r, idx) => {
    if (idx === 0) {
      return r.map(t => cell(t, { color: C.white, fill: C.navy, bold: true, size: 13 }));
    }
    const isOurs = r[0] === "Бидний систем";
    return r.map((t, ci) => {
      let fill = idx % 2 === 0 ? C.light : C.white;
      let color = C.textDark;
      let bold = false;
      if (isOurs) {
        fill = C.gold;
        color = C.navy;
        bold = true;
      } else if (ci > 0) {
        if (t === "Тийм") color = C.green;
        else if (t === "Үгүй") color = C.red;
        else color = C.textMuted;
      }
      return cell(t, { fill, color, bold, align: ci === 0 ? "left" : "center" });
    });
  });

  s.addTable(tableData, {
    x: 0.5, y: 1.9, w: 12.3, h: 4.5,
    colW: [3.3, 1.6, 2.0, 1.9, 2.2, 1.3],
    border: { type: "solid", color: C.border, pt: 0.5 },
  });

  // bottom takeaway
  s.addShape("rect", { x: 0.5, y: 6.6, w: 12.3, h: 0.55, fill: { color: C.navy }, line: { type: "none" } });
  s.addText("Гадаадын платформ 3D-д хүчтэй боловч баталгаажуулалт ба монгол хэл дутагдалтай. Бидний систем энэ зөрүүг бөглөв.", {
    x: 0.5, y: 6.6, w: 12.3, h: 0.55, fontSize: 12, color: C.white, italic: true, fontFace: FONT_BODY, align: "center", valign: "middle",
  });

  speakerNote(s, "Гадаадын Google Arts, Sketchfab, Smithsonian, CyArk нь 3D дүрслэлд хүчтэй ч мэдээллийн удирдлага бага. Дотоодын Mongoltoli нь баталгаатай мэдээлэлтэй ч 3D-гүй. Бидний систем энэ гол зөрүүг бөглөж бүх шинж чанараар давамгайлсан цогц шийдэл болов.");
}

// =====================================================
// Slide 7 — Technology stack (4 columns)
// =====================================================
{
  const s = pptx.addSlide({ masterName: "MAIN" });
  sectionHeader(s, "Ашиглагдсан технологи", "06  ·  Дизайн ба архитектур");

  const cols = [
    { title: "Frontend", color: C.azure, items: ["React.js + Vite", "Three.js (3D viewer)", "Leaflet (газрын зураг)", "React Router"] },
    { title: "Backend", color: C.blue, items: ["Node.js + Express", "Multer (file upload, 150MB)", "Sharp + Laplacian variance", "Resend / Nodemailer", "Background worker queue"] },
    { title: "Security", color: C.red, items: ["httpOnly + SameSite cookie", "scrypt password hash", "SHA-256 session token", "Helmet (HTTP headers)", "Zod (input validation)", "Email verify + 1h token"] },
    { title: "Database & 3D", color: C.green, items: ["PostgreSQL + PostGIS", "geography(POINT, 4326)", "GiST индекс", "ON DELETE CASCADE", "Meshroom / RealityCapture", "Blender (mesh cleanup)"] },
  ];

  const colW = 2.95;
  cols.forEach((c, i) => {
    const x = 0.5 + i * (colW + 0.1);
    const y = 1.9;
    const h = 4.7;
    // card
    s.addShape("rect", { x, y, w: colW, h, fill: { color: C.white }, line: { color: C.border, width: 0.5 } });
    // top bar
    s.addShape("rect", { x, y, w: colW, h: 0.55, fill: { color: c.color }, line: { type: "none" } });
    s.addText(c.title, { x, y, w: colW, h: 0.55, fontSize: 16, bold: true, color: C.white, fontFace: FONT_TITLE, align: "center", valign: "middle" });

    const bulletText = c.items.map(t => ({ text: t, options: { bullet: { code: "25B8" } } }));
    s.addText(bulletText, {
      x: x + 0.15, y: y + 0.7, w: colW - 0.3, h: h - 0.85,
      fontSize: 11, color: C.textDark, fontFace: FONT_BODY, paraSpaceAfter: 4,
    });
  });

  // bottom logo strip
  s.addText("React  ·  Vite  ·  Three.js  ·  Leaflet  ·  Node.js  ·  Express  ·  PostgreSQL  ·  PostGIS  ·  Meshroom  ·  Blender", {
    x: 0.5, y: 6.7, w: 12.3, h: 0.4, fontSize: 11, color: C.textMuted, fontFace: FONT_BODY, italic: true, align: "center",
  });

  speakerNote(s, "Frontend-д React, Three.js, Leaflet ашигласан. Backend нь Express дээр Sharp ашиглан зургийн чанарыг Laplacian variance аргаар автомат үнэлнэ. Аюулгүй байдлыг scrypt, httpOnly cookie, Helmet, Zod механизмууд бүрдүүлнэ. Өгөгдлийн санд PostGIS-ийн geography төрөл болон GiST индекс газарзүйн хайлтыг хурдасгана. 3D загварыг Meshroom-аар үүсгэж Blender-ээр цэвэрлэсэн.");
}

// =====================================================
// Slide 8 — Architecture
// =====================================================
{
  const s = pptx.addSlide({ masterName: "MAIN" });
  sectionHeader(s, "Архитектур", "07  ·  Дизайн ба архитектур");

  // left: 3-layer diagram (drawn)
  const layers = [
    { title: "Үзүүлэлтийн давхарга", sub: "React  ·  Three.js  ·  Leaflet", color: C.azure },
    { title: "Хэрэглээний давхарга", sub: "Express  ·  Auth · Artifact · Map · Recon Lab", color: C.blue },
    { title: "Өгөгдлийн давхарга", sub: "PostgreSQL + PostGIS  ·  Local file storage", color: C.navy },
  ];
  layers.forEach((l, i) => {
    const y = 2.1 + i * 1.45;
    s.addShape("rect", { x: 0.6, y, w: 6.2, h: 1.25, fill: { color: l.color }, line: { type: "none" } });
    s.addText(l.title, { x: 0.8, y: y + 0.15, w: 5.8, h: 0.45, fontSize: 16, bold: true, color: C.white, fontFace: FONT_TITLE });
    s.addText(l.sub, { x: 0.8, y: y + 0.65, w: 5.8, h: 0.5, fontSize: 12, color: C.light, fontFace: FONT_BODY });
    if (i < 2) {
      // arrow down
      s.addText("⇅", { x: 3.5, y: y + 1.2, w: 0.4, h: 0.3, fontSize: 18, color: C.gold, align: "center" });
    }
  });

  // right: description
  s.addText("Гурван давхаргат архитектур", { x: 7.2, y: 2.1, w: 5.6, h: 0.5, fontSize: 18, bold: true, color: C.navy, fontFace: FONT_TITLE });
  s.addShape("rect", { x: 7.2, y: 2.65, w: 0.6, h: 0.04, fill: { color: C.gold }, line: { type: "none" } });

  const desc = [
    "Client-server зарчмаар бүтсэн.",
    "Үзүүлэлтийн давхарга — хэрэглэгчтэй харьцана.",
    "Хэрэглээний давхарга — бизнес логик, аюулгүй байдал.",
    "Өгөгдлийн давхарга — PostGIS-аар газарзүйн хайлт.",
  ];
  s.addText(desc.map(t => ({ text: t, options: { bullet: { code: "25B8" }, paraSpaceAfter: 8 } })), {
    x: 7.2, y: 2.85, w: 5.6, h: 3.5, fontSize: 13, color: C.textDark, fontFace: FONT_BODY, lineSpacingMultiple: 1.3,
  });

  // architecture image hint if exists
  const archImg = img("chapter3/architecture.png");
  if (fs.existsSync(archImg)) {
    // not embedding to keep slide clean — fits side-by-side already
  }

  speakerNote(s, "Систем нь client-server зарчмаар гурван давхаргат архитектураар бүтсэн. React.js дээр суурилсан үзүүлэлтийн давхарга нь хэрэглэгчтэй харьцана, Express backend нь бизнес логикийг хариуцна, PostgreSQL + PostGIS бүхий өгөгдлийн давхарга нь газарзүйн хайлтыг хурдан гүйцэтгэнэ.");
}

// =====================================================
// Slide 9 — Use Case Diagram
// =====================================================
{
  const s = pptx.addSlide({ masterName: "MAIN" });
  sectionHeader(s, "Юзкейс диаграмм", "08  ·  Загвар ба диаграммууд");

  // left: 3 actor cards
  const actors = [
    { name: "Зочин", color: C.azure, cases: ["Хайх", "Дэлгэрэнгүй үзэх", "Бүртгүүлэх"] },
    { name: "Судлаач", color: C.blue, cases: ["Олдвор үүсгэх", "Засварлах", "Илгээх (PENDING)"] },
    { name: "Админ", color: C.navy, cases: ["Хянах", "Баталгаажуулах", "Татгалзах (reject_note)"] },
  ];
  actors.forEach((a, i) => {
    const y = 1.9 + i * 1.55;
    s.addShape("rect", { x: 0.5, y, w: 5.5, h: 1.35, fill: { color: C.white }, line: { color: C.border, width: 0.5 } });
    s.addShape("rect", { x: 0.5, y, w: 0.15, h: 1.35, fill: { color: a.color }, line: { type: "none" } });
    s.addText(a.name, { x: 0.85, y: y + 0.1, w: 4.5, h: 0.5, fontSize: 18, bold: true, color: a.color, fontFace: FONT_TITLE });
    s.addText(a.cases.join("  ·  "), { x: 0.85, y: y + 0.7, w: 5.0, h: 0.6, fontSize: 12, color: C.textDark, fontFace: FONT_BODY });
  });

  // right: state machine
  s.addText("Олдворын төлвийн шилжилт", { x: 6.4, y: 1.9, w: 6.5, h: 0.5, fontSize: 14, bold: true, color: C.navy, fontFace: FONT_TITLE });

  const states = [
    { label: "NEW", color: C.textMuted, x: 6.5, y: 2.6 },
    { label: "PENDING", color: C.gold, x: 8.6, y: 2.6 },
    { label: "APPROVED", color: C.green, x: 10.7, y: 1.95 },
    { label: "REJECTED", color: C.red, x: 10.7, y: 3.25 },
  ];
  states.forEach(st => {
    s.addShape("roundRect", { x: st.x, y: st.y, w: 1.9, h: 0.7, fill: { color: st.color }, line: { type: "none" }, rectRadius: 0.1 });
    s.addText(st.label, { x: st.x, y: st.y, w: 1.9, h: 0.7, fontSize: 13, bold: true, color: C.white, fontFace: FONT_TITLE, align: "center", valign: "middle" });
  });
  // arrows (simple line shapes)
  s.addShape("line", { x: 8.4, y: 2.95, w: 0.2, h: 0, line: { color: C.textDark, width: 1.5, endArrowType: "triangle" } });
  s.addShape("line", { x: 10.5, y: 2.7, w: 0.2, h: -0.4, line: { color: C.green, width: 1.5, endArrowType: "triangle" } });
  s.addShape("line", { x: 10.5, y: 3.25, w: 0.2, h: 0.3, line: { color: C.red, width: 1.5, endArrowType: "triangle" } });
  // REJECTED -> NEW (return loop)
  s.addShape("line", { x: 10.7, y: 3.95, w: 0, h: 0.4, line: { color: C.gold, width: 1.5, dashType: "dash" } });
  s.addShape("line", { x: 10.7, y: 4.35, w: -3.3, h: 0, line: { color: C.gold, width: 1.5, dashType: "dash" } });
  s.addShape("line", { x: 7.4, y: 4.35, w: 0, h: -1.45, line: { color: C.gold, width: 1.5, dashType: "dash", endArrowType: "triangle" } });
  s.addText("REJECTED → NEW дахин засах", { x: 7.5, y: 4.4, w: 4.5, h: 0.3, fontSize: 10, color: C.gold, italic: true, fontFace: FONT_BODY });

  // bottom note
  s.addShape("rect", { x: 0.5, y: 6.55, w: 12.3, h: 0.55, fill: { color: C.light }, line: { type: "none" } });
  s.addText("3 актор  ·  Нийт 12 юзкейс  ·  Татгалзах үед reject_note заавал", {
    x: 0.5, y: 6.55, w: 12.3, h: 0.55, fontSize: 13, bold: true, color: C.navy, fontFace: FONT_BODY, align: "center", valign: "middle",
  });

  speakerNote(s, "Системд гурван дүр оролцоно: зочин хэрэглэгч APPROVED олдворыг үзнэ, судлаач шинэ олдвор оруулна, админ баталгаажуулна. Нийт 12 юзкейс боловсруулсан. Татгалзсан үед reject_note заавал орох ёстой бөгөөд олдвор автоматаар NEW төлөвт буцаж судлаач засаж дахин илгээх боломжтой.");
}

// =====================================================
// Slide 10 — Class Diagram
// =====================================================
{
  const s = pptx.addSlide({ masterName: "MAIN" });
  sectionHeader(s, "Класс диаграмм", "09  ·  Загвар ба диаграммууд");

  // try inserting class diagram image on the left
  const classImg = img("chapter3/Class Diagram.png");
  if (fs.existsSync(classImg)) {
    s.addImage({ path: classImg, x: 0.5, y: 1.9, w: 7.5, h: 5.0, sizing: { type: "contain", w: 7.5, h: 5.0 } });
  } else {
    s.addShape("rect", { x: 0.5, y: 1.9, w: 7.5, h: 5.0, fill: { color: C.light }, line: { color: C.border, width: 0.5 } });
    s.addText("Класс диаграмм зураг", { x: 0.5, y: 4.2, w: 7.5, h: 0.5, fontSize: 14, color: C.textMuted, align: "center" });
  }

  // right: key relationships
  s.addText("Гол харилцаа", { x: 8.2, y: 1.9, w: 4.8, h: 0.4, fontSize: 14, bold: true, color: C.navy, fontFace: FONT_TITLE });
  s.addShape("rect", { x: 8.2, y: 2.35, w: 0.6, h: 0.04, fill: { color: C.gold }, line: { type: "none" } });

  const relItems = [
    [{ text: "User", options: { bold: true, color: C.azure } }, { text: " → Researcher / Admin\n", options: {} }, { text: "өв залгамжлал, submitted/verified төлөв", options: { fontSize: 10, color: C.textMuted, italic: true } }],
    [{ text: "Artifact ", options: { bold: true, color: C.blue } }, { text: "+ Location + MediaFile\n", options: {} }, { text: "композици харилцаа", options: { fontSize: 10, color: C.textMuted, italic: true } }],
    [{ text: "PhotoSet", options: { bold: true, color: C.green } }, { text: " + PhotoImage + ReconstructionJob\n", options: {} }, { text: "Reconstruction Lab модуль", options: { fontSize: 10, color: C.textMuted, italic: true } }],
    [{ text: "Төлвийн шилжилт\n", options: { bold: true, color: C.navy } }, { text: "NEW → PENDING → APPROVED / REJECTED\n", options: { fontSize: 11 } }, { text: "REJECTED → NEW буцалттай, reject_note required", options: { fontSize: 10, color: C.gold, italic: true } }],
  ];

  relItems.forEach((rel, i) => {
    const y = 2.55 + i * 1.05;
    s.addShape("rect", { x: 8.2, y, w: 4.8, h: 0.95, fill: { color: C.light }, line: { type: "none" } });
    s.addShape("rect", { x: 8.2, y, w: 0.08, h: 0.95, fill: { color: C.gold }, line: { type: "none" } });
    s.addText(rel, { x: 8.35, y: y + 0.08, w: 4.6, h: 0.85, fontSize: 12, color: C.textDark, fontFace: FONT_BODY });
  });

  speakerNote(s, "Класс диаграммд User-ийн Researcher/Admin наследлэг харилцаа, Artifact-ийн төлвийн шилжилт болон Reconstruction Lab-ын композицийн харилцааг тусгасан. Татгалзсан олдвор автоматаар NEW төлөв рүү буцаж судлаач засаж дахин илгээх боломжтой бөгөөд админ заавал шалтгаа оруулна.");
}

// =====================================================
// Slide 11 — Activity Diagram
// =====================================================
{
  const s = pptx.addSlide({ masterName: "MAIN" });
  sectionHeader(s, "Үйл ажиллагааны диаграмм", "10  ·  Загвар ба диаграммууд");

  // image on left
  const actImg = img("chapter2/Activity.png");
  if (fs.existsSync(actImg)) {
    s.addImage({ path: actImg, x: 0.5, y: 1.9, w: 7.5, h: 5.0, sizing: { type: "contain", w: 7.5, h: 5.0 } });
  }

  // right: swimlane summary
  s.addText("Swimlane урсгал", { x: 8.2, y: 1.9, w: 4.8, h: 0.4, fontSize: 14, bold: true, color: C.navy, fontFace: FONT_TITLE });
  s.addShape("rect", { x: 8.2, y: 2.35, w: 0.6, h: 0.04, fill: { color: C.gold }, line: { type: "none" } });

  const lanes = [
    { actor: "СУДЛААЧ", color: C.azure, action: "Мэдээлэл оруулна → илгээнэ (NEW → PENDING)" },
    { actor: "СИСТЕМ", color: C.blue, action: "Zod validation → PENDING төлөвт орно" },
    { actor: "АДМИН", color: C.navy, action: "Хянана → APPROVED эсвэл REJECTED" },
    { actor: "RETURN", color: C.gold, action: "REJECTED + reject_note → судлаач засна (NEW)" },
  ];
  lanes.forEach((l, i) => {
    const y = 2.55 + i * 1.05;
    s.addShape("rect", { x: 8.2, y, w: 4.8, h: 0.95, fill: { color: C.light }, line: { type: "none" } });
    s.addShape("rect", { x: 8.2, y, w: 0.08, h: 0.95, fill: { color: l.color }, line: { type: "none" } });
    s.addText(l.actor, { x: 8.35, y: y + 0.08, w: 4.6, h: 0.35, fontSize: 11, bold: true, color: l.color, fontFace: FONT_BODY, charSpacing: 2 });
    s.addText(l.action, { x: 8.35, y: y + 0.42, w: 4.6, h: 0.5, fontSize: 11, color: C.textDark, fontFace: FONT_BODY });
  });

  speakerNote(s, "Олдворын мэдээллийн урсгалыг судлаач, систем, админ гэсэн гурван swimlane-аар үзүүлэв. Татгалзах үед шалтгааны тэмдэглэгээ заавал орох ёстой бөгөөд олдвор автоматаар NEW төлөв рүү шилжиж судлаач засаж дахин илгээнэ. Энэ нь чанартай мэдээллийн loop-ыг бүрдүүлдэг.");
}

// =====================================================
// Slide 12 — Sequence Diagram
// =====================================================
{
  const s = pptx.addSlide({ masterName: "MAIN" });
  sectionHeader(s, "Дарааллын диаграмм", "11  ·  Загвар ба диаграммууд");

  // Top: flow diagram drawn
  const steps = [
    { label: "Хэрэглэгч\n(Хайлт)", color: C.azure },
    { label: "Artifact\nController", color: C.blue },
    { label: "Artifact\nService", color: C.blue },
    { label: "PostgreSQL\n+ PostGIS", color: C.navy },
    { label: "Үр дүн\n(JSON)", color: C.green },
  ];
  const boxW = 2.1, boxH = 1.2;
  const totalW = steps.length * boxW + (steps.length - 1) * 0.4;
  const startX = (13.33 - totalW) / 2;
  const y0 = 2.1;
  steps.forEach((st, i) => {
    const x = startX + i * (boxW + 0.4);
    s.addShape("roundRect", { x, y: y0, w: boxW, h: boxH, fill: { color: st.color }, line: { type: "none" }, rectRadius: 0.1 });
    s.addText(st.label, { x, y: y0, w: boxW, h: boxH, fontSize: 12, bold: true, color: C.white, fontFace: FONT_TITLE, align: "center", valign: "middle" });
    if (i < steps.length - 1) {
      s.addShape("line", {
        x: x + boxW, y: y0 + boxH / 2, w: 0.4, h: 0,
        line: { color: C.gold, width: 2, endArrowType: "triangle" },
      });
    }
  });

  // Bottom-left: PostGIS tech detail
  s.addShape("rect", { x: 0.5, y: 4.0, w: 6.2, h: 2.7, fill: { color: C.light }, line: { color: C.border, width: 0.5 } });
  s.addShape("rect", { x: 0.5, y: 4.0, w: 6.2, h: 0.45, fill: { color: C.navy }, line: { type: "none" } });
  s.addText("Газарзүйн хайлт (Geo-search)", { x: 0.6, y: 4.0, w: 6, h: 0.45, fontSize: 13, bold: true, color: C.white, fontFace: FONT_TITLE, valign: "middle" });

  const geoBullets = [
    { text: "ST_Distance(geography, geography) функц", options: { bullet: { code: "25B8" }, bold: true, color: C.navy } },
    { text: "GiST индексээр O(log n) гүйцэтгэл", options: { bullet: { code: "25B8" } } },
    { text: "Хэрэглэгчид ойр олдворыг автомат эрэмбэлнэ", options: { bullet: { code: "25B8" } } },
    { text: "geography(POINT, 4326) — WGS84 координат", options: { bullet: { code: "25B8" } } },
  ];
  s.addText(geoBullets, { x: 0.7, y: 4.55, w: 5.9, h: 2.1, fontSize: 12, color: C.textDark, fontFace: FONT_BODY, paraSpaceAfter: 6 });

  // Bottom-right: detail view tech
  s.addShape("rect", { x: 6.9, y: 4.0, w: 5.95, h: 2.7, fill: { color: C.light }, line: { color: C.border, width: 0.5 } });
  s.addShape("rect", { x: 6.9, y: 4.0, w: 5.95, h: 0.45, fill: { color: C.navy }, line: { type: "none" } });
  s.addText("Дэлгэрэнгүй үзэх (Detail view)", { x: 7.0, y: 4.0, w: 5.75, h: 0.45, fontSize: 13, bold: true, color: C.white, fontFace: FONT_TITLE, valign: "middle" });

  const detailBullets = [
    { text: "Three.js 3D viewer ачаалагдана", options: { bullet: { code: "25B8" } } },
    { text: "Leaflet map зэрэгцэн үүснэ", options: { bullet: { code: "25B8" } } },
    { text: "Зураг, тайлбар REST API-аар", options: { bullet: { code: "25B8" } } },
    { text: "Lazy-load, code-splitting (Vite)", options: { bullet: { code: "25B8" } } },
  ];
  s.addText(detailBullets, { x: 7.1, y: 4.55, w: 5.65, h: 2.1, fontSize: 12, color: C.textDark, fontFace: FONT_BODY, paraSpaceAfter: 6 });

  speakerNote(s, "Олдвор хайх, дэлгэрэнгүйг үзэх үйл явц controller, service, repository хооронд хэрхэн дамждагийг харуулсан. Газарзүйн хайлтад PostGIS-ийн ST_Distance функц болон GiST индекс ашиглан хэрэглэгчид ойр олдворуудыг хурдан эрэмбэлэн харуулна.");
}

// =====================================================
// Slide 13 — ERD
// =====================================================
{
  const s = pptx.addSlide({ masterName: "MAIN" });
  sectionHeader(s, "Өгөгдлийн сангийн схем", "12  ·  Загвар ба диаграммууд");

  // image on left
  const erdImg = img("chapter3/ERD.png");
  if (fs.existsSync(erdImg)) {
    s.addImage({ path: erdImg, x: 0.5, y: 1.9, w: 7.5, h: 5.0, sizing: { type: "contain", w: 7.5, h: 5.0 } });
  }

  // right: structured summary
  s.addText("10 хүснэгт · 3 бүлэг", { x: 8.2, y: 1.9, w: 4.8, h: 0.5, fontSize: 18, bold: true, color: C.navy, fontFace: FONT_TITLE });
  s.addShape("rect", { x: 8.2, y: 2.45, w: 0.6, h: 0.04, fill: { color: C.gold }, line: { type: "none" } });

  const groups = [
    { num: "4", title: "Хэрэглэгч / токен", color: C.azure },
    { num: "3", title: "Олдвор / байршил / медиа", color: C.blue },
    { num: "3", title: "Зургийн багц / боловсруулалт", color: C.green },
  ];
  groups.forEach((g, i) => {
    const y = 2.65 + i * 0.75;
    s.addShape("rect", { x: 8.2, y, w: 4.8, h: 0.65, fill: { color: C.light }, line: { type: "none" } });
    s.addShape("rect", { x: 8.2, y, w: 0.45, h: 0.65, fill: { color: g.color }, line: { type: "none" } });
    s.addText(g.num, { x: 8.2, y, w: 0.45, h: 0.65, fontSize: 16, bold: true, color: C.white, fontFace: FONT_TITLE, align: "center", valign: "middle" });
    s.addText(g.title, { x: 8.8, y, w: 4.0, h: 0.65, fontSize: 13, color: C.textDark, fontFace: FONT_BODY, valign: "middle" });
  });

  // tech tags
  s.addShape("rect", { x: 8.2, y: 5.05, w: 4.8, h: 1.85, fill: { color: C.navy }, line: { type: "none" } });
  s.addText("ТЕХНИК ШИЙДЭЛ", { x: 8.35, y: 5.15, w: 4.5, h: 0.3, fontSize: 10, bold: true, color: C.gold, fontFace: FONT_BODY, charSpacing: 4 });
  const tech = [
    { text: "geography(POINT, 4326)", options: { bullet: { code: "25B8" }, color: C.white } },
    { text: "GiST индекс газарзүйн хайлтад", options: { bullet: { code: "25B8" }, color: C.white } },
    { text: "ON DELETE CASCADE бүрэн бүтэн байдал", options: { bullet: { code: "25B8" }, color: C.white } },
  ];
  s.addText(tech, { x: 8.35, y: 5.45, w: 4.5, h: 1.4, fontSize: 11, fontFace: FONT_BODY, paraSpaceAfter: 4 });

  speakerNote(s, "Өгөгдлийн санг нийт арван хүснэгтэд гурван бүлгээр зохион байгуулсан. PostGIS-ийн geography төрөл болон GiST индекс ашиглан газарзүйн хайлтыг хурдан гүйцэтгэх боломжтой. ON DELETE CASCADE стратегиар бүрэн бүтэн байдлыг хадгалсан.");
}

// =====================================================
// Slide 14 — Conclusion
// =====================================================
{
  const s = pptx.addSlide({ masterName: "MAIN" });
  sectionHeader(s, "Дүгнэлт", "13  ·  Дүгнэлт");

  // left: done
  s.addShape("rect", { x: 0.5, y: 1.9, w: 6.1, h: 5.0, fill: { color: C.light }, line: { color: C.border, width: 0.5 } });
  s.addShape("rect", { x: 0.5, y: 1.9, w: 6.1, h: 0.5, fill: { color: C.green }, line: { type: "none" } });
  s.addText("✓ ХИЙСЭН АЖИЛ", { x: 0.7, y: 1.9, w: 5.7, h: 0.5, fontSize: 14, bold: true, color: C.white, fontFace: FONT_TITLE, valign: "middle", charSpacing: 2 });

  // progress: FR
  s.addText("FR — Функцийн шаардлага", { x: 0.7, y: 2.55, w: 5.7, h: 0.3, fontSize: 11, bold: true, color: C.navy, fontFace: FONT_BODY });
  s.addShape("rect", { x: 0.7, y: 2.85, w: 5.7, h: 0.25, fill: { color: C.border }, line: { type: "none" } });
  s.addShape("rect", { x: 0.7, y: 2.85, w: 5.7, h: 0.25, fill: { color: C.green }, line: { type: "none" } });
  s.addText("18 / 18  (100%)", { x: 0.7, y: 2.85, w: 5.7, h: 0.25, fontSize: 10, bold: true, color: C.white, fontFace: FONT_BODY, align: "center", valign: "middle" });

  // progress: NFR
  s.addText("NFR — Функцийн бус шаардлага", { x: 0.7, y: 3.25, w: 5.7, h: 0.3, fontSize: 11, bold: true, color: C.navy, fontFace: FONT_BODY });
  s.addShape("rect", { x: 0.7, y: 3.55, w: 5.7, h: 0.25, fill: { color: C.border }, line: { type: "none" } });
  s.addShape("rect", { x: 0.7, y: 3.55, w: 5.7, h: 0.25, fill: { color: C.green }, line: { type: "none" } });
  s.addText("12 / 12  (100%)", { x: 0.7, y: 3.55, w: 5.7, h: 0.25, fontSize: 10, bold: true, color: C.white, fontFace: FONT_BODY, align: "center", valign: "middle" });

  const done = [
    { text: "3D viewer + Leaflet газрын зураг + Sharp/Laplacian авто шалгалт", options: { bullet: { code: "2713" } } },
    { text: "Security stack: httpOnly · scrypt · SHA-256 · Helmet · Zod · RBAC · email verify", options: { bullet: { code: "2713" } } },
    { text: "Олдвор үүсгэх → баталгаажуулах урсгал (REJECTED → NEW буцалттай)", options: { bullet: { code: "2713" } } },
  ];
  s.addText(done, { x: 0.7, y: 3.95, w: 5.7, h: 2.85, fontSize: 11, color: C.textDark, fontFace: FONT_BODY, paraSpaceAfter: 8, lineSpacingMultiple: 1.3 });

  // right: future
  s.addShape("rect", { x: 6.8, y: 1.9, w: 6.05, h: 5.0, fill: { color: C.light }, line: { color: C.border, width: 0.5 } });
  s.addShape("rect", { x: 6.8, y: 1.9, w: 6.05, h: 0.5, fill: { color: C.gold }, line: { type: "none" } });
  s.addText("→ ЦААШДЫН АЖИЛ", { x: 7.0, y: 1.9, w: 5.7, h: 0.5, fontSize: 14, bold: true, color: C.navy, fontFace: FONT_TITLE, valign: "middle", charSpacing: 2 });

  const future = [
    { text: "Илүү олон төрлийн олдвор хамруулах", options: { bullet: { code: "25B8" } } },
    { text: "Photogrammetry боловсруулалтыг сервер дээр автоматжуулах (COLMAP integration)", options: { bullet: { code: "25B8" } } },
    { text: "Файл хадгалалтыг cloud руу шилжүүлэх (AWS S3)", options: { bullet: { code: "25B8" } } },
    { text: "Penetration test, гүйцэтгэлийн benchmark (100–200 хэрэглэгч)", options: { bullet: { code: "25B8" } } },
    { text: "Mobile хувилбар (React Native эсвэл PWA)", options: { bullet: { code: "25B8" } } },
  ];
  s.addText(future, { x: 7.0, y: 2.65, w: 5.65, h: 4.1, fontSize: 12, color: C.textDark, fontFace: FONT_BODY, paraSpaceAfter: 10, lineSpacingMultiple: 1.3 });

  speakerNote(s, "Дипломын ажлаар тодорхойлсон 18 функцийн ба 12 функцийн бус шаардлагыг бүрэн хэрэгжүүлсэн. 7 давхар аюулгүй байдлын механизм болон Reconstruction Lab модулийг амжилттай хийсэн. Цаашид photogrammetry боловсруулалтыг автоматжуулах, cloud руу шилжүүлэх, аюулгүй байдлын тест хийх зорилттой.");
}

// =====================================================
// Slide 15 — References
// =====================================================
{
  const s = pptx.addSlide({ masterName: "MAIN" });
  sectionHeader(s, "Ашигласан материал", "14  ·  Дүгнэлт");

  const refs = [
    "UNESCO. Recommendation Concerning the Protection and Promotion of Museums. 2018",
    "Remondino, F. Heritage Recording and 3D Modeling with Photogrammetry. 2014",
    "Three.js, React, Node.js — албан ёсны баримт бичиг",
    "PostgreSQL, PostGIS — албан ёсны баримт бичиг",
    "Платформын судалгаа: Google Arts & Culture, Sketchfab, Smithsonian 3D, CyArk, Mongoltoli",
  ];
  s.addText(refs.map(t => ({ text: t, options: { bullet: { code: "25B8" }, paraSpaceAfter: 12 } })), {
    x: 0.7, y: 2.0, w: 12, h: 4.5, fontSize: 14, color: C.textDark, fontFace: FONT_BODY, lineSpacingMultiple: 1.4,
  });

  s.addText("Дэлгэрэнгүй жагсаалт дипломын номын төгсгөлд", {
    x: 0.7, y: 6.5, w: 12, h: 0.4, fontSize: 11, color: C.textMuted, italic: true, fontFace: FONT_BODY,
  });

  speakerNote(s, "Гол эх сурвалжууд эдгээр. Дэлгэрэнгүй жагсаалтыг дипломын номын төгсгөлд хавсаргасан.");
}

// =====================================================
// Slide 16 — Thank you
// =====================================================
{
  const s = pptx.addSlide();
  s.background = { color: C.navy };

  // gold band
  s.addShape("rect", { x: 0, y: 0, w: 13.33, h: 0.4, fill: { color: C.gold }, line: { type: "none" } });
  s.addShape("rect", { x: 0, y: 7.1, w: 13.33, h: 0.4, fill: { color: C.gold }, line: { type: "none" } });

  s.addText("Анхаарал тавьсанд", { x: 0, y: 1.8, w: 13.33, h: 1.0, fontSize: 30, color: C.light, fontFace: FONT_TITLE, align: "center" });
  s.addText("баярлалаа", { x: 0, y: 2.7, w: 13.33, h: 1.8, fontSize: 80, bold: true, color: C.white, fontFace: FONT_TITLE, align: "center" });

  s.addShape("rect", { x: 6.16, y: 4.7, w: 1.0, h: 0.06, fill: { color: C.gold }, line: { type: "none" } });

  s.addText("Live demo-р үргэлжлүүлэн харуулна", { x: 0, y: 5.0, w: 13.33, h: 0.5, fontSize: 18, color: C.gold, italic: true, fontFace: FONT_BODY, align: "center" });

  s.addText("Асуултанд хариулахад бэлэн", { x: 0, y: 5.6, w: 13.33, h: 0.4, fontSize: 14, color: C.light, fontFace: FONT_BODY, align: "center" });

  s.addText("ШУТИС  ·  Компьютерын Ухааны Тэнхим  ·  Н. Хангал  ·  2026", {
    x: 0, y: 6.5, w: 13.33, h: 0.4, fontSize: 11, color: C.textMuted, fontFace: FONT_BODY, align: "center", charSpacing: 3,
  });

  speakerNote(s, "Анхаарал тавьсанд баярлалаа. Одоо системийн live demo-г үзүүлье. Дараа нь асуултанд хариулахад бэлэн байна.");
}

// =====================================================
// Save
// =====================================================
pptx.writeFile({ fileName: OUT }).then(name => {
  console.log("\n✓ PPTX created:", name);
  console.log("  Size:", (fs.statSync(name).size / 1024).toFixed(1), "KB");
}).catch(err => {
  console.error("✗ Error:", err);
  process.exit(1);
});
