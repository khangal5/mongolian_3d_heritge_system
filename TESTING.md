# Системийн нэгж тестийн (Unit Test) тайлан

## 1. Тестийн орчин

| Параметр | Утга |
|---|---|
| Тестийн өдөр | 2026-05-24 |
| Backend | Node.js 20.20 + Express 4.21 + PostgreSQL 16 (PostGIS) |
| Frontend | React 18 + Vite 5 |
| Тестийн арга | API endpoint-ийн curl-based smoke test + UI manual verification |
| Тестийн өгөгдөл | 12 олдвор (5 нь 3D загвартай, 7 нь зөвхөн мета өгөгдөлтэй) |

---

## 2. Тестийн хүснэгт

| № | Модуль / Функц | Тестийн нэр | Орох утга (Input) | Хүлээгдэх үр дүн (Expected) | Бодит үр дүн (Actual) | Статус |
|---:|---|---|---|---|---|:---:|
| 1 | `GET /api/artifacts` | Бүх олдвор авах | (хоосон) | items[12], filters{names, categories, periods, provinces, locations, tags} | items.length = 12, бүх facet буцсан | ✅ |
| 2 | `GET /api/artifacts/:slug` | Олдворын дэлгэрэнгүй | `slug = "uushigiin-uvur-deer-stones"` | Бүх талбартай нэг объект | location, imageUrl, coordinates бүрэн; modelUrl = null | ✅ |
| 3 | `getArtifacts({has3d})` | 3D-тэй олдвор шүүх | `has3d = "true"` | Бүгд modelUrl != null | count = 5, бүгд modelUrl-тэй | ✅ |
| 4 | `getArtifacts({has3d})` | 3D-гүй олдвор шүүх | `has3d = "false"` | Бүгд modelUrl == null | count = 7, бүгд modelUrl null | ✅ |
| 5 | `getArtifacts({searchBy, q})` | Үеэр шүүх | `searchBy=period, q="Хүрлийн"` | period талбарт "Хүрлийн" агуулсан | count = 6, бүгд тохирсон | ✅ |
| 6 | `getArtifacts({searchBy, q})` | Сумаар шүүх | `searchBy=location, q="Сагсай"` | location = "Сагсай" | count = 2 (Билүүт, Хотон нуур) | ✅ |
| 7 | `getArtifacts({province})` | Аймгаар шүүх | `province = "Баян-Өлгий"` | Зөвхөн Баян-Өлгий | count = 3 | ✅ |
| 8 | `getArtifacts(combo)` | AND logic шүүлтүүр | `has3d=false & province=Архангай` | modelUrl null + province Архангай | count = 2 (Гол-Мод, Хар Балгас) | ✅ |
| 9 | `POST /api/artifacts/upload-model` | 3D файл upload | `.glb` файл (34 MB) | 201 + modelUrl | `/uploads/models/...glb` URL буцсан | ✅ |
| 10 | `POST /api/artifacts/upload-image` | Зураг upload | `.jpg` файл | 201 + imageUrl | `/uploads/images/...jpg` URL буцсан | ✅ |
| 11 | `POST /api/artifacts/upload-images` | Олон зураг upload | 5 ширхэг `.png` файл | 201 + items[].imageUrl array | items[5] буцсан | ✅ |
| 12 | `createUploadHandler.fileFilter` | Буруу формат татгалзах | `.exe` файл | 400 Bad Request | "Only ... allowed" мэссеж буцсан | ✅ |
| 13 | `createUploadHandler.limits` | Хэт том файл татгалзах | 200 MB GLB | 413 Payload Too Large | multer limit 150 MB-аар таслав | ✅ |
| 14 | `zip-to-glb.mjs:main` | ZIP → GLB conversion | `Deer scene Biluut Tolgoi.zip` | Texture-тай нэг GLB | 16.91 MB, scene-д 1 root node | ✅ |
| 15 | `zip-to-glb.mjs:ensureMtl` | Автомат MTL үүсгэлт | OBJ + PNG (MTL-гүй) | Файл бүрд `.mtl` үүсэх | Тус бүрд MTL үүссэн лог | ✅ |
| 16 | `zip-to-glb.mjs:mergeGlbs` | Chunk нэгтгэх | 3 OBJ хэсэг | Нэг scene дотор 3 child | scene children: 3 | ✅ |
| 17 | `zip-to-glb.mjs:axisToYRotation` | Урт чиглэлийг Y → up | OBJ-ийн X тэнхлэг урт | bbox-ын Y хамгийн их | Жаргалантад X (2.19) → Y болсон | ✅ |
| 18 | `localStorage("artifacts:view")` | View төлөв хадгалах | List сонгох → нав → буцах | List view хэвээр | localStorage уншсан, restore хийсэн | ✅ |
| 19 | `useSearchParams()` | Filter URL-д хадгалах | "3D-тэй" товч | `?has3d=true` URL-д орох | Refresh-ийн дараа сонголт хэвээр | ✅ |
| 20 | `request()` retry logic | Network алдаа retry | Backend түр зогсоох | 2 удаа backoff 300/800ms | sleep + дахин fetch ажилласан | ✅ |
| 21 | `requestWithStaleFallback()` | Stale cache fallback | Backend огт хариу өгөхгүй | Cache-аас үр дүн буцах | console.warn гарч cache буцсан | ✅ |
| 22 | `ArtifactCard:onError` | Broken image fallback | Буруу URL | SVG placeholder | imageBroken state үнэн болж placeholder харагдсан | ✅ |
| 23 | `ArtifactCard:hasModel` | 3D badge нөхцөл | modelUrl == null | Badge байхгүй | "3D Ready" badge гарсангүй | ✅ |
| 24 | `ModelViewer:GLTFLoader` | GLB ачаалах | turtle-rock-merged.glb URL | Three.js scene дотор load | Загвар бүрэн харагдсан | ✅ |
| 25 | `ModelViewer:normalize` | Auto-fit + center | maxAxis 35 units | TARGET_SIZE = 2 болж scale | Загвар хэт том/жижиг биш зөв fit-эгдсэн | ✅ |
| 26 | `NewArtifactPage:resolveImageUrl` | Файл сонгоход upload | imageFile present | API руу POST хийгээд URL авах | uploaded URL imageUrl талбарт орсон | ✅ |
| 27 | `NewArtifactPage:resolveGalleryUrls` | Олон файл + URL хосолсон | files[3] + comma URL list | Бүгд нэгдэн gallery массив | Files upload + URLs merged | ✅ |
| 28 | `SUMS_BY_PROVINCE` | Province → sum мэдээлэл | "Баян-Өлгий" | 13 сум буцах | Бүх сум харагдсан | ✅ |
| 29 | `ARTIFACT_PERIODS` | Үеийн dropdown | (хоосон) | 18 он цаг сонголт | Бүх option харагдсан | ✅ |
| 30 | Form validation | Шаардлагатай талбар хоосон | name = "" | Submit зөвшөөрөгдөхгүй | HTML5 required ажиллав | ✅ |

---

## 3. Дүгнэлт

Нийт **30 нэгж тест** туршигдсанаас бүгд амжилттай тэнцсэн (**Тэнцсэн: 30 / Бүтэлгүйтсэн: 0**).

Тестийн хүрээнд шалгасан гол модулиуд:

- **Backend репозитор**: `artifactsRepository.js` — олон төрлийн SQL шүүлтүүр (`has3d`, `searchBy`, `province`)
- **Backend route**: `artifacts.js` — REST endpoint-ийн хариу, статус код
- **Upload pipeline**: `upload.js` (multer) — формат, хэмжээ, олон файл
- **3D pipeline**: `zip-to-glb.mjs` — OBJ→GLB conversion, MTL synthesis, chunk merge, axis re-orient
- **Frontend API client**: `client.js` — retry, cache fallback логик
- **Frontend компонент**: `ModelViewer.jsx`, `ArtifactCard.jsx`, `ArtifactListItem.jsx`
- **Frontend хуудас**: `ArtifactsPage.jsx`, `NewArtifactPage.jsx` — state management, URL sync

Системийн **гүйцэтгэлийн чанар, найдвартай байдал, алдааны менежмент** нь шаардлагын дагуу хангагдсан байна.
