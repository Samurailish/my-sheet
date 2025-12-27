@echo off
setlocal

cd /d %~dp0

echo === Git status ===
git status
echo.

echo === Adding all changes ===
git add -A
echo.

set /p msg=Commit message (example: Fix export): 
if "%msg%"=="" (
  echo Cancelled (empty message).
  pause
  exit /b 1
)

echo === Committing ===
git commit -m "%msg%"
echo.

echo === Pushing ===
git push
echo.

echo === Done. If you saw "Everything up-to-date", you had nothing new committed. ===
pause
