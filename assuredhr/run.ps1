# ============================================================
#  AssuredHR -- Dev Launcher
#  Usage: powershell -ExecutionPolicy Bypass -File run.ps1
# ============================================================

$ErrorActionPreference = "Stop"
$root         = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath  = Join-Path $root "backend"
$frontendPath = Join-Path $root "frontend"
$envFile      = Join-Path $backendPath ".env"

function Info ($msg) { Write-Host "  $msg" -ForegroundColor Cyan   }
function Ok   ($msg) { Write-Host "  [OK] $msg" -ForegroundColor Green  }
function Warn ($msg) { Write-Host "  [!!] $msg" -ForegroundColor Yellow }
function Err  ($msg) { Write-Host "  [XX] $msg" -ForegroundColor Red    }

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   AssuredHR -- Starting Development Server    " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# ---- Sanity checks -----------------------------------------
if (-not (Test-Path $backendPath)) {
    Err "Backend folder not found: $backendPath"
    exit 1
}

if (-not (Test-Path $frontendPath)) {
    Err "Frontend folder not found: $frontendPath"
    exit 1
}

if (-not (Test-Path $envFile)) {
    Warn ".env not found in backend -- checking for .env.example"
    $example = Join-Path $backendPath ".env.example"
    if (Test-Path $example) {
        Copy-Item $example $envFile
        Ok "Copied .env.example to .env (edit backend\.env with your real values)"
    } else {
        Warn "No .env.example found -- backend may fail without env vars"
    }
}

# ---- Kill anything on ports 3000 / 8001 -------------------
function Kill-Port ($port) {
    $lines = netstat -ano 2>$null | Select-String ":$port\s"
    foreach ($line in $lines) {
        $parts = ($line -split '\s+')
        $pid2  = $parts[-1]
        if ($pid2 -match '^\d+$' -and $pid2 -ne '0') {
            try { Stop-Process -Id ([int]$pid2) -Force -ErrorAction SilentlyContinue } catch {}
        }
    }
}

Info "Freeing ports 3000 and 8001..."
Kill-Port 3000
Kill-Port 8001
Start-Sleep -Milliseconds 600

# ---- Backend window ----------------------------------------
Info "Launching backend on port 8001..."

$backendScript = @"
`$Host.UI.RawUI.WindowTitle = 'AssuredHR - Backend :8001'
Set-Location '$backendPath'

Write-Host '---- Backend Setup ----' -ForegroundColor Yellow

if (-not (Test-Path 'venv')) {
    Write-Host 'Creating virtual environment...' -ForegroundColor Cyan
    python -m venv venv
}

. .\venv\Scripts\Activate.ps1

Write-Host 'Installing Python dependencies...' -ForegroundColor Cyan
pip install -r requirements.txt --quiet

Write-Host ''
Write-Host 'Backend running at http://localhost:8001' -ForegroundColor Green
Write-Host 'API Docs at http://localhost:8001/docs'  -ForegroundColor Green
Write-Host ''
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendScript

# ---- Frontend window ---------------------------------------
Info "Launching frontend on port 3000..."

$frontendScript = @"
`$Host.UI.RawUI.WindowTitle = 'AssuredHR - Frontend :3000'
Set-Location '$frontendPath'

Write-Host '---- Frontend Setup ----' -ForegroundColor Yellow

if (-not (Test-Path 'node_modules')) {
    Write-Host 'node_modules not found -- running npm install...' -ForegroundColor Cyan
    npm install --legacy-peer-deps
}

Write-Host ''
Write-Host 'Frontend running at http://localhost:3000' -ForegroundColor Green
Write-Host ''
npm start
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendScript

# ---- Summary -----------------------------------------------
Write-Host ""
Ok "Both servers are starting in separate windows."
Write-Host ""
Write-Host "  Frontend  -->  http://localhost:3000"     -ForegroundColor White
Write-Host "  Backend   -->  http://localhost:8001"     -ForegroundColor White
Write-Host "  API Docs  -->  http://localhost:8001/docs" -ForegroundColor White
Write-Host ""
Warn "Wait ~10 seconds for both servers to finish starting before opening the browser."
Write-Host ""