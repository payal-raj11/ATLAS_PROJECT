Write-Host "Starting ATLAS backend..."

$root = $PSScriptRoot
$backendPath = Join-Path $root "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$backendPath`"; npm start"

Start-Sleep -Seconds 4

Write-Host "Starting all seven portals..."

$apps = @(
    "login-page",
    "central-authority",
    "state-authority",
    "village-survey",
    "landowner-dashboard",
    "survey-officer",
    "district-authority"
)

foreach ($app in $apps) {
    $appPath = Join-Path $root "frontends\$app"
    if (Test-Path $appPath) {
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$appPath`"; npm run dev"
    } else {
        Write-Host "Skipping $app - folder not found at $appPath"
    }
}

Write-Host ""
Write-Host "All windows launched. Wait 10-15 seconds, then open http://localhost:5173"
