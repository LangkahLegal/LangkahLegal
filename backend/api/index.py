"""
Vercel serverless function entry point for FastAPI

This handler wraps the FastAPI app to work with Vercel's Python runtime.
"""
import sys
import os
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# Import the FastAPI app
from main import app

# Vercel exports the app for ASGI handling
# No additional handler needed - Vercel wraps it automatically
