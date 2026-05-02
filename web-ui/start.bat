@echo off
REM jcode Web UI Startup Script
REM Starts jcode server and opens web UI

echo ==========================================
echo    jcode Web UI Launcher
echo ==========================================
echo.

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0
set WEB_UI_DIR=%SCRIPT_DIR%web-ui

REM Check if jcode is installed
where jcode >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] jcode is not found in PATH
    echo Please install jcode first: https://github.com/1jehuang/jcode
    pause
    exit /b 1
)

REM Start jcode server in background
echo [1/2] Starting jcode server...
start "jcode-server" jcode serve

REM Wait a moment for server to start
timeout /t 2 /nobreak >nul

REM Open web UI in default browser
echo [2/2] Opening web UI...
start "" "%WEB_UI_DIR%\index.html"

echo.
echo ==========================================
echo    jcode is starting!
echo.
echo    - jcode server: running in background
echo    - Web UI: opening in browser
echo.
echo    Gateway API available at: http://127.0.0.1:7643
echo ==========================================

REM Done
