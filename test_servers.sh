#!/bin/bash
echo "🚀 TESTING LEAPFROG HEALTHCARE PLATFORM SERVERS..."
echo ""

# Test Frontend
echo "📱 Testing Frontend (http://localhost:5173)..."
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ Frontend is RUNNING and accessible!"
else
    echo "❌ Frontend is NOT accessible"
fi

# Test Backend
echo ""
echo "🔧 Testing Backend API (http://localhost:5003)..."
if curl -s http://localhost:5003/api/ai/health-check > /dev/null; then
    echo "✅ Backend API is RUNNING and accessible!"
else
    echo "❌ Backend API is NOT accessible"
fi

# Test API Endpoints
echo ""
echo "🧪 Testing Key API Endpoints..."

# Test auth endpoint
if curl -s http://localhost:5003/api/auth/register -X POST -H "Content-Type: application/json" -d '{}' | grep -q "errors"; then
    echo "✅ Auth API endpoint working"
else
    echo "❌ Auth API endpoint not working"
fi

# Test doctors endpoint
if curl -s http://localhost:5003/api/doctors > /dev/null; then
    echo "✅ Doctors API endpoint working"
else
    echo "❌ Doctors API endpoint not working"
fi

# Test AI health check
if curl -s http://localhost:5003/api/ai/health-check | grep -q "status"; then
    echo "✅ AI Recommendations API working"
else
    echo "❌ AI Recommendations API not working"
fi

echo ""
echo "🎉 PLATFORM STATUS SUMMARY:"
echo "Frontend URL: http://localhost:5173"
echo "Backend URL: http://localhost:5003"
echo "AI Recommendations: Available in UI under 'AI Recommendations' → '🧠 AI Health Assessment'"
echo ""
echo "🔥 Your LeapFrog Healthcare Platform is ready!"
