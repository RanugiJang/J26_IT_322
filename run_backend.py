"""
CardioCare AI Backend Server Starter
Run with:
    python run_backend.py
"""

import sys
import uvicorn

if __name__ == "__main__":
    print("=======================================================")
    print("  Starting CardioCare AI Module 2 FastAPI Backend...   ")
    print("  API Docs:    http://127.0.0.1:8000/docs              ")
    print("  Health:      http://127.0.0.1:8000/api/health        ")
    print("=======================================================")
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
