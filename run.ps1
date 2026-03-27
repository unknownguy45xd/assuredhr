Write-Host "Starting AssuredHR..." -ForegroundColor Cyan

# =========================
# BACKEND
# =========================
Write-Host "Backend setup..." -ForegroundColor Yellow

Start-Process powershell -ArgumentList @"
cd backend

if (!(Test-Path "venv")) {
    python -m venv venv
}

.\venv\Scripts\Activate.ps1

pip install -r requirements.txt

uvicorn server:app --host 0.0.0.0 --port 8001 --reload
"@

# =========================
# FRONTEND
# =========================
Write-Host "Frontend setup..." -ForegroundColor Yellow

Start-Process powershell -ArgumentList @"
cd frontend

if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force node_modules
}

if (Test-Path "package-lock.json") {
    Remove-Item package-lock.json
}

npm install ajv@8 ajv-keywords@5 --legacy-peer-deps
npm install --legacy-peer-deps

npm start
"@

# =========================
# DONE
# =========================
Write-Host "App launching..." -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000"
Write-Host "Backend: http://localhost:8001"