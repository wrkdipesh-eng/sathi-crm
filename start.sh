#!/bin/bash
export PATH=/home1/mjwgflte/nodejs/bin:$PATH
cd /home1/mjwgflte/public_html/website_875c4662/crm

# Check if PGlite is running on port 3004
if ! nc -z 127.0.0.1 3004; then
  echo "Starting PGlite..."
  nohup node pglite-server.js > pglite.log 2>&1 &
  sleep 3
fi

# Check if Next.js is running on port 3022
if ! nc -z 127.0.0.1 3022; then
  echo "Starting Next.js..."
  nohup npx next start -p 3022 > next.log 2>&1 &
fi
