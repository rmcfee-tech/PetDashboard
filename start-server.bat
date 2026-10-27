@echo off
REM Pet Dashboard launcher for Windows.
REM Browsers block ES modules and offline caching when a page is opened
REM directly as a file:// URL, so this starts a small local static file
REM server (no internet access, nothing installed) and opens the app in
REM your default browser via http://localhost.

setlocal
set PORT=8934
cd /d "%~dp0"

where python >nul 2>nul
if %errorlevel%==0 (
    echo Starting local server on http://localhost:%PORT% ...
    start "" http://localhost:%PORT%/index.html
    python -m http.server %PORT%
    goto :eof
)

where py >nul 2>nul
if %errorlevel%==0 (
    echo Starting local server on http://localhost:%PORT% ...
    start "" http://localhost:%PORT%/index.html
    py -m http.server %PORT%
    goto :eof
)

where node >nul 2>nul
if %errorlevel%==0 (
    echo Starting local server on http://localhost:%PORT% ...
    start "" http://localhost:%PORT%/index.html
    npx --yes serve -l %PORT% .
    goto :eof
)

echo Could not find Python or Node.js on this computer.
echo Install Python from https://python.org (check "Add to PATH" during setup)
echo then double-click this file again.
pause
