@echo off
setlocal enabledelayedexpansion
title Revelation Museum Launcher

:: Determine base directories
set "BASE_DIR=%~dp0"
set "APP_DIR=%BASE_DIR%app"
set "RUNTIME_DIR=%BASE_DIR%runtime"

:: Launch silently via PowerShell launcher
powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%RUNTIME_DIR%\launcher.ps1"

exit /b 0
