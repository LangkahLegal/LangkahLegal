"""
Vercel serverless function entry point for FastAPI

Vercel automatically wraps the imported app as an ASGI handler.
"""
import sys
import os

# Add parent directory to path so we can import from backend
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

# Export the FastAPI app - Vercel will handle it as an ASGI application
__all__ = ['app']
