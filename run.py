#!/usr/bin/env python3
import os
import subprocess
import threading
import time
import webbrowser

def run_backend():
    """Run the Flask API backend server"""
    print("Starting backend server...")
    # Use Python executable in the current environment
    subprocess.run(["python", "api.py"], check=True)

def run_frontend():
    """Run the Next.js frontend development server"""
    print("Starting frontend server...")
    os.chdir("frontend")
    # Check if package manager is npm, yarn, or pnpm and use the appropriate command
    if os.path.exists("package-lock.json"):
        subprocess.run(["npm", "run", "dev"], check=True)
    elif os.path.exists("yarn.lock"):
        subprocess.run(["yarn", "dev"], check=True)
    elif os.path.exists("pnpm-lock.yaml"):
        subprocess.run(["pnpm", "dev"], check=True)
    else:
        # Default to npm if no lock file is found
        subprocess.run(["npm", "run", "dev"], check=True)

def open_browser():
    """Open the application in a web browser after a delay"""
    # Wait for servers to start
    time.sleep(5)
    print("Opening browser...")
    webbrowser.open("http://localhost:3000")

def main():
    """Main function to start all services"""
    print("Starting Study Companion AI Assistant...")
    
    # Start the backend server in a separate thread
    backend_thread = threading.Thread(target=run_backend)
    backend_thread.daemon = True
    backend_thread.start()
    
    # Wait a moment for the backend to initialize
    time.sleep(2)
    
    # Start the frontend server in a separate thread
    frontend_thread = threading.Thread(target=run_frontend)
    frontend_thread.daemon = True
    frontend_thread.start()
    
    # Open the browser after a delay
    browser_thread = threading.Thread(target=open_browser)
    browser_thread.daemon = True
    browser_thread.start()
    
    # Keep the main thread alive
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down...")

if __name__ == "__main__":
    main()
