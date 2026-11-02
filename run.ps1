$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

Write-Host "`n=== NexSense startup ===" -ForegroundColor Cyan
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw "Docker CLI not found. Install Docker Desktop, then reopen VS Code."
}
try { docker info *> $null } catch {
  throw "Docker Engine is not running. Open Docker Desktop, wait for 'Engine running', then run .\run.ps1 again."
}

# Determine a usable private IPv4 address for a phone on the same Wi-Fi/LAN.
$lanIp = Get-NetIPConfiguration |
  Where-Object { $_.IPv4DefaultGateway -and $_.IPv4Address } |
  ForEach-Object { $_.IPv4Address.IPAddress } |
  Where-Object { $_ -notmatch '^127\.' -and $_ -notmatch '^169\.254\.' } |
  Select-Object -First 1
if (-not $lanIp) { $lanIp = 'YOUR_LAPTOP_LAN_IP' }

$mobileEnv = Join-Path $ProjectRoot 'mobile\.env'
"EXPO_PUBLIC_API_URL=http://${lanIp}:8080" | Set-Content -Path $mobileEnv -Encoding ascii

Write-Host "Building and starting database, MQTT broker and API..." -ForegroundColor Yellow
docker compose up -d --build

Write-Host "Waiting for API health check..." -ForegroundColor Yellow
$healthy = $false
for ($i = 0; $i -lt 45; $i++) {
  try {
    $response = Invoke-RestMethod -Uri 'http://localhost:8080/api/health' -TimeoutSec 3
    if ($response.status -eq 'UP') { $healthy = $true; break }
  } catch { Start-Sleep -Seconds 2 }
}

Write-Host "`n=== NexSense services ===" -ForegroundColor Cyan
docker compose ps
if ($healthy) {
  Write-Host "API: http://localhost:8080/api/health" -ForegroundColor Green
  Write-Host "Phone API: http://${lanIp}:8080/api/health" -ForegroundColor Green
  Write-Host "Mobile config written: mobile\.env" -ForegroundColor Green
} else {
  Write-Warning "Containers started, but API did not become healthy in 90 seconds. Inspect logs with .\logs.ps1"
}
Write-Host "`nNext: connect your phone and laptop to the same Wi-Fi. In a new terminal run: cd mobile; npm install; npx expo start"
Write-Host "To stop services: .\stop.ps1"
