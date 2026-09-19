# start-atlas-silent.ps1
#
# Same as start-atlas.ps1, but nothing is shown on screen -- no
# terminal windows pop up at all. Each app's output goes to a log
# file instead, in case something needs troubleshooting later.
#
# You won't normally run this file directly -- double-click
# "Start ATLAS.vbs" instead, which launches this with zero visible
# windows, not even a flash of one.

$root = $PSScriptRoot
$logsDir = Join-Path $root "logs"
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir | Out-Null
}

function Start-AtlasHidden {
    param(
        [string]$Name,
        [string]$Path,
        [string]$Command
    )
    if (-not (Test-Path $Path)) {
        return
    }
    $logFile = Join-Path $logsDir "$Name.log"
    $fullCommand = "cd /d `"$Path`" && $Command > `"$logFile`" 2>&1"
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c", $fullCommand -WindowStyle Hidden
}

Start-AtlasHidden -Name "backend" -Path (Join-Path $root "backend") -Command "npm start"

Start-Sleep -Seconds 5

Start-AtlasHidden -Name "login-page"          -Path (Join-Path $root "frontends\login-page")          -Command "npm run dev"
Start-AtlasHidden -Name "central-authority"   -Path (Join-Path $root "frontends\central-authority")   -Command "npm run dev"
Start-AtlasHidden -Name "state-authority"     -Path (Join-Path $root "frontends\state-authority")     -Command "npm run dev"
Start-AtlasHidden -Name "village-survey"      -Path (Join-Path $root "frontends\village-survey")      -Command "npm run dev"
Start-AtlasHidden -Name "landowner-dashboard" -Path (Join-Path $root "frontends\landowner-dashboard") -Command "npm run dev"
Start-AtlasHidden -Name "survey-officer"      -Path (Join-Path $root "frontends\survey-officer")      -Command "npm run dev"
Start-AtlasHidden -Name "district-authority"  -Path (Join-Path $root "frontends\district-authority")  -Command "npm run dev"

Start-Sleep -Seconds 8

Start-Process "http://localhost:5173"
