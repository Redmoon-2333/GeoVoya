@echo off
setlocal
title GeoVoya
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0platform\tools\start.ps1" -OpenBrowser %*
if errorlevel 1 (
    echo.
    echo Startup failed. See the error above and platform\.runtime logs.
    pause
    exit /b 1
)
endlocal
