# Mongolian 3D Heritage System

Энэ repository нь Монголын түүхэн өвийг хайлт, 3D үзүүлэн, фотограмметрийн туршилтын урсгал, мөн role-based судлаачийн бүртгэлийн боломжтойгоор хөгжүүлж буй дипломын ажлын MVP хувилбар юм.

## Stack

- Frontend: React + Vite, Three.js, Leaflet
- Backend: Node.js + Express
- Database: PostgreSQL + PostGIS
- Upload: local file storage
- Authentication: httpOnly cookie session + scrypt password hash
- 3D туршилтын урсгал: photogrammetry placeholder pipeline (sharp + Laplacian variance)

## Боломжууд

- Олдворын каталог + хайлт, шүүлт, газарзүйн зайгаар эрэмбэлэх
- Олдворын дэлгэрэнгүй хуудас (3D viewer + Leaflet газрын зураг)
- Судлаач бүртгэл, и-мэйл баталгаажуулалт, нэвтрэлт, нууц үг сэргээх
- Role-based access control (visitor / researcher / admin)
- NEW → PENDING → APPROVED/REJECTED олдворын статусын урсгал
- Reconstruction Lab: зураг upload + чанарын автомат шалгалт + queue

## Local Development

PowerShell дээр `npm` script execution асуудал гарвал `npm.cmd` ашиглана.

### Backend

```powershell
cd backend
npm.cmd install
npm.cmd run db:init       # schema үүсгэх (нэг удаа)
npm.cmd run db:seed-admin # анхдагч админ үүсгэх (нэг удаа)
npm.cmd run dev           # сервер ажиллуулах
```

### Frontend

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

## PostgreSQL тохиргоо

1. `backend/.env.example` файлыг `backend/.env` болгон хуулна.
2. `DATABASE_URL` утгыг өөрийн PostgreSQL холболтоор солино.
3. `mongolian_heritage` database үүсгэнэ.
4. `npm.cmd run db:init` ажиллуулж table-уудаа үүсгэнэ.

Schema шинэчлэгдсэн үед `db:init`-ийг дахин ажиллуулна — `CREATE TABLE IF NOT EXISTS` ашигладаг тул байгаа өгөгдөл алдагдахгүй.

## Хэрэглэгчийн урсгал

### Судлаачаар бүртгүүлэх

1. `/register` хуудас → хувийн + албаны мэдээлэл + баталгаажуулах баримтын зураг.
2. Албан и-мэйл хаягт ирсэн баталгаажуулах холбоосыг дарах.
3. Админ судлаачийн баталгаажуулалтыг хянана (`/admin/researchers`).

### Нэвтрэх

- `/login` хуудас → имэйл + нууц үг → `heritage_session` httpOnly cookie тавигдана.
- Cookie 24 цаг хүчинтэй; logout-оор устгагдана.

### Нууц үг сэргээх

1. `/login` дээрх "Нууц үгээ мартсан уу?" холбоос.
2. `/forgot-password` → имэйл хаяг.
3. И-мэйлээр ирсэн холбоосоор `/reset-password?token=...`.
4. Шинэ нууц үг → бүх session устаж дахин нэвтэрнэ.

### Олдвор нэмэх (researcher)

1. `/artifacts/new` → олдворын мета мэдээлэл + зураг URL + 3D загвар (GLB upload эсвэл URL).
2. Хадгалах → `NEW` төлөвт орно.
3. "Илгээх" → `PENDING` болж админ шалгана.
4. Админ `APPROVED` болговол public-д харагдана. `REJECTED` бол шалтгаантай судлаач рүү буцна.

### Reconstruction Lab (researcher)

1. `/reconstruction-lab` → зургийн багц + тайлбар.
2. Чанарын автомат шалгалт (`sharp`-аар Laplacian variance) → багц `queue` төлөвт.
3. Админ локал орчинд Meshroom/RealityCapture-аар боловсруулна.

## Орчин үеийн тохиргоо (env vars)

`backend/.env` дотор шаардлагатай:

| Хувьсагч | Заавал | Тайлбар |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL холболтын URL |
| `PORT` | ❌ | Default 4000 |
| `CORS_ORIGIN` | ✅ | Frontend домэйн (cookie credentials шаардлагатай) |
| `PUBLIC_APP_URL` | ✅ | Имэйл линкэнд хэрэглэх frontend URL |
| `EMAIL_DOMAIN_WHITELIST` | ❌ | Зөвшөөрөгдсөн домэйн жагсаалт (default: `edu.mn,ac.mn,gov.mn,gmail.com`) |
| `EMAIL_DOMAIN_BYPASS` | ❌ | `true` бол домэйн шалгалт алгасна (dev) |
| `RESEND_API_KEY` | ❌ | Resend ашиглах бол |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` | ❌ | SMTP ашиглах бол |
| `EMAIL_USE_ETHERAL` | ❌ | `true` бол Ethereal preview |

Хэрэв ямар нэг email provider тохируулаагүй бол dev console-д линк гарна.

## API endpoint-ууд

### Public
- `GET /api` — endpoint listing
- `GET /api/health` — DB-тэй холбогдсон эсэх
- `GET /api/artifacts` — баталгаажсан олдворын жагсаалт
- `GET /api/artifacts/:slug` — олдворын дэлгэрэнгүй

### Auth
- `POST /api/auth/register-researcher`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/verify-email`
- `POST /api/auth/resend-verification`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

### Researcher
- `POST /api/artifacts` — шинэ олдвор
- `PUT /api/artifacts/:slug` — засах (NEW төлөвт)
- `DELETE /api/artifacts/:slug` — устгах (NEW төлөвт)
- `POST /api/artifacts/:slug/submit` — шалгуулахаар илгээх
- `POST /api/artifacts/:slug/revert` — REJECTED → NEW
- `POST /api/artifacts/upload-model` — 3D файл upload
- `POST /api/reconstruction-jobs/upload` — зургийн багц байршуулах

### Admin
- `POST /api/artifacts/:slug/approve`
- `POST /api/artifacts/:slug/reject` (note шаардлагатай)
- `GET /api/artifacts/admin/queue`
- `GET /api/auth/admin/researchers`
- `POST /api/auth/admin/researchers/:id/verify`
- `POST /api/auth/admin/researchers/:id/revoke`
