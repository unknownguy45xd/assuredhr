# Assured Security Services - Setup Guide (Cloudinary Edition)

## Prerequisites
- Python 3.11+
- Node 18+
- MongoDB

## Backend setup
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Update `backend/.env`:
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=assured_security_db
JWT_SECRET_KEY=change-me-in-production
CORS_ORIGINS=http://localhost:3000
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Run backend:
```bash
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

## Frontend setup
```bash
cd frontend
cp .env.example .env
yarn install
```

Update `frontend/.env`:
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

Run frontend:
```bash
yarn start
```

## Upload behavior
- All uploads now use Cloudinary via backend upload endpoints:
  - `POST /api/upload`
  - `POST /api/documents/upload`
  - `POST /api/employee/documents/upload`

## Deploy
- Backend start command:
```bash
uvicorn server:app --host 0.0.0.0 --port ${PORT:-8001}
```
- Frontend build:
```bash
yarn build
```
- SPA routing configured with:
  - `frontend/vercel.json`
  - `frontend/public/_redirects`
