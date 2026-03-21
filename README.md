# Mongolian 3D Heritage System

This repository contains the first MVP implementation of the diploma project
"Mongolian historical heritage interactive 3D web system".

## Stack

- Frontend: React + Vite
- Backend: Express
- Data layer: PostgreSQL
- Planned 3D engine upgrade: Three.js native viewer

## Project Structure

```text
backend/   Express API for heritage records
frontend/  React user interface
render.yaml deployment template for Render
```

## Features in This MVP

- Heritage catalog with search
- Category and province filtering
- Artifact detail page
- Embedded 3D model viewer placeholder
- Deployment-oriented project split
- PostgreSQL-backed data management

## Local Development

Because PowerShell script execution may block `npm`, use `npm.cmd` when needed.

```powershell
npm.cmd install
npm.cmd run dev
```

Or run each app separately:

```powershell
cd backend
npm.cmd install
npm.cmd run db:init
npm.cmd run dev
```

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

## API Endpoints

- `GET /api`
- `GET /api/health`
- `GET /api/artifacts`
- `GET /api/artifacts/:slug`

## PostgreSQL Setup

1. Install and start PostgreSQL locally.
2. Create a database named `mongolian_heritage`.
3. Copy `backend/.env.example` to `backend/.env` and update `DATABASE_URL`.
4. Run:

```powershell
cd backend
npm.cmd install
npm.cmd run db:init
```

After that, start the backend with:

```powershell
npm.cmd run dev
```

Data is no longer stored in local JSON/JS seed files. All records should be created and managed directly in PostgreSQL, either through DBeaver or the API.

## Next Steps

- Add researcher submission and admin approval flow
- Add interactive map view
- Replace embedded iframe with native Three.js viewer
- Add authentication and role-based access control
