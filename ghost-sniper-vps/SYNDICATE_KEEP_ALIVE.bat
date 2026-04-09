@echo off
setlocal enabledelayedexpansion
:: ============================================================
:: 🛰️ SYNDICATE SOVEREIGN KEEP-ALIVE (v1.0)
:: ============================================================
:: USE THIS INSTEAD OF THE 'X' BUTTON TO DISCONNECT FROM RDP.
:: It keeps the GUI session and all bots active 24/7.
:: ============================================================

echo [!] Scanning for Active Session ID...
set session_id=0
for /f "tokens=3" %%i in ('query session %username% ^| findstr /i "Active"') do (
    set session_id=%%i
)

if %session_id%==0 (
    echo [!] ERROR: Could not detect active session ID.
    echo [!] Make sure you are running this from INSIDE the RDP session.
    pause
    exit
)

echo [OK] Found Active Session: %session_id%
echo [OK] Kicking session to Console to keep Bots ALIVE...

:: 1. SMART CHECK FOR SOVEREIGN CHROME
netstat -ano | findstr :9222 > nul
if %errorlevel% neq 0 (
    echo [!] Chrome Debugger missing. Starting Sovereign Instance...
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
    timeout /t 5 >nul
) else (
    echo [OK] Sovereign Chrome is active on port 9222.
)

:: 2. SMART CHECK FOR VIDEO FACTORY
tasklist /V /FI "IMAGENAME eq node.exe" | findstr /I "GHOST_VIDEO_GEN.js" > nul
if %errorlevel% neq 0 (
    echo [!] Factory Offline. Starting NEW instance...
    start "SYNDICATE_FACTORY" node "C:\Users\Administrator\Desktop\GHOST_VIDEO_GEN.js"
) else (
    echo [OK] Syndicate Video Factory is active.
)

:: 3. SMART CHECK FOR YOUTUBE SNIPER
tasklist /V /FI "IMAGENAME eq node.exe" | findstr /I "GHOST_YOUTUBE_UPLOADER.js" > nul
if %errorlevel% neq 0 (
    echo [!] Sniper Offline. Starting NEW instance...
    start "SYNDICATE_SNIPER" node "C:\Users\Administrator\Desktop\GHOST_YOUTUBE_UPLOADER.js"
) else (
    echo [OK] Syndicate YouTube Sniper is active.
)

echo [!] DISCONNECTING IN 3 SECONDS...
timeout /t 3 >nul

:: THE MAGIC LINE: PERSIST SESSION ON CONSOLE
tscon %session_id% /dest:console

if %errorlevel% neq 0 (
    echo [X] Note: tscon failed. Run as Administrator if issues persist.
    pause
)
