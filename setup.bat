@echo off
setlocal
echo Checking for Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed. Attempting to install Node.js 22 via winget...
    winget install --id OpenJS.NodeJS.LTS --version 22.14.0 --source winget
    if %errorlevel% neq 0 (
        echo Winget failed. Please install Node.js 22 manually from https://nodejs.org/
        pause
        exit /b %errorlevel%
    )
    echo Node.js installed. You may need to restart your computer or terminal for changes to take effect.
) else (
    echo Node.js is already installed.
)

echo Installing project dependencies...
call npm install
if %errorlevel% neq 0 (
    echo npm install failed.
    pause
    exit /b %errorlevel%
)

echo.
echo Setup complete! Use run.bat to start the application.
pause
