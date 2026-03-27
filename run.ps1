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
