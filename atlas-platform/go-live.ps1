# go-live.ps1
#
# Run this ONE command every time you connect to a different WiFi
# network (e.g. arriving at a new venue). It does everything needed
# to make ATLAS reachable to other devices on that network:
#   1. Stops anything currently running
#   2. Sets your current IP for all seven apps
#   3. Opens the backend to accept connections from other devices
#   4. Restarts everything (invisibly, no terminal windows)
#   5. Opens your browser to confirm it worked
#
# USAGE:
#   First run "ipconfig" and find your current WiFi IPv4 address.
#   Then run this, giving it that address:
#
#       .\go-live.ps1 10.58.22.41
#
# Requires stop-atlas.ps1 and start-atlas-silent.ps1 to already be
# in this same folder (from the no-terminal launcher package).

param(
    [Parameter(Mandatory=$true)]
    [string]$IpAddress
)

$root = $PSScriptRoot

Write-Host "Step 1/4: Stopping anything currently running..."
$stopScript = Join-Path $root "stop-atlas.ps1"
if (Test-Path $stopScript) {
    & $stopScript
} else {
    Write-Host "  (stop-atlas.ps1 not found here -- skipping, nothing to stop)"
}
Start-Sleep -Seconds 2

Write-Host "Step 2/4: Setting VITE_HOST=$IpAddress for all seven apps..."
$apps = "login-page", "central-authority", "state-authority", "village-survey", "landowner-dashboard", "survey-officer", "district-authority"
foreach ($app in $apps) {
    $appFolder = Join-Path $root "frontends\$app"
    if (Test-Path $appFolder) {
        $envPath = Join-Path $appFolder ".env"
        [System.IO.File]::WriteAllText($envPath, "VITE_HOST=$IpAddress`r`n", [System.Text.Encoding]::ASCII)
       Write-Host "  $app -> $envPath"
    } else {
        Write-Host "  Skipping $app -- folder not found"
    }
}

Write-Host "Step 3/4: Opening the backend to accept connections from other devices..."
$backendEnvPath = Join-Path $root "backend\.env"
if (Test-Path $backendEnvPath) {
    $lines = Get-Content $backendEnvPath
    $newLines = New-Object System.Collections.Generic.List[string]
    $found = $false
    foreach ($line in $lines) {
        if ($line -like "CLIENT_ORIGINS=*") {
            $newLines.Add("CLIENT_ORIGINS=")
            $found = $true
        } else {
            $newLines.Add($line)
        }
    }
    if ($found -eq $false) {
        $newLines.Add("CLIENT_ORIGINS=")
    }
    $newLines | Set-Content -Path $backendEnvPath
    Write-Host "  backend\.env updated"
} else {
    Write-Host "  backend\.env not found -- you will need to set CLIENT_ORIGINS manually"
}

Write-Host "Step 4/4: Starting everything..."
$startScript = Join-Path $root "start-atlas-silent.ps1"
if (Test-Path $startScript) {
    & $startScript
} else {
    Write-Host "  start-atlas-silent.ps1 not found -- cannot start automatically."
    Write-Host "  Start each app manually instead."
}

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Done. Share this link with anyone on the SAME WiFi network as you:"
Write-Host ""
Write-Host "    http://${IpAddress}:5173"
Write-Host ""

Start-Process "http://${IpAddress}:5173"