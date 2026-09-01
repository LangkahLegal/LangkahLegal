#!/bin/bash
# Vercel build script for FastAPI backend

# Exit on error
set -e

echo "Installing Python dependencies..."

# Use Python's pip to install from backend/requirements.txt
python3 -m pip install --upgrade pip setuptools wheel

# Install requirements from backend directory
cd backend
python3 -m pip install -r requirements.txt
cd ..

echo "Build complete!"
