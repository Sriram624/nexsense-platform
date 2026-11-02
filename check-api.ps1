$ErrorActionPreference = 'Stop'
$uri = 'http://localhost:8080/api/health'
try {
  Invoke-RestMethod -Uri $uri -TimeoutSec 5 | ConvertTo-Json -Depth 5
} catch {
  Write-Error "Cannot reach $uri. Start the stack with .\run.ps1 and inspect .\logs.ps1"
}
