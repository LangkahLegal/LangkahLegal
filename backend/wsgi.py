"""
Vercel Python Runtime Handler
Exports the FastAPI app for Vercel serverless
"""
import sys
from pathlib import Path

# Ensure the backend directory is in the Python path
backend_path = Path(__file__).parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

# Import and export the FastAPI app
from main import app

# Vercel requires the app to be named 'app'
__all__ = ['app']
