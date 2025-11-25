#!/usr/bin/env python3
"""
Simple script to run the Code Review Agent server.
"""
import os
import sys
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# Change to project root directory
os.chdir(project_root)

# Import and run the app
if __name__ == "__main__":
    import uvicorn
    from dotenv import load_dotenv
    
    # Load environment variables
    load_dotenv()
    
    port = int(os.getenv("API_PORT", 8000))
    
    print(f"Starting Code Review Agent on port {port}...")
    print(f"Open http://localhost:{port} in your browser")
    
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )


