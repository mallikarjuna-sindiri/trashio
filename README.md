# Trashio (Smart Waste Management)

Monorepo:
- Client: React (Vite) in `client/`
- Server: FastAPI + MongoDB in `server/`

## Run locally

### 1) Server (FastAPI)
1. Configure env:
   - Copy `server/.env.example` to `server/.env`
   - Set `MONGODB_URI` to your MongoDB Atlas URI
   - Set `JWT_SECRET` to a strong random value
2. Install:
   - `cd server`
   - `pip install -r requirements.txt`
3. Run:
   - `uvicorn --app-dir server app.main:app --reload --host 0.0.0.0 --port 8000`
4. Swagger:
   - http://127.0.0.1:8000/docs

### 2) Client (React)
1. Configure env:
   - Copy `client/.env.example` to `client/.env`
   - Ensure `VITE_API_BASE_URL=http://localhost:8000/api`
2. Install:
   - `cd client`
   - `npm install`
3. Run:
   - `npm run dev`

## Current MVP features
- Register/Login with roles: `citizen | cleaner | admin`
- Citizen:
  - Create report (before image + location)
  - View own reports (polling refresh)
- Admin:
  - List reports by status
  - Approve/Reject report
  - Assign cleaner (paste cleaner id for now)
  - Approve/Reject cleaning proof
- Cleaner:
  - View assigned reports
  - Upload after image proof

## Deployment

### Client -> Vercel
- Import the repo
- Set Root Directory: `client`
- Build Command: `npm run build`
- Output Directory: `dist`
- Env: `VITE_API_BASE_URL=https://<your-render-api>/api`

### Server -> Render
- Create a Web Service from repo
- Root Directory: `server`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Env vars:
  - `MONGODB_URI`
  - `MONGODB_DB=trashio`
  - `JWT_SECRET`
  - `CORS_ORIGINS=https://<your-vercel-app>`

MongoDB: use MongoDB Atlas.
