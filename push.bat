@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo.
echo ============================
echo   GIT QUICK PUSH (SAFE)
echo ============================
echo.

REM Make sure git exists
git --version >nul 2>&1
if errorlevel 1 (
  echo ERROR: Git is not installed or not in PATH.
  pause
  exit /b 1
)

REM Show status
git status

REM Stop if there are merge conflicts
for /f %%i in ('git diff --name-only --diff-filter=U') do (
  echo.
  echo ERROR: Merge conflict detected in: %%i
  echo Fix conflicts first, then run again.
  pause
  exit /b 1
)

echo.
set /p msg=Commit message (leave empty for timestamp): 

if "%msg%"=="" (
  for /f "tokens=1-3 delims=/ " %%a in ('date /t') do set d=%%a-%%b-%%c
  for /f "tokens=1-2 delims=: " %%a in ('time /t') do set t=%%a%%b
  set msg=Update !d!_!t!
)

echo.
echo Staging changes...
git add -A
if errorlevel 1 (
  echo ERROR: git add failed.
  pause
  exit /b 1
)

echo.
echo Committing...
git commit -m "%msg%"
if errorlevel 1 (
  echo NOTE: Nothing to commit (maybe no changes).
)

echo.
echo Pushing...
git push
if errorlevel 1 (
  echo.
  echo ERROR: Push failed.
  echo - If it says "rejected", run: git pull --rebase
  echo - Then run this script again.
  pause
  exit /b 1
)

echo.
echo ✅ Done.
pause
