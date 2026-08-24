@echo off
setlocal enabledelayedexpansion
title Revelation Museum Launcher

:: Determine absolute base directory from batch file path
set "BASE_DIR=%~dp0"
set "RUNTIME_DIR=%BASE_DIR%runtime"

:: Check if debug flag was passed
set "WINDOW_STYLE=Hidden"
for %%A in (%*) do (
    if /I "%%A"=="--debug" set "WINDOW_STYLE=Normal"
    if /I "%%A"=="-debug" set "WINDOW_STYLE=Normal"
)

:: Execute the central PowerShell launcher with bypassed execution policy
powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle %WINDOW_STYLE% -File "%RUNTIME_DIR%\launcher.ps1" %*

exit /b %ERRORLEVEL%
