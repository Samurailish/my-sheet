@echo off
setlocal

cd /d "%~dp0"

echo.
echo === Git status ===
git status
echo.

set /p msg=Commit message (leave empty to cancel): 
if "%msg%"=="" (
  echo Cancelled.
  pause
  exit /b 0
)

git add -A
git commit -m "%msg%"
if errorlevel 1 (
  echo.
  echo Commit failed (maybe nothing changed).
  pause
  exit /b 1
)

git push
if errorlevel 1 (
  echo.
  echo Push failed.
  pause
  exit /b 1
)

echo.
echo ✅ Pushed successfully.
pause
