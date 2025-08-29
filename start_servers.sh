#!/bin/bash

echo "🚀 Starting LeapFrog Healthcare Platform..."

# Kill any existing processes
pkill -f vite 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "python run.py" 2>/dev/null || true
sleep 2

# Start backend
echo "Starting backend server..."
cd backend
source venv/bin/activate
python run.py > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3
echo "Backend started on port 5005"

# Start frontend
echo "Starting frontend server..."
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 5

echo ""
echo "✅ Servers started successfully!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "🌐 Access your platform at: http://localhost:5173"
echo "🔐 Login credentials:"
echo "   Email: test@example.com"
echo "   Password: test123"
echo ""
echo "Servers are running in the background."
echo "Press Ctrl+C to stop this script (servers will continue running)"

# Keep script running
wait
