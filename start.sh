#!/bin/bash

# Farsi Video Transcriber - Startup Script

echo "Starting Farsi Video Transcriber..."

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed"
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    exit 1
fi

# Check if FFmpeg is available
if ! command -v ffmpeg &> /dev/null; then
    echo "Error: FFmpeg is not installed. Please install FFmpeg first."
    exit 1
fi

# Function to start backend
start_backend() {
    echo "Starting backend server..."
    cd backend
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        echo "Creating virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install dependencies if needed
    if [ ! -f "venv/pyvenv.cfg" ] || [ requirements.txt -nt venv/pyvenv.cfg ]; then
        echo "Installing Python dependencies..."
        pip install -r requirements.txt
    fi
    
    # Start backend
    echo "Starting backend server on port 8000..."
    uvicorn app:app --reload --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    echo "Backend started with PID: $BACKEND_PID"
    cd ..
}

# Function to start frontend
start_frontend() {
    echo "Starting frontend server..."
    cd frontend
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ] || [ package.json -nt node_modules/.package-lock.json ]; then
        echo "Installing Node.js dependencies..."
        npm install
    fi
    
    # Start frontend
    npm run dev &
    FRONTEND_PID=$!
    echo "Frontend started with PID: $FRONTEND_PID"
    cd ..
}

# Start both services
start_backend
sleep 3
start_frontend

echo ""
echo "=========================================="
echo "Farsi Video Transcriber is running!"
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:8000"
echo "=========================================="
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for user to stop
wait
