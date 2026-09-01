"""
Vercel Python Runtime Handler
This exports the FastAPI app for Vercel to use
"""
from main import app

# This is the app that Vercel will import and run
# Vercel automatically detects and wraps it as an ASGI application
__all__ = ['app']
