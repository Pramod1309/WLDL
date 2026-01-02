#!/bin/bash

# Exit on any error
set -e

# Install Python dependencies
echo "Installing Python dependencies..."
cd backend
pip install -r requirements.txt

# Initialize the database
echo "Initializing database..."
python init_db.py

# Start the backend server in the background
echo "Starting backend server..."
python server.py &

# Go to frontend directory
cd ../frontend

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install

# Build the frontend
echo "Building frontend..."
npm run build

# Start the frontend server
echo "Starting frontend server..."
npm start

# Keep the container running
tail -f /dev/null
