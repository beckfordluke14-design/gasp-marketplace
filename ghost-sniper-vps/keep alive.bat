@echo off
set /a session_id=0
for /f "tokens=3" %%i in ('query session %username% ^| findstr /i "Active"') do (
    set session_id=%%i
)

if %session_id%==0 (
    echo [❌] Could not detect active session ID. 
    echo Please run this from INSIDE the RDP session.
    pause
    exit
)

echo [✅] Found Active Session: %session_id%
echo [🚀] Transferring session to console to keep Chrome ALIVE...
tscon %session_id% /dest:console

if %errorlevel% neq 0 (
    echo [❌] Failed to transfer session. 
    echo Try right-clicking this file and 'Run as Administrator'.
    pause
)
