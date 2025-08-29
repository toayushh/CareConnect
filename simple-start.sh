#!/bin/bash
echo "🚀 Starting LeapFrog - Simple Clean Start"

# Kill everything first
pkill -f vite 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true  
pkill -f "python run.py" 2>/dev/null || true
pkill -f node 2>/dev/null || true
sleep 2

echo "Starting backend on port 9000..."
cd backend
source venv/bin/activate
python run.py &
BACKEND_PID=$!
cd ..

sleep 3
echo "Backend started (PID: $BACKEND_PID)"

echo "Starting simple frontend on port 4000..."
npx vite --port 4000 &
FRONTEND_PID=$!

sleep 3
echo ""
echo "✅ SERVERS STARTED!"
echo "Backend: http://localhost:9000"
echo "Frontend: http://localhost:4000"
echo "Simple Test: open test-simple.html"
echo ""
echo "Press Ctrl+C to stop"
wait
