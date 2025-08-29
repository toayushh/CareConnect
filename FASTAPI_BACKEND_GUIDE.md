# FastAPI Backend with ML Integration

## 🚀 Complete Healthcare Backend with ML Predictions and Doctor Feedback System

This is a comprehensive FastAPI backend implementation for your React healthcare dashboard, featuring:

- **FastAPI** web framework with async support
- **PostgreSQL** database with SQLAlchemy ORM
- **ML Integration** with scikit-learn and Hugging Face datasets
- **Doctor Feedback System** (Leapfrog method)
- **Analytics** for AI accuracy vs doctor feedback
- **JWT Authentication** for doctors and patients

## 📋 Requirements Fulfilled

✅ **Database Tables Created:**
- `patients` (id, name, age, gender, health_features JSON, created_at)
- `doctors` (id, name, specialization, created_at)
- `recommendations` (id, patient_id, ai_prediction, probability, timestamp)
- `feedback` (id, doctor_id, patient_id, ai_prediction, doctor_feedback, timestamp)

✅ **ML Model Integration:**
- Heart disease dataset from Hugging Face (with fallback to synthetic data)
- Logistic Regression and Random Forest support
- Model persistence with joblib
- `/train_model` endpoint for training/retraining
- `/predict` endpoint for making predictions

✅ **Doctor Feedback System (Leapfrog):**
- `/doctor_feedback` endpoint for approval/rejection
- `/retrain_model` endpoint using feedback data
- Comprehensive feedback analytics

✅ **API Endpoints for Frontend:**
- `/patients/{id}/recommendations` - patient's past predictions
- `/doctors/{id}/patients` - patients + predictions for doctor review
- `/analytics` - AI accuracy vs doctor feedback stats

## 🛠️ Installation & Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Database Setup

Make sure PostgreSQL is running and create the database:

```sql
CREATE DATABASE leapfrog;
```

Set environment variable:

```bash
export DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/leapfrog"
```

### 3. Initialize Database and ML Service

```bash
python setup_fastapi_db.py
```

This will:
- Create all database tables
- Insert sample data (doctor, patient, recommendations)
- Initialize ML service with trained model

### 4. Start the FastAPI Server

```bash
python fastapi_run.py
```

Server will start on `http://localhost:8000`

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **Health Check:** http://localhost:8000/health

## 🔑 Authentication

### Register/Login

**Register Doctor:**
```bash
POST /api/auth/register/doctor
{
  "name": "Dr. Jane Smith",
  "email": "jane@hospital.com",
  "password": "password123",
  "specialization": "Cardiology",
  "license_number": "MD67890"
}
```

**Register Patient:**
```bash
POST /api/auth/register/patient
{
  "name": "John Doe",
  "email": "john@email.com",
  "password": "password123",
  "age": 45,
  "gender": "male"
}
```

**Login:**
```bash
POST /api/auth/login
{
  "email": "jane@hospital.com",
  "password": "password123",
  "user_type": "doctor"
}
```

## 🤖 ML Endpoints

### Train Model

```bash
POST /api/ml/train_model
Authorization: Bearer <doctor_token>
{
  "model_type": "logistic_regression",
  "force_retrain": false
}
```

### Make Prediction

```bash
POST /api/ml/predict
Authorization: Bearer <token>
{
  "patient_id": 1,
  "features": {
    "age": 45,
    "sex": 1,
    "cp": 2,
    "trestbps": 145,
    "chol": 250,
    "fbs": 0,
    "restecg": 0,
    "thalach": 150,
    "exang": 0,
    "oldpeak": 1.2,
    "slope": 1,
    "ca": 0,
    "thal": 2
  },
  "save_to_db": true
}
```

### Retrain with Feedback

```bash
POST /api/ml/retrain_model
Authorization: Bearer <doctor_token>
```

## 👨‍⚕️ Doctor Feedback (Leapfrog System)

### Submit Feedback

```bash
POST /api/feedback/doctor_feedback
Authorization: Bearer <doctor_token>
{
  "recommendation_id": 1,
  "doctor_feedback": "approved",
  "doctor_notes": "Agrees with AI assessment",
  "confidence_score": 0.9,
  "review_time_seconds": 45
}
```

For rejection:
```bash
{
  "recommendation_id": 2,
  "doctor_feedback": "rejected",
  "doctor_notes": "Patient has additional risk factors",
  "correction": "High risk of heart disease",
  "confidence_score": 0.85
}
```

### Get Pending Reviews

```bash
GET /api/feedback/pending_reviews
Authorization: Bearer <doctor_token>
```

## 📊 Analytics Endpoints

### AI Accuracy vs Doctor Feedback

```bash
GET /api/analytics/accuracy_vs_feedback?days_back=30
Authorization: Bearer <doctor_token>
```

### Trends Analysis

```bash
GET /api/analytics/trends?days_back=30
Authorization: Bearer <doctor_token>
```

### Doctor Performance

```bash
GET /api/analytics/doctor_performance?days_back=30
Authorization: Bearer <doctor_token>
```

### Model Comparison

```bash
GET /api/analytics/model_comparison
Authorization: Bearer <doctor_token>
```

## 👥 Patient Endpoints

### Get My Recommendations

```bash
GET /api/patients/me/recommendations?limit=20
Authorization: Bearer <patient_token>
```

### Update Health Features

```bash
PUT /api/patients/me/health_features
Authorization: Bearer <patient_token>
{
  "age": 46,
  "trestbps": 140,
  "chol": 245
}
```

## 👨‍⚕️ Doctor Endpoints

### Get My Patients

```bash
GET /api/doctors/me/patients?has_pending_reviews=true
Authorization: Bearer <doctor_token>
```

### Get Patient Recommendations

```bash
GET /api/patients/{patient_id}/recommendations
Authorization: Bearer <doctor_token>
```

## 📈 Sample Workflow

1. **Doctor registers and logs in**
2. **Patient registers and sets health features**
3. **Doctor or patient requests ML prediction**
4. **AI makes prediction and stores in recommendations table**
5. **Doctor reviews prediction and provides feedback**
6. **System tracks accuracy vs feedback for analytics**
7. **Model gets retrained periodically with feedback data**

## 🔧 Database Schema

### Core Tables

**patients:**
- id (Primary Key)
- name, age, gender, email
- health_features (JSON) - stores ML features
- created_at, updated_at

**doctors:**
- id (Primary Key)
- name, email, specialization
- license_number, years_experience
- hospital_affiliation, created_at

**recommendations:**
- id (Primary Key)
- patient_id (Foreign Key)
- ai_prediction, probability
- model_version, features_used (JSON)
- prediction_type, reasoning
- timestamp, status

**feedback:**
- id (Primary Key)
- doctor_id, patient_id, recommendation_id (Foreign Keys)
- ai_prediction, doctor_feedback ("approved"/"rejected")
- doctor_notes, correction
- confidence_score, timestamp

### Additional Tables

**training_data:** - For ML model training
**prediction_logs:** - Detailed prediction logging
**ml_models:** - Model version tracking
**system_metrics:** - Performance metrics

## 🎯 Integration with React Frontend

Your React frontend can now replace mock data with real API calls:

```javascript
// Example: Get patient recommendations
const getRecommendations = async (patientId) => {
  const response = await fetch(`/api/patients/${patientId}/recommendations`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};

// Example: Submit ML prediction request
const getPrediction = async (patientId, healthFeatures) => {
  const response = await fetch('/api/ml/predict', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      patient_id: patientId,
      features: healthFeatures,
      save_to_db: true
    })
  });
  return response.json();
};
```

## 🔒 Security Features

- JWT-based authentication
- Role-based access control (doctors vs patients)
- Input validation with Pydantic models
- SQL injection protection with SQLAlchemy ORM
- CORS configuration for frontend integration

## 🚦 Status and Health Checks

- **Health Check:** `GET /health`
- **ML Service Status:** `GET /api/ml/status`
- **User Info:** `GET /api/auth/me`

## 📝 Environment Variables

```bash
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/leapfrog
JWT_SECRET_KEY=your-secret-key-here
```

## 🛟 Troubleshooting

### Common Issues

1. **Database Connection Error:**
   - Ensure PostgreSQL is running
   - Check DATABASE_URL format
   - Verify database exists

2. **ML Model Not Ready:**
   - Run setup script: `python setup_fastapi_db.py`
   - Check model training logs

3. **Authentication Issues:**
   - Verify JWT token in Authorization header
   - Check token expiration

### Logs

Check application logs for detailed error information:
```bash
python fastapi_run.py
```

## 🔄 Running Both Flask and FastAPI

The FastAPI backend runs independently on port 8000, while your existing Flask backend can continue running on port 5001. This allows for gradual migration:

- **FastAPI:** http://localhost:8000 (new ML endpoints)
- **Flask:** http://localhost:5001 (existing endpoints)

You can update your React frontend to use FastAPI endpoints gradually while keeping Flask running for other features.

---

## 🎉 Ready to Use!

Your FastAPI backend is now ready with all the requested features:

✅ PostgreSQL database with proper schema  
✅ ML integration with heart disease prediction  
✅ Doctor feedback system (Leapfrog method)  
✅ Analytics for AI accuracy vs doctor feedback  
✅ Complete REST API for frontend integration  
✅ JWT authentication and authorization  
✅ Comprehensive documentation  

Start the server and visit http://localhost:8000/docs to explore the API!
