#!/bin/bash

echo "🧹 Cleaning up port 3000..."

# Kill any process running on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "✅ No processes found on port 3000"

echo "🚀 Starting the application..."

# Start the React application
npm start