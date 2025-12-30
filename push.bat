@echo off
setlocal

echo === Git status ===
git status

echo.
set /p msg=Commit message (leave empty to cancel):
if "%msg%"=="" (
  echo Cancelled.
  exit /b 0
)

echo.
echo === Staging ===
git add -A

echo.
echo === Committing ===
git commit -m "%msg%"
if errorlevel 1 (
  echo Commit failed (maybe no changes). Check git status.
  git status
  exit /b 1
)

echo.
echo === Pushing ===
git push
if errorlevel 1 (
  echo Push failed. Check your remote/auth.
  exit /b 1
)

echo.
echo === Done ===
git log -1 --oneline
git status
pause
