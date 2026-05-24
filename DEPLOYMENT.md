# Production deploy guide — Vercel + Render + Neon

Үнэгүй stack-аар "Түүхэн өв" каталогийн системийг live URL дээр deploy хийх алхамууд.

| Хэсэг | Үйлчилгээ | Үнэ |
|---|---|---|
| Frontend (React) | **Vercel** | ₮0 (бүтэн үнэгүй) |
| Backend (Node API) | **Render** free web service | ₮0 (15 мин idle бол унтдаг) |
| Database | **Neon** Postgres + PostGIS | ₮0 (0.5 GB) |
| Custom domain | **Namecheap .me** (Student Pack) | 1 жил үнэгүй |

⚠️ **Анхааруулга**: Render-ийн free disk нь **ephemeral** — re-deploy болоход uploads устдаг. Тестийн дараа `scripts/seed-artifacts.mjs` дахин ажиллуулна, эсвэл [Cloudflare R2 руу шилжих](#5-уpload-storage-сонголтоор-r2) (10 GB үнэгүй, persistent).

---

## 1. Neon — Database үүсгэх

1. https://neon.tech рүү орж GitHub-ээр бүртгүүлэх (үнэгүй)
2. **Create Project** → нэр өгөх (жишээ `heritage`), region `Frankfurt` (Монголд хамгийн ойр)
3. Database үүссэний дараа **Connection String** хуулна — `postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require` хэлбэртэй
4. SQL Editor дотор PostGIS enable хийх:

   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS pgcrypto;
   ```

5. Schema файлыг түрхэх — `backend/src/db/schema.sql`-ын агуулгыг хуулж Neon SQL Editor-д paste хийн Run

   *Эсвэл local-аас:*
   ```powershell
   cd backend
   $env:DATABASE_URL='postgresql://...?sslmode=require'  # Neon-ийн string
   npm run db:init
   ```

6. (Заавал биш) Дотроо хадгалсан seed өгөгдлийг шилжүүлэх — дараах script ажиллуулна:
   ```powershell
   $env:DATABASE_URL='<Neon URL>'
   node scripts/seed-artifacts.mjs
   ```

---

## 2. Render — Backend deploy

1. https://render.com рүү GitHub-ээр нэвтрэх
2. **New +** → **Blueprint** → repo сонгох → `render.yaml` автоматаар уншна
3. Гарч ирэх env vars-ыг бөглөнө:

   | Var | Утга |
   |---|---|
   | `DATABASE_URL` | Neon-аас хуулсан connection string |
   | `CORS_ORIGIN` | (одоохондоо `*` гэж тавьж дараа Vercel URL-ээр солино) |
   | `PUBLIC_APP_URL` | (Vercel URL-аар сольно дараа) |
   | `RESEND_API_KEY` | (хоосон үлдээж болно — dev console-д линк гарна) |
   | `EMAIL_FROM` | `onboarding@resend.dev` |

4. **Apply** дарах → Render автоматаар `npm install` + `npm run start` ажиллуулна (~3 минут)
5. Deploy-ийн дараа URL гарна: `https://heritage-api.onrender.com` (similar)
6. `https://your-api.onrender.com/api/healthz` руу орж `{"status":"ok"}` буцаж байгаа эсэхийг шалгана

---

## 3. Vercel — Frontend deploy

1. https://vercel.com рүү GitHub-ээр нэвтрэх
2. **Add New** → **Project** → repo сонгох
3. **Root Directory** = `frontend` гэж заана (бусад утга автоматаар Vite төсөл гэдгийг таана)
4. **Environment Variables** хэсэгт нэмэх:

   | Name | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `https://heritage-api.onrender.com/api` (Render-ийн URL + `/api`) |

5. **Deploy** дарах → 1-2 минутад live болно: `https://heritage-xxx.vercel.app`

---

## 4. CORS + домэйнийг буцаж тохируулах

Vercel URL гарсан тул Render-ийн backend дээр env vars шинэчилнэ:

1. Render dashboard → service сонгох → **Environment** → дараах хоёрыг засна:

   | Var | Утга |
   |---|---|
   | `CORS_ORIGIN` | `https://heritage-xxx.vercel.app` |
   | `PUBLIC_APP_URL` | `https://heritage-xxx.vercel.app` |

2. **Save Changes** дарвал автоматаар restart хийнэ

(Заавал биш) **Custom domain** холбох:
- Namecheap-аас Student Pack-аар авсан `.me` домэйнийг Vercel-д **Domains** хэсэгт нэмэх → DNS record шинэчилэх

---

## 5. Upload storage — сонголтоор R2

Render-ийн free tier-ийн disk нь ephemeral учир persistent байх шаардлагатай бол:

**Cloudflare R2** (үнэгүй 10 GB, S3-compatible):

1. https://cloudflare.com бүртгэлийн → R2 → Bucket үүсгэх (жишээ `heritage-uploads`)
2. API Token авах: R2 → Manage R2 API Tokens
3. Backend-д нэмэх:
   ```powershell
   cd backend
   npm install @aws-sdk/client-s3 multer-s3
   ```
4. `backend/src/utils/upload.js`-г S3-compatible storage руу шилжүүлэх (бид өөрчилж өгье хүсвэл)

Эсвэл Supabase Storage ашиглавал DB+Storage хоёуланг нь нэг газар.

---

## 6. Эцсийн шалгалт

Deploy дууссаны дараа:

- [ ] `https://heritage-api.onrender.com/api/healthz` → `{"status":"ok"}`
- [ ] `https://heritage-api.onrender.com/api/health` → `{"status":"ok","database":"..."}`
- [ ] `https://heritage-api.onrender.com/api/artifacts` → items[] буцаах
- [ ] `https://heritage-xxx.vercel.app` нээгдэх, "Олдворууд" хуудаснаас өгөгдөл харагдах
- [ ] DevTools → Network → `artifacts` request 200 OK
- [ ] Олдвор бүртгэх → 3D файл upload амжилттай явах

Эхний request тэвчүүртэй хүлээгээрэй — Render-ийн free тier-ийн "cold start" 30 сек авдаг.

---

## 7. Деплойн дараах операцийн зөвлөмж

**Backend дахин deploy**: GitHub-ийн `main` branch-д push хийхэд Render автоматаар rebuild + deploy хийнэ.

**Frontend дахин deploy**: GitHub-ийн `main`-д push хийхэд Vercel автоматаар preview + production deploy хийнэ. PR бүрд preview URL гарна.

**DB schema migration**: `backend/src/db/schema.sql`-г шинэчилсний дараа Neon SQL Editor-д шинэ ALTER/CREATE statements-ийг гар-аар ажиллуулах. Render side-д DB migration туслах CLI нь одоогоор алга — өөр сайжруулалт цаашид нэмж болно.

**Лог харах**:
- Render: dashboard → service → **Logs** tab
- Vercel: dashboard → project → **Deployments** → дараа дарж тус бүрийн **Function Logs**
- Neon: dashboard → **Monitoring** → query histogram

**Backup**: Neon автоматаар "point-in-time recovery" хийдэг (free tier-д 7 хоног). Гар-аар backup-аа `pg_dump`-аар авч болно.
