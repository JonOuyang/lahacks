#!/bin/bash
# Script to start both backend and frontend servers

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting Study Companion AI Assistant...${NC}"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python 3 is not installed. Please install Python 3 to continue.${NC}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js to continue.${NC}"
    exit 1
fi

# Start the backend server in the background
echo -e "${GREEN}Starting backend server...${NC}"
python3 api.py &
BACKEND_PID=$!

# Wait a moment for the backend to initialize
sleep 2

# Navigate to the frontend directory
cd frontend

# Check package manager and install dependencies if needed
echo -e "${GREEN}Checking frontend dependencies...${NC}"
if [ -f "package-lock.json" ]; then
    # Use npm
    if [ ! -d "node_modules" ]; then
        echo -e "${GREEN}Installing dependencies with npm...${NC}"
        npm install
    fi
    echo -e "${GREEN}Starting frontend server with npm...${NC}"
    npm run dev
elif [ -f "yarn.lock" ]; then
    # Use yarn
    if [ ! -d "node_modules" ]; then
        echo -e "${GREEN}Installing dependencies with yarn...${NC}"
        yarn install
    fi
    echo -e "${GREEN}Starting frontend server with yarn...${NC}"
    yarn dev
elif [ -f "pnpm-lock.yaml" ]; then
    # Use pnpm
    if [ ! -d "node_modules" ]; then
        echo -e "${GREEN}Installing dependencies with pnpm...${NC}"
        pnpm install
    fi
    echo -e "${GREEN}Starting frontend server with pnpm...${NC}"
    pnpm dev
else
    # Default to npm
    if [ ! -d "node_modules" ]; then
        echo -e "${GREEN}Installing dependencies with npm...${NC}"
        npm install
    fi
    echo -e "${GREEN}Starting frontend server with npm...${NC}"
    npm run dev
fi

# When the script is killed, also kill the background process
trap "kill $BACKEND_PID" EXIT

# Keep script running
wait $BACKEND_PID
