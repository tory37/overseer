#!/bin/bash

# Script to start the Overseer frontend and backend locally for development

# --- Configuration ---
BACKEND_PORT=8000
FRONTEND_PORT=3000
PROJECT_ROOT=$(pwd)

# --- Cleanup existing processes ---
echo "--- Cleaning up existing processes ---"
# Kill uvicorn processes on the specified port or associated with the app
# pgrep -f allows searching by full command line
pgrep -f "uvicorn backend.main:app --reload --port $BACKEND_PORT" | xargs kill -9 2>/dev/null
# Kill node processes running in the frontend directory
pgrep -f "node .*$PROJECT_ROOT/frontend" | xargs kill -9 2>/dev/null
# Give it a moment to terminate
sleep 1
echo "Killed any existing backend/frontend processes."

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

echo "Starting FastAPI backend on http://localhost:$BACKEND_PORT in background..."
nohup uvicorn backend.main:app --reload --port "$BACKEND_PORT" > backend_dev.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID (logging to backend_dev.log)"

# Give backend a moment to start
sleep 3

# --- Frontend Setup and Start ---
echo "--- Starting Frontend ---"
cd "$PROJECT_ROOT/frontend"

# Check if node_modules exist
if [ ! -d "node_modules" ]; then
    echo "node_modules not found in frontend/. Please run 'npm install' in frontend/ first."
    exit 1
fi

echo "Starting React frontend development server on http://localhost:$FRONTEND_PORT in foreground..."
echo "Press Ctrl+C to stop the frontend and return to the prompt."
echo "Backend will continue to run in the background."

# Run frontend directly in the foreground
npm run dev -- --port "$FRONTEND_PORT"
# Note: This will block the script until the user stops the frontend with Ctrl+C

# --- Final status (only reached if frontend is stopped) ---
echo ""
echo "Frontend process stopped. You may need to manually stop the backend."
echo "Backend PID: $BACKEND_PID (running in background)"
echo "To stop the backend: kill $BACKEND_PID"
echo "Or run 'killall uvicorn' to stop any uvicorn processes."
