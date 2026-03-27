Write-Host "Starting backend..."
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $root "backend"
$frontendPath = Join-Path $root "frontend"

if (-not (Test-Path $backendPath)) {
  Write-Error "Backend directory not found: $backendPath"
  exit 1
}

if (-not (Test-Path $frontendPath)) {
  Write-Error "Frontend directory not found: $frontendPath"
  exit 1
}

$backendCommand = @"
Set-Location '$backendPath'
python -m uvicorn server:app --reload --port 8001
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCommand | Out-Null

Write-Host "Starting frontend..."
$frontendCommand = @"
Set-Location '$frontendPath'
if (-not (Test-Path 'node_modules')) {
  Write-Host 'node_modules missing. Running npm install...'
  npm install
}
npm start
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCommand | Out-Null
Write-Host "Backend and frontend started in separate PowerShell windows."
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
