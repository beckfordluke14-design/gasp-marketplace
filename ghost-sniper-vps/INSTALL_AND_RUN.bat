@echo off
TITLE GASP SYNDICATE // GHOST SNIPER
echo [SYNDICATE] Initializing Ghost Activation...

:: 👁️ CHECK FOR NODE
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] NODE.JS NOT FOUND. 
    echo Please go to https://nodejs.org and install the 'LTS' version on this VPS.
    pause
    exit /b
)

echo [SYNDICATE] Installing Neural Bridges (Playwright/Axios)...
call npm install playwright axios --no-audit --no-fund
if %errorlevel% neq 0 (
    echo [ERROR] Dependency installation failed. Check your internet connection.
    pause
    exit /b
)

echo [SYNDICATE] ACTIVATING GHOST DISPATCHER...
node GHOST_DISPATCH.js
pause
