# jcode Web UI Launcher
#
# Usage: .\start.ps1
#
# Starts jcode server and opens web UI in browser
# Kills any existing processes on ports 7643 and 9527

param(
    [int]$GatewayPort = 7643,
    [int]$WebUIPort = 9527,
    [string]$JcodePath = "E:\Projects\jcode\target\release\jcode.exe"
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   jcode One-Click Launcher" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# Step 1: Kill processes using target ports
# ============================================
Write-Host "[1/4] Cleaning up ports..." -ForegroundColor Yellow

function Clear-Port {
    param([int]$Port)
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($connections) {
        $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($procId in $pids) {
            $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
            if ($proc) {
                Write-Host "    Killing $($proc.ProcessName) (PID $procId) on port $Port" -ForegroundColor Gray
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            }
        }
        Start-Sleep -Milliseconds 500
    }
}

Clear-Port -Port $GatewayPort
Clear-Port -Port $WebUIPort
Write-Host "    Ports cleared" -ForegroundColor Green

# ============================================
# Step 2: Kill any existing jcode processes
# ============================================
Write-Host "[2/4] Stopping any existing jcode server..." -ForegroundColor Yellow
$jcodeProcs = Get-Process -Name "jcode" -ErrorAction SilentlyContinue
if ($jcodeProcs) {
    foreach ($proc in $jcodeProcs) {
        Write-Host "    Stopping PID $($proc.Id)" -ForegroundColor Gray
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 1
}
Write-Host "    jcode stopped" -ForegroundColor Green

# ============================================
# Step 3: Start jcode server (no --gateway-port flag)
# ============================================
Write-Host "[3/4] Starting jcode server..." -ForegroundColor Yellow

if (-not (Test-Path $JcodePath)) {
    Write-Host "    [WARN] jcode.exe not found at: $JcodePath" -ForegroundColor Yellow
    Write-Host "    Trying system PATH..." -ForegroundColor Yellow
    try {
        $jcodeVersion = & jcode version 2>&1
        Write-Host "    [OK] Found: $jcodeVersion" -ForegroundColor Green

        $jcodeJob = Start-Job -ScriptBlock {
            jcode serve
        }

        Start-Sleep -Seconds 3
        if ($jcodeJob.State -eq "Running") {
            Write-Host "    [OK] jcode server started" -ForegroundColor Green
        } else {
            $error = Receive-Job -Job $jcodeJob
            Write-Host "    [ERROR] Failed: $error" -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "    [ERROR] jcode not found" -ForegroundColor Red
        exit 1
    }
} else {
    $jcodeJob = Start-Job -ScriptBlock {
        param($path)
        Set-Location (Split-Path $path)
        & $path serve
    } -ArgumentList $JcodePath

    Start-Sleep -Seconds 3
    if ($jcodeJob.State -eq "Running") {
        Write-Host "    [OK] jcode server started" -ForegroundColor Green
    } else {
        $error = Receive-Job -Job $jcodeJob
        Write-Host "    [ERROR] Failed: $error" -ForegroundColor Red
        exit 1
    }
}

# Verify gateway is running
$gatewayRunning = $false
for ($i = 0; $i -lt 10; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:$GatewayPort/health" -TimeoutSec 2 -UseBasicParsing 2>$null
        if ($response.StatusCode -eq 200) {
            $gatewayRunning = $true
            break
        }
    } catch { }
    Start-Sleep -Seconds 1
}

if (-not $gatewayRunning) {
    Write-Host "    [WARN] Gateway may not be fully ready" -ForegroundColor Yellow
} else {
    Write-Host "    [OK] Gateway health check passed" -ForegroundColor Green
}

# ============================================
# Step 4: Start web UI dev server
# ============================================
Write-Host "[4/4] Starting web UI on port $WebUIPort..." -ForegroundColor Yellow

$webUIPath = Split-Path -Parent $MyInvocation.MyCommand.Path
if ($webUIPath -eq "") {
    $webUIPath = $PSScriptRoot
}

$serverJob = Start-Job -ScriptBlock {
    param($port, $webUIPath)
    Set-Location $webUIPath
    python -m http.server $port
} -ArgumentList $WebUIPort, $webUIPath

Start-Sleep -Seconds 2

if ($serverJob.State -eq "Running") {
    Write-Host "    [OK] Web UI server running on port $WebUIPort" -ForegroundColor Green
} else {
    $error = Receive-Job -Job $serverJob
    Write-Host "    [ERROR] Failed: $error" -ForegroundColor Red
    exit 1
}

# ============================================
# Done
# ============================================
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   jcode is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "   - Gateway:  http://127.0.0.1:$GatewayPort" -ForegroundColor White
Write-Host "   - Web UI:   http://localhost:$WebUIPort" -ForegroundColor White
Write-Host ""
Write-Host "   Press Ctrl+C in this window to stop" -ForegroundColor Gray
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Open browser
$url = "http://localhost:$WebUIPort"
Write-Host "Opening browser at $url..." -ForegroundColor Yellow
Start-Process -FilePath $url

# Keep running
try {
    while ($jcodeJob.State -eq "Running" -or $serverJob.State -eq "Running") {
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host ""
    Write-Host "Stopping services..." -ForegroundColor Yellow
    Stop-Job -Job $jcodeJob -ErrorAction SilentlyContinue
    Stop-Job -Job $serverJob -ErrorAction SilentlyContinue
    Remove-Job -Job $jcodeJob, $serverJob -Force -ErrorAction SilentlyContinue

    # Kill any remaining jcode
    Get-Process -Name "jcode" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

    Write-Host "Services stopped." -ForegroundColor Yellow
}