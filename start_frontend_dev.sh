#!/bin/bash

# Script to start the Overseer frontend locally for development

# --- Configuration ---
FRONTEND_PORT=3000
PROJECT_ROOT=$(pwd)

# --- Cleanup existing processes (optional, can be done manually) ---
echo "--- Ensuring no conflicting frontend processes are running ---"
# Kill node processes running in the frontend directory
pgrep -f "node .*$PROJECT_ROOT/frontend" | xargs kill -9 2>/dev/null
sleep 1
echo "Killed any existing frontend processes."

# --- Frontend Setup and Start ---
echo "--- Starting Frontend ---"
cd "$PROJECT_ROOT/frontend"

# Check if node_modules exist
if [ ! -d "node_modules" ]; then
    echo "node_modules not found in frontend/. Please run 'npm install' in frontend/ first."
    exit 1
fi

echo "Starting React frontend development server on http://localhost:$FRONTEND_PORT in foreground..."
echo "Press Ctrl+C to stop the frontend."

# Run frontend directly in the foreground
npm run dev -- --port "$FRONTEND_PORT"

echo "Frontend process stopped."
