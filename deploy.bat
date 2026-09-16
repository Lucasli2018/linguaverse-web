@echo off
chcp 65001 >nul
powershell -ExecutionPolicy Bypass -File "%~dp0deploy.ps1" %*
pause
