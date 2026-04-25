#!/bin/bash

# Overseer Release Script
# This script builds the frontend, copies assets to the backend, 
# and pushes to master to ensure uvx pulls the latest built UI.

set -e # Exit on error

echo "🚀 Starting release process..."

# 1. Ensure we are on master and up to date
echo "📌 Checking git status..."
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "master" ]; then
    echo "❌ Error: You must be on the 'master' branch to release."
    exit 1
fi

# 2. Build Frontend
echo "🏗️  Building frontend..."
cd frontend
npm install
npm run build
cd ..

# 3. Clear and Update Static Assets
echo "📂 Updating backend/static assets..."
# Keep the avatars if they are not part of the build but part of the repo
# Otherwise, a simple rm -rf is fine.
rm -rf backend/static/*
mkdir -p backend/static/assets/avatars

# Copy built files from frontend/dist to backend/static
cp -r frontend/dist/* backend/static/

# 4. Commit and Push
echo "💾 Committing build artifacts..."
git add backend/static

# Check if there are changes to commit
if git diff --cached --quiet; then
    echo "✅ No UI changes to commit."
else
    git commit -m "build: update static assets for release"
fi

echo "📤 Pushing to master..."
git push origin master

echo "✨ Release complete! Run 'uvx --refresh --from git+https://github.com/tory37/overseer overseer' to see the changes."
