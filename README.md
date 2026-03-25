# Mongolian 3D Heritage System

Энэ repository нь Монголын түүхэн өвийг хайлт, 3D үзүүлэн, фотограмметрийн туршилтын урсгал, мөн role-based судлаачийн бүртгэлийн боломжтойгоор хөгжүүлж буй дипломын ажлын MVP хувилбар юм.

## Stack

- Frontend: React + Vite
- Backend: Express
- Database: PostgreSQL
- Upload: local file storage
- 3D туршилтын урсгал: photogrammetry placeholder pipeline

## Одоогийн боломжууд

- Өвийн бүртгэлийн каталог
- Хайлт болон шүүлтүүр
- Дэлгэрэнгүй хуудас
- PostgreSQL дээр суурилсан өгөгдөл удирдлага
- Олон зураг upload хийж reconstruction job үүсгэх туршилтын модуль
- Судлаач бүртгэл, нэвтрэлт, role-based эрх
- Баталгаажуулах баримтын зурагтай илүү бүрэн судлаачийн бүртгэл

## Local Development

PowerShell дээр `npm` script execution асуудал гарвал `npm.cmd` ашиглана.

### Backend

```powershell
cd backend
npm.cmd install
npm.cmd run db:init
npm.cmd run dev
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

Schema шинэчлэгдсэн үед `db:init`-ийг дахин ажиллуулж шинэ table, column-уудаа үүсгэнэ.

## Судлаачийн эрхийн урсгал

Системд дараах auth урсгал нэмэгдсэн:

- Тусдаа `register` болон `login` хуудас
- Байгууллагын мэдээлэл, албан тушаал, байгууллагын имэйл оруулах
- Баталгаажуулах үнэмлэх эсвэл баримтын зураг upload хийх
- Session token localStorage дээр хадгалах
- Зөвхөн `researcher` эсвэл `admin` role-той хэрэглэгч шинэ дурсгал нэмэх

Турших дараалал:

1. Backend schema-г шинэчил:
```powershell
cd backend
npm.cmd run db:init
```
2. Frontend дээр `/register` хуудас руу орж шинэ хэрэглэгчийн бүртгэл үүсгэ.
3. `/login` хуудас дээр нэвтэр.
4. `/artifacts/new` хуудас руу орж шинэ дурсгал нэм.

## Фотограмметрийн туршилтын урсгал

Системд `/reconstruction-lab` хуудас нэмэгдсэн. Энэ хэсэг дээр:

- олон зураг upload хийх
- PostgreSQL дээр photo set, images, reconstruction job хадгалах
- queue, processing, completed төлвийг харах
- reconstruction чанарын туршилтын тайлан авах

Одоогийн хязгаарлалт:

- Энэ worker нь бодит mesh эсвэл GLB файл үүсгэхгүй
- зөвхөн pipeline, өгөгдлийн бүтэц, upload flow, tracking-ийг турших зориулалттай

Дараагийн шатанд дараах engine-үүдийг холбоход бэлэн:

- COLMAP
- Meshroom
- OpenMVG + OpenMVS

## API

- `GET /api`
- `GET /api/health`
- `GET /api/artifacts`
- `GET /api/artifacts/:slug`
- `POST /api/artifacts`
- `PUT /api/artifacts/:slug`
- `DELETE /api/artifacts/:slug`
- `POST /api/auth/register-researcher`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/reconstruction-jobs`
- `GET /api/reconstruction-jobs/:id`
- `POST /api/reconstruction-jobs/upload`
