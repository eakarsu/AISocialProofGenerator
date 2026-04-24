#!/bin/bash

# AI Social Proof Generator - Startup Script with Hot Reload
# This script cleans up ports, seeds the database, and starts both servers with watch mode

set -e

echo "🚀 Starting AI Social Proof Generator (Development Mode)..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Step 1: Kill processes on ports 3000, 5000, and 5001
echo -e "${YELLOW}Step 1: Cleaning up ports 3000, 5000, and 5001...${NC}"

kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo "  Killing process on port $port (PID: $pid)"
        kill -9 $pid 2>/dev/null || true
        sleep 1
    else
        echo "  Port $port is free"
    fi
}

kill_port 3000
kill_port 5000
kill_port 5001

echo -e "${GREEN}✓ Ports cleaned${NC}"
echo ""

# Step 2: Check if PostgreSQL is running
echo -e "${YELLOW}Step 2: Checking PostgreSQL...${NC}"
if command -v pg_isready &> /dev/null; then
    if pg_isready -q; then
        echo -e "${GREEN}✓ PostgreSQL is running${NC}"
    else
        echo -e "${RED}PostgreSQL is not running. Please start it first.${NC}"
        echo "  On macOS: brew services start postgresql"
        echo "  On Linux: sudo systemctl start postgresql"
        exit 1
    fi
else
    echo "  pg_isready not found, assuming PostgreSQL is running..."
fi
echo ""

# Step 3: Create database if it doesn't exist
echo -e "${YELLOW}Step 3: Setting up database...${NC}"
if command -v createdb &> /dev/null; then
    createdb ai_social_proof 2>/dev/null || echo "  Database already exists or will be created"
fi
echo -e "${GREEN}✓ Database ready${NC}"
echo ""

# Step 4: Install dependencies if needed
echo -e "${YELLOW}Step 4: Checking dependencies...${NC}"

if [ ! -d "backend/node_modules" ]; then
    echo "  Installing backend dependencies..."
    cd backend && npm install && cd ..
else
    echo "  Backend dependencies already installed"
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "  Installing frontend dependencies..."
    cd frontend && npm install && cd ..
else
    echo "  Frontend dependencies already installed"
fi

echo -e "${GREEN}✓ Dependencies ready${NC}"
echo ""

# Step 5: Run seed script
echo -e "${YELLOW}Step 5: Seeding database...${NC}"
cd backend
npm run seed
cd ..
echo -e "${GREEN}✓ Database seeded${NC}"
echo ""

# Step 6: Start servers with hot reload
echo -e "${YELLOW}Step 6: Starting servers with hot reload...${NC}"
echo ""

# Start backend with nodemon (hot reload)
echo "  Starting backend server with nodemon (hot reload) on port 5001..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 2

# Start frontend with Vite (has HMR built-in)
echo "  Starting frontend server with Vite HMR on port 3000..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  AI Social Proof Generator is running! (Hot Reload Enabled)${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Frontend: ${YELLOW}http://localhost:3000${NC}  (Vite HMR)"
echo -e "  Backend:  ${YELLOW}http://localhost:5001${NC}  (Nodemon)"
echo ""
echo -e "  Demo Login:"
echo -e "    Email:    ${YELLOW}demo@example.com${NC}"
echo -e "    Password: ${YELLOW}demo123${NC}"
echo ""
echo -e "  ${GREEN}✨ Code changes will auto-reload!${NC}"
echo -e "  Press Ctrl+C to stop all servers"
echo ""

# Handle cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "Goodbye!"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
