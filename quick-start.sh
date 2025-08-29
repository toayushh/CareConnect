#!/bin/bash

echo "🧹 Cleaning up old processes..."
pkill -f "python.*run.py" 2>/dev/null || true
pkill -f "vite.*3000" 2>/dev/null || true
pkill -f "npm.*dev" 2>/dev/null || true

echo "⏳ Waiting for cleanup..."
sleep 3

echo "🚀 Starting LeapFrog Healthcare Platform..."

# Start backend
echo "📡 Starting backend on port 9000..."
cd backend && source venv/bin/activate && python run.py > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 5

# Start frontend
echo "🌐 Starting frontend on port 3000..."
npx vite --port 3000 --host 0.0.0.0 > frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 8

echo ""
echo "🎉 LeapFrog Platform is ready!"
echo ""
echo "📍 Frontend: http://localhost:3000"
echo "📍 Backend:  http://localhost:9000"
echo "📍 API Docs: http://localhost:9000/docs"
echo ""
echo "📋 Available Features:"
echo "  ✅ Patient Dashboard"
echo "  ✅ Doctor Dashboard with:"
echo "     📈 Patient Progress Tracker"
echo "     📋 Treatment Plan Manager"
echo "     💬 Message Center"
echo "     📊 Analytics & Insights"
echo ""
echo "🔧 Process IDs:"
echo "  Backend: $BACKEND_PID"
echo "  Frontend: $FRONTEND_PID"
echo ""
echo "🛑 To stop: pkill -f 'python.*run.py' && pkill -f 'vite.*3000'"
echo ""
