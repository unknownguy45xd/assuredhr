# AssuredHR Setup Guide (MongoDB + Local Storage + JWT)

This guide matches the rebuilt backend.

## 1) Prerequisites

- Python 3.10+
- Node 18+
- MongoDB Atlas cluster (or local MongoDB)

## 2) Backend structure

```text
backend/
  server.py
  db.py
  auth.py
  models.py
```

## 3) Backend environment

Create `backend/.env` from example:

```bash
cd backend
cp .env.example .env
```

Fill values:

```env
MONGO_URL=mongodb+srv://<username>:<password>@<cluster-url>/<db>?retryWrites=true&w=majority
DB_NAME=assuredhr

JWT_SECRET_KEY=change-me-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRE_HOURS=24

# Optional: defaults to ./storage inside backend folder
LOCAL_STORAGE_ROOT=./storage
```

## 4) Install and run backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
uvicorn server:app --reload --port 8001
```

Backend will run at `http://127.0.0.1:8001`.

## 5) Create first admin user

Register an admin once before login:

```bash
curl -X POST http://127.0.0.1:8001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@assured.com","password":"admin1234","full_name":"System Admin","role":"admin"}'
```

Then use the same credentials on the frontend login page.

## 6) Frontend

```bash
cd frontend
cp .env.example .env
# ensure REACT_APP_BACKEND_URL=http://localhost:8001
npm install
npm start
```

## 7) File storage behavior

Uploaded files are stored on local disk under:

```text
backend/storage/uploads/...
```

and served from:

```text
/static/<path>
```

## 8) Route compatibility

Backend supports existing frontend route patterns:

- Auth: `/auth/login`, `/auth/register`, `/auth/me`
- Main API prefix: `/api/...`
- Guard / employee / attendance / leave / payroll / onboarding / recruitment routes
- Document upload and verification:
  - `POST /api/documents/upload`
  - `POST /api/employee/documents/upload`
  - `PUT /api/documents/{id}/verify`

## 9) Quick smoke tests

```bash
curl http://127.0.0.1:8001/health

curl -X POST http://127.0.0.1:8001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@assured.com","password":"admin1234"}'
```

Then pass returned token:

```bash
-H "Authorization: Bearer <TOKEN>"
```
