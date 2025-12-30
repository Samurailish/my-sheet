@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo === Git status ===
git status
echo.

echo === Stage all changes ===
git add -A

echo.
set /p msg=Commit message (leave empty to cancel): 
if "%msg%"=="" (
  echo Cancelled.
  pause
  exit /b 1
)

echo.
echo === Commit ===
git commit -m "%msg%"
if errorlevel 1 (
  echo Commit failed (maybe nothing changed). Check status above.
  pause
  exit /b 1
)

echo.
echo === Push ===
git push

echo.
echo Done.
pause
