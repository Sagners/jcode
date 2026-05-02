@echo off
REM jcode Web UI Dev Server
REM Starts a local development server on port 9527

echo ==========================================
echo    jcode Web UI Dev Server
echo ==========================================
echo.
echo Starting development server on http://localhost:9527
echo.

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0

REM Start Python HTTP server on port 9527
cd /d "%SCRIPT_DIR%"
start "jcode-web-server" python -m http.server 9527

echo Server started!
echo.
echo Access the web UI at: http://localhost:9527
echo.
echo Press Ctrl+C in the server window to stop, or close the window.
echo.

REM Open browser automatically
start http://localhost:9527