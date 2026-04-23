#!/bin/bash

# Script to start the Overseer backend locally for development in the foreground

# --- Configuration ---
BACKEND_PORT=8000
PROJECT_ROOT=$(pwd)

# --- Cleanup existing processes (optional, can be done manually) ---
echo "--- Ensuring no conflicting backend processes are running ---"
# Kill uvicorn processes on the specified port or associated with the app
pgrep -f "uvicorn backend.main:app" | xargs kill -9 2>/dev/null
sleep 1
echo "Killed any existing backend processes."

# --- Backend Setup and Start ---
echo "--- Starting Backend ---"
cd "$PROJECT_ROOT"

# Activate Python virtual environment using uv
if [ -d ".venv" ]; then
    echo "Activating Python virtual environment..."
    source .venv/bin/activate
else
    echo "No .venv found. Please ensure Python dependencies are installed."
    echo "You might need to run 'uv venv' and 'uv pip install -e .' first."
    exit 1
fi

echo "Starting FastAPI backend on http://localhost:$BACKEND_PORT in foreground..."
echo "Press Ctrl+C to stop the backend."

# Run uvicorn in the foreground
uvicorn backend.main:app --reload --port "$BACKEND_PORT"

echo "Backend process stopped."
