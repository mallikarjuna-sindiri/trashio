# Trashio Server (FastAPI)

## Local run
1. Create env file:
   - Copy `.env.example` to `.env` and fill values.
2. Install deps:
   - `pip install -r requirements.txt`
3. Run:
   - `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`

## Environment
- `MONGODB_URI` (MongoDB Atlas connection string)
- `MONGODB_DB` (default: `trashio`)
- `JWT_SECRET` (strong random string)
- `JWT_ALGORITHM` (default: `HS256`)
- `ACCESS_TOKEN_EXPIRE_MINUTES` (default: `10080`)
- `CORS_ORIGINS` (comma-separated list, e.g. `http://localhost:5173`)
- `GOOGLE_CLIENT_ID` (Google OAuth client ID)
- `RESET_PASSWORD_URL_BASE` (e.g. `http://localhost:5173/reset-password`)
- `RESET_TOKEN_EXPIRE_MINUTES` (default: `30`)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, `SMTP_USE_TLS` (Gmail SMTP settings)

## Deploy (Render)
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
