#!/usr/bin/env bash
# Pet Dashboard launcher for macOS/Linux.
# Browsers block ES modules and offline caching on file:// URLs, so this
# starts a local static file server and opens the app via http://localhost.

PORT=8934
cd "$(dirname "$0")"

open_url() {
  if command -v xdg-open >/dev/null; then xdg-open "http://localhost:$PORT/index.html"
  elif command -v open >/dev/null; then open "http://localhost:$PORT/index.html"
  fi
}

if command -v python3 >/dev/null; then
  echo "Starting local server on http://localhost:$PORT ..."
  (sleep 1 && open_url) &
  python3 -m http.server "$PORT"
elif command -v python >/dev/null; then
  echo "Starting local server on http://localhost:$PORT ..."
  (sleep 1 && open_url) &
  python -m http.server "$PORT"
elif command -v npx >/dev/null; then
  echo "Starting local server on http://localhost:$PORT ..."
  (sleep 1 && open_url) &
  npx --yes serve -l "$PORT" .
else
  echo "Could not find Python or Node.js. Install Python 3 and re-run this script."
  exit 1
fi
