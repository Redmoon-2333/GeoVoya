@echo off
setlocal
title GeoVoya - Stop
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0platform\tools\stop.ps1"
if errorlevel 1 (
    echo.
    echo Could not stop the services. See the error above.
    pause
    exit /b 1
)
endlocal
