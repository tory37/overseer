#!/bin/bash

# Script to start the Overseer frontend and backend locally for development

# --- Configuration ---
PROJECT_ROOT=$(pwd)

echo "--- Starting Overseer Development Environment ---"
echo "To run the frontend and backend simultaneously, please open two separate terminal windows."
echo "In the first terminal, navigate to '$PROJECT_ROOT' and run: ./start_backend_dev.sh"
echo "In the second terminal, navigate to '$PROJECT_ROOT' and run: ./start_frontend_dev.sh"
echo ""
echo "Press Ctrl+C in each terminal to stop the respective process."
echo ""
echo "Note: This script has been updated to facilitate debugging. The backend and frontend must now be started in separate terminals."

# --- Cleanup existing processes ---
echo "--- Attempting to clean up any previously running processes from old start_dev.sh ---"
# Kill uvicorn processes on the specified port or associated with the app
pgrep -f "uvicorn backend.main:app" | xargs kill -9 2>/dev/null
# Kill node processes running in the frontend directory
pgrep -f "node .*$PROJECT_ROOT/frontend" | xargs kill -9 2>/dev/null
sleep 1
echo "Cleanup attempt complete."

