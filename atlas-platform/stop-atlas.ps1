$ports = 5000, 5173, 5174, 5175, 5176, 5177, 5178, 5179

$stoppedAny = $false

foreach ($port in $ports) {
    $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    foreach ($conn in $conns) {
        $targetId = $conn.OwningProcess
        $proc = Get-Process -Id $targetId -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "Stopping process on port $port"
            Stop-Process -Id $targetId -Force
            $stoppedAny = $true
        }
    }
}

if ($stoppedAny -eq $false) {
    Write-Host "Nothing found running on ATLAS ports - already stopped."
} else {
    Write-Host "Done. Terminal windows will stay open but the processes are stopped."
}
