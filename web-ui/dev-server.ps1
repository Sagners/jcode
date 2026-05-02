# jcode Web UI Dev Server
#
# Usage: .\dev-server.ps1
#
# Starts a local development server on port 9527

param(
    [int]$Port = 9527
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   jcode Web UI Dev Server" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if port is already in use
$portInUse = $null -ne (Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue)

if ($portInUse) {
    Write-Host "[WARN] Port $Port is already in use" -ForegroundColor Yellow
    Write-Host "Trying to find and stop existing process..." -ForegroundColor Yellow
    $process = Get-NetTCPConnection -LocalPort $Port | Select-Object -First 1 -ExpandProperty OwningProcess
    if ($process) {
        Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
        Write-Host "[OK] Stopped existing process on port $Port" -ForegroundColor Green
    }
}

# Start HTTP server
Write-Host "[1/1] Starting development server on port $Port..." -ForegroundColor Yellow
$serverJob = Start-Job -ScriptBlock {
    param($port, $webUIPath)
    Set-Location $webUIPath
    python -m http.server $port
} -ArgumentList $Port, $PSScriptRoot

Start-Sleep -Seconds 2

# Check if server started
if ($serverJob.State -eq "Running") {
    Write-Host "[OK] Development server running" -ForegroundColor Green
} else {
    $error = Receive-Job -Job $serverJob
    Write-Host "[ERROR] Failed to start server: $error" -ForegroundColor Red
    exit 1
}

# Open browser
$url = "http://localhost:$Port"
Write-Host "[OK] Opening browser at $url" -ForegroundColor Green
Start-Process -FilePath $url

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   jcode Web UI Dev Server" -ForegroundColor Green
Write-Host ""
Write-Host "   Server:  $url" -ForegroundColor White
Write-Host ""
Write-Host "   Press Ctrl+C in this window to stop server" -ForegroundColor Gray
Write-Host "==========================================" -ForegroundColor Cyan

# Keep running
try {
    while ($serverJob.State -eq "Running") {
        Start-Sleep -Seconds 1
    }
} finally {
    Stop-Job -Job $serverJob -ErrorAction SilentlyContinue
    Remove-Job -Job $serverJob -Force -ErrorAction SilentlyContinue
    Write-Host ""
    Write-Host "Server stopped." -ForegroundColor Yellow
}