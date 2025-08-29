# 🚀 FastAPI + React Integration Testing Guide

## 📋 **Overview**
This guide will help you test the complete integration between your FastAPI backend and React frontend. The system now includes:

- ✅ **FastAPI Backend** with ML integration
- ✅ **React Frontend** with API integration
- ✅ **JWT Authentication** system
- ✅ **Real-time backend status** indicator
- ✅ **40+ API endpoints** available

## 🔧 **Prerequisites**
1. **FastAPI Backend**: Running on http://localhost:8000
2. **React Frontend**: Will start on http://localhost:5173
3. **Backend Status**: Should show "✅ Backend Connected" in top-right corner

## 🚀 **Step 1: Start Both Servers**

### **Terminal 1: FastAPI Backend**
```bash
cd backend
python3 fastapi_run.py
```
**Expected Output**: Server running on http://localhost:8000

### **Terminal 2: React Frontend**
```bash
cd frontend  # or root directory
npm run dev
```
**Expected Output**: Server running on http://localhost:5173

## 🧪 **Step 2: Test Backend Connection**

### **Health Check**
```bash
curl http://localhost:8000/health
```
**Expected**: `{"status":"healthy","services":{"database":"healthy","ml_service":"healthy"}}`

### **API Documentation**
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔐 **Step 3: Test Authentication Flow**

### **3.1 Register a Doctor**
```bash
curl -X POST "http://localhost:8000/api/auth/register/doctor" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. John Smith",
    "email": "dr.smith@test.com",
    "password": "testpass123",
    "specialization": "Cardiology",
    "phone": "+1234567890",
    "license_number": "MD12345",
    "years_experience": 15,
    "hospital_affiliation": "City Hospital"
  }'
```

**Expected Response**:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "user_type": "doctor",
  "user_id": 1,
  "name": "Dr. John Smith"
}
```

### **3.2 Register a Patient**
```bash
curl -X POST "http://localhost:8000/api/auth/register/patient" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane.doe@test.com",
    "password": "testpass123",
    "age": 35,
    "gender": "female",
    "phone": "+1987654321",
    "date_of_birth": "1988-05-15",
    "medical_history": "Hypertension, mild"
  }'
```

### **3.3 Login**
```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dr.smith@test.com",
    "password": "testpass123",
    "user_type": "doctor"
  }'
```

## 🤖 **Step 4: Test ML Integration**

### **4.1 Get ML Status**
```bash
curl http://localhost:8000/api/ml/status
```

### **4.2 Train ML Model**
```bash
curl -X POST "http://localhost:8000/api/ml/train_model" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### **4.3 Make Prediction**
```bash
curl -X POST "http://localhost:8000/api/ml/predict" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": 1,
    "health_features": {
      "age": 35,
      "sex": 1,
      "cp": 0,
      "trestbps": 130,
      "chol": 200,
      "fbs": 0,
      "restecg": 0,
      "thalach": 150,
      "exang": 0,
      "oldpeak": 0.0,
      "slope": 1,
      "ca": 0,
      "thal": 2
    }
  }'
```

## 📊 **Step 5: Test Analytics & Feedback**

### **5.1 Get Analytics**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:8000/api/analytics/accuracy_vs_feedback
```

### **5.2 Submit Doctor Feedback**
```bash
curl -X POST "http://localhost:8000/api/feedback/doctor_feedback" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "recommendation_id": 1,
    "doctor_feedback": "approved",
    "doctor_notes": "AI prediction looks accurate based on patient symptoms",
    "correction": null
  }'
```

## 🌐 **Step 6: Test React Frontend Integration**

### **6.1 Open React App**
- Navigate to http://localhost:5173
- Check top-right corner for backend status indicator
- Should show "✅ Backend Connected"

### **6.2 Test Registration Flow**
1. Click "Sign Up" or "Register"
2. Choose user type (Doctor/Patient)
3. Fill in registration form
4. Submit and verify success

### **6.3 Test Login Flow**
1. Click "Sign In" or "Login"
2. Enter credentials from Step 3
3. Verify successful login and dashboard access

### **6.4 Test Dashboard Features**
- **Doctor Dashboard**: View patients, ML predictions, analytics
- **Patient Dashboard**: Update health data, view recommendations

## 🔍 **Step 7: Troubleshooting**

### **Common Issues & Solutions**

#### **Backend Not Starting**
```bash
# Check if port 8000 is in use
lsof -i :8000

# Kill existing process
pkill -f "python3 fastapi_run.py"

# Check Python dependencies
pip3 install -r requirements.txt
```

#### **Database Connection Issues**
```bash
# Check if SQLite file exists
ls -la backend/fastapi_leapfrog.db

# Remove and recreate if corrupted
rm backend/fastapi_leapfrog.db
python3 backend/setup_fastapi_db.py
```

#### **Frontend Not Connecting**
```bash
# Check backend health
curl http://localhost:8000/health

# Check CORS settings in FastAPI
# Verify API_BASE_URL in src/services/api.js
```

#### **Authentication Errors**
```bash
# Check JWT token format
# Verify token expiration
# Check user exists in database
```

## 📱 **Step 8: Advanced Testing**

### **8.1 Load Testing**
```bash
# Test multiple concurrent users
for i in {1..10}; do
  curl -s "http://localhost:8000/api/ml/status" &
done
wait
```

### **8.2 Error Handling**
```bash
# Test invalid credentials
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid@test.com", "password": "wrong"}'

# Test unauthorized access
curl "http://localhost:8000/api/patients/me"
```

### **8.3 Data Validation**
```bash
# Test invalid health features
curl -X POST "http://localhost:8000/api/ml/predict" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"patient_id": 1, "health_features": {"invalid": "data"}}'
```

## 🎯 **Success Criteria**

### **✅ Backend Tests**
- [ ] Health check returns healthy status
- [ ] All 40+ endpoints accessible via /docs
- [ ] ML model training successful
- [ ] Predictions working with sample data
- [ ] Database operations successful

### **✅ Frontend Tests**
- [ ] Backend status shows "Connected"
- [ ] Registration flow works for both user types
- [ ] Login flow successful
- [ ] Dashboard loads appropriate content
- [ ] API calls successful from React components

### **✅ Integration Tests**
- [ ] JWT tokens properly stored and used
- [ ] Real-time data updates
- [ ] Error handling displays user-friendly messages
- [ ] Loading states work correctly

## 🚀 **Next Steps After Testing**

1. **Customize API endpoints** for your specific needs
2. **Add more ML models** or improve existing ones
3. **Implement real-time features** with WebSockets
4. **Add data visualization** for analytics
5. **Deploy to production** environment

## 📞 **Support**

If you encounter issues:
1. Check the terminal outputs for error messages
2. Verify all dependencies are installed
3. Check network connectivity between frontend and backend
4. Review the FastAPI logs for detailed error information

---

**🎉 Happy Testing! Your FastAPI + React healthcare system is ready to use!**
