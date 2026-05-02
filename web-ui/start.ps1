# jcode Web UI Launcher
#
# Usage: .\start.ps1
#
# Starts jcode server and opens web UI in browser

# Note: For development server on port 9527, use: python -m http.server 9527
# Or run: .\dev-server.bat

param(
    [string]$WebUiPath = "$PSScriptRoot",
    [switch]$NoBrowser,
    [int]$Port = 9527
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   jcode Web UI Launcher" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if jcode is installed
try {
    $jcodeVersion = & jcode version 2>&1
    Write-Host "[OK] jcode found: $jcodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] jcode is not found in PATH" -ForegroundColor Red
    Write-Host "Please install jcode first: https://github.com/1jehuang/jcode" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if server is already running
$gatewayRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:7643/api/health" -TimeoutSec 2 -UseBasicParsing 2>$null
    if ($response.StatusCode -eq 200) {
        $gatewayRunning = $true
        Write-Host "[OK] jcode Gateway already running" -ForegroundColor Green
    }
} catch {
    # Gateway not running, that's fine
}

# Start jcode server if not running
if (-not $gatewayRunning) {
    Write-Host "[1/2] Starting jcode server..." -ForegroundColor Yellow
    Start-Process -FilePath "jcode" -ArgumentList "serve" -WindowStyle Hidden -NoNewWindow
    Start-Sleep -Seconds 2
    Write-Host "[OK] jcode server started" -ForegroundColor Green
} else {
    Write-Host "[1/2] jcode server already running" -ForegroundColor Green
}

# Open web UI
if (-not $NoBrowser) {
    Write-Host "[2/2] Opening web UI..." -ForegroundColor Yellow
    $indexPath = Join-Path $WebUiPath "index.html"
    Start-Process -FilePath $indexPath
    Write-Host "[OK] Web UI opened in browser" -ForegroundColor Green
} else {
    Write-Host "[2/2] Skipping browser (NoBrowser flag set)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   jcode is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "   - jcode Gateway: http://127.0.0.1:7643" -ForegroundColor White
Write-Host "   - Web UI: $indexPath" -ForegroundColor White
Write-Host ""
Write-Host "   Default credentials (if needed):" -ForegroundColor Gray
Write-Host "   jcode pair" -ForegroundColor Gray
Write-Host "==========================================" -ForegroundColor Cyan
