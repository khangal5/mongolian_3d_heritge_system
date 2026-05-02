import { test } from "node:test";
import assert from "node:assert/strict";
import { summarizeReport, estimateQualityFromReport } from "../src/utils/imageQuality.js";

function makeReport(overrides = {}) {
  return {
    total: 30,
    okCount: 28,
    issues: { blurry: 1, dark: 0, overexposed: 1, lowRes: 0, unread: 0 },
    avgMegapixels: 12.5,
    avgBrightness: 130,
    perImage: [],
    ...overrides
  };
}

test("summarizeReport нь зургийн тоог OK гэж тэмдэглэнэ", () => {
  const line = summarizeReport(makeReport({ total: 40, okCount: 40 }), 30);
  assert.match(line, /Зургийн тоо 40 ✓/);
});

test("summarizeReport нь хангалтгүй тоог анхааруулна", () => {
  const line = summarizeReport(makeReport({ total: 10 }), 30);
  assert.match(line, /Зургийн тоо 10 \(санал болгох ≥ 30\)/);
});

test("summarizeReport дундаж resolution-ыг харуулна", () => {
  const line = summarizeReport(makeReport({ avgMegapixels: 8 }), 30);
  assert.match(line, /Дундаж resolution 8MP/);
});

test("estimateQualityFromReport ≥30 зураг + 85%+ OK = өндөр", () => {
  const q = estimateQualityFromReport(makeReport({ total: 30, okCount: 28 }), 30);
  assert.equal(q, "өндөр");
});

test("estimateQualityFromReport дунд зэрэг", () => {
  const q = estimateQualityFromReport(makeReport({ total: 20, okCount: 14 }), 30);
  assert.equal(q, "дунд");
});

test("estimateQualityFromReport бага", () => {
  const q = estimateQualityFromReport(makeReport({ total: 10, okCount: 5 }), 30);
  assert.equal(q, "бага");
});
