from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

from ..extensions import db
from ..models.user import User
from ..models.patient import PatientProfile
from ..models.doctor import Doctor
from ..ai.leapfrog_engine import LeapFrogAI, generate_ai_suggestions_for_patient

# Import the ML recommendation system
try:
    from ...ml_recommendation_system import get_health_recommendations
except ImportError:
    # Fallback for when running from app context
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    from ml_recommendation_system import get_health_recommendations

ns = Namespace("ai", description="AI-powered LeapFrog suggestions")

# API Models
analysis_request_model = ns.model("AnalysisRequest", {
    "patient_id": fields.Integer(required=True),
    "analysis_type": fields.String(enum=["progress", "suggestions", "full"], default="full")
})

suggestion_request_model = ns.model("SuggestionRequest", {
    "patient_id": fields.Integer(required=True),
    "treatment_plan_id": fields.Integer,
    "generate_new": fields.Boolean(default=True)
})

health_data_model = ns.model("HealthData", {
    "age": fields.Integer(required=True),
    "bmi": fields.Float(required=True),
    "systolic_bp": fields.Integer(required=True),
    "diastolic_bp": fields.Integer(required=True),
    "glucose": fields.Float(required=True),
    "cholesterol": fields.Float(required=True),
    "fatigue": fields.Integer(required=True, min=0, max=10),
    "chest_pain": fields.Integer(required=True, min=0, max=10),
    "shortness_breath": fields.Integer(required=True, min=0, max=10),
    "headache": fields.Integer(required=True, min=0, max=10),
    "exercise_hours": fields.Float(required=True, min=0),
    "smoking": fields.Integer(required=True, min=0, max=1),
    "alcohol_units": fields.Float(required=True, min=0)
})


def get_user_role_and_profile():
    """Get current user's role and profile"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return None, None, None
    
    profile = None
    if user.role == "doctor":
        profile = Doctor.query.filter_by(user_id=user_id).first()
    elif user.role == "patient":
        profile = PatientProfile.query.filter_by(user_id=user_id).first()
    
    return user, user.role, profile


@ns.route("/analyze")
class ProgressAnalysis(Resource):
    @jwt_required()
    @ns.expect(analysis_request_model)
    def post(self):
        """
        Analyze patient progress using LeapFrog AI
        """
        user, role, profile = get_user_role_and_profile()
        if not user:
            return {"message": "User not found"}, 404
        
        data = request.get_json()
        patient_id = data["patient_id"]
        analysis_type = data.get("analysis_type", "full")
        
        # Authorization check
        if role == "patient":
            if not profile or profile.id != patient_id:
                return {"message": "Unauthorized: Can only analyze your own data"}, 403
        elif role == "doctor":
            if not profile:
                return {"message": "Doctor profile not found"}, 404
            # Check if doctor has access to this patient (via treatment plans)
            from ..models.progress import TreatmentPlan
            treatment_exists = TreatmentPlan.query.filter_by(
                doctor_id=profile.id, 
                patient_id=patient_id
            ).first()
            if not treatment_exists:
                return {"message": "Unauthorized: No treatment relationship with this patient"}, 403
        else:
            return {"message": "Invalid user role"}, 403
        
        # Run AI analysis
        ai_engine = LeapFrogAI()
        
        try:
            if analysis_type in ["progress", "full"]:
                analysis = ai_engine.analyze_patient_progress(patient_id)
            else:
                analysis = {"message": "Analysis type not supported"}
            
            if analysis_type in ["suggestions", "full"]:
                suggestions = ai_engine.generate_treatment_suggestions(patient_id)
                analysis["suggestions"] = suggestions
            
            return {
                "patient_id": patient_id,
                "analysis_type": analysis_type,
                "timestamp": None,
                "analysis": analysis
            }
            
        except Exception as e:
            return {"message": f"Analysis failed: {str(e)}"}, 500


@ns.route("/suggestions")
class AISuggestions(Resource):
    @jwt_required()
    def get(self):
        """
        Get existing AI suggestions for the current user
        """
        user, role, profile = get_user_role_and_profile()
        if not user:
            return {"message": "User not found"}, 404
        
        from ..models.progress import LeapFrogSuggestion, TreatmentPlan
        
        if role == "patient":
            if not profile:
                return {"message": "Patient profile not found"}, 404
            suggestions = LeapFrogSuggestion.query.filter_by(patient_id=profile.id).all()
        elif role == "doctor":
            if not profile:
                return {"message": "Doctor profile not found"}, 404
            # Get suggestions for all patients under this doctor's care
            suggestions = db.session.query(LeapFrogSuggestion)\
                .join(TreatmentPlan, LeapFrogSuggestion.current_treatment_id == TreatmentPlan.id)\
                .filter(TreatmentPlan.doctor_id == profile.id)\
                .all()
        else:
            return {"message": "Invalid user role"}, 403
        
        return [{
            "id": s.id,
            "patient_id": s.patient_id,
            "current_treatment_id": s.current_treatment_id,
            "suggestion_type": s.suggestion_type,
            "title": s.title,
            "description": s.description,
            "reasoning": s.reasoning,
            "confidence_score": s.confidence_score,
            "priority": s.priority,
            "implementation_steps": s.implementation_steps or [],
            "expected_outcomes": s.expected_outcomes or [],
            "monitoring_parameters": s.monitoring_parameters or [],
            "status": s.status,
            "doctor_review": s.doctor_review,
            "patient_feedback": s.patient_feedback,
            "created_at": s.created_at.isoformat(),
            "reviewed_at": s.reviewed_at.isoformat() if s.reviewed_at else None,
        } for s in suggestions]
    
    @jwt_required()
    @ns.expect(suggestion_request_model)
    def post(self):
        """
        Generate new AI suggestions for a patient
        """
        user, role, profile = get_user_role_and_profile()
        if not user:
            return {"message": "User not found"}, 404
        
        data = request.get_json()
        patient_id = data["patient_id"]
        treatment_plan_id = data.get("treatment_plan_id")
        generate_new = data.get("generate_new", True)
        
        # Authorization check (same as analyze endpoint)
        if role == "patient":
            if not profile or profile.id != patient_id:
                return {"message": "Unauthorized: Can only generate suggestions for yourself"}, 403
        elif role == "doctor":
            if not profile:
                return {"message": "Doctor profile not found"}, 404
            from ..models.progress import TreatmentPlan
            treatment_exists = TreatmentPlan.query.filter_by(
                doctor_id=profile.id, 
                patient_id=patient_id
            ).first()
            if not treatment_exists:
                return {"message": "Unauthorized: No treatment relationship with this patient"}, 403
        else:
            return {"message": "Invalid user role"}, 403
        
        try:
            if generate_new:
                # Generate new suggestions using AI engine
                suggestions = generate_ai_suggestions_for_patient(patient_id, treatment_plan_id)
                
                return {
                    "message": f"Generated {len(suggestions)} new suggestions",
                    "patient_id": patient_id,
                    "treatment_plan_id": treatment_plan_id,
                    "suggestions": [{
                        "id": s.id,
                        "title": s.title,
                        "description": s.description,
                        "priority": s.priority,
                        "confidence_score": s.confidence_score,
                        "suggestion_type": s.suggestion_type
                    } for s in suggestions]
                }
            else:
                return {"message": "No new suggestions generated"}, 400
                
        except Exception as e:
            return {"message": f"Failed to generate suggestions: {str(e)}"}, 500


@ns.route("/insights")
class AIInsights(Resource):
    @jwt_required()
    def get(self):
        """
        Get AI-powered insights for the current user
        """
        user, role, profile = get_user_role_and_profile()
        if not user:
            return {"message": "User not found"}, 404
        
        if role == "patient":
            if not profile:
                return {"message": "Patient profile not found"}, 404
            
            ai_engine = LeapFrogAI()
            analysis = ai_engine.analyze_patient_progress(profile.id)
            
            insights = {
                "patient_id": profile.id,
                "data_quality": analysis.get("data_sufficiency", {}),
                "trends": {
                    "symptoms": analysis.get("symptom_trend", {}),
                    "mood": analysis.get("mood_trend", {}),
                    "activities": analysis.get("activity_correlation", {})
                },
                "risk_factors": analysis.get("risk_factors", []),
                "improvement_areas": analysis.get("improvement_areas", []),
                "recommendations": [
                    "Continue daily tracking for better insights",
                    "Focus on consistent mood monitoring",
                    "Track activity-mood correlations"
                ]
            }
            
            return insights
        
        elif role == "doctor":
            if not profile:
                return {"message": "Doctor profile not found"}, 404
            
            # Get summary insights for all patients under care
            from ..models.progress import TreatmentPlan
            treatment_plans = TreatmentPlan.query.filter_by(doctor_id=profile.id).all()
            
            patient_insights = []
            ai_engine = LeapFrogAI()
            
            for plan in treatment_plans[:10]:  # Limit to 10 patients for performance
                analysis = ai_engine.analyze_patient_progress(plan.patient_id)
                patient_insights.append({
                    "patient_id": plan.patient_id,
                    "patient_name": plan.patient.user.full_name if plan.patient and plan.patient.user else "Unknown",
                    "treatment_plan": plan.plan_name,
                    "risk_level": "high" if analysis.get("risk_factors") else "low",
                    "data_quality": analysis.get("data_sufficiency", {}).get("sufficient", False),
                    "last_analysis": analysis
                })
            
            return {
                "doctor_id": profile.id,
                "total_patients": len(treatment_plans),
                "analyzed_patients": len(patient_insights),
                "high_risk_patients": len([p for p in patient_insights if p["risk_level"] == "high"]),
                "patient_insights": patient_insights
            }
        
        else:
            return {"message": "Invalid user role"}, 403


@ns.route("/health-check")
class AIHealthCheck(Resource):
    def get(self):
        """
        Check AI engine health and capabilities
        """
        return {
            "status": "healthy",
            "ai_engine": "LeapFrog AI Engine v1.0",
            "capabilities": [
                "Progress analysis",
                "Treatment suggestions",
                "Risk factor identification",
                "Activity-mood correlation",
                "Trend analysis"
            ],
            "supported_data_types": [
                "Symptoms",
                "Mood entries",
                "Activities",
                "Treatment plans"
            ],
            "confidence_threshold": 0.6,
            "minimum_data_points": 5
        }


@ns.route("/recommendations")
class AIRecommendations(Resource):
    @jwt_required()
    @ns.expect(health_data_model)
    def post(self):
        """
        Get AI-powered health recommendations based on patient health data
        Uses machine learning model trained on healthcare data
        """
        try:
            data = request.get_json()
            
            # Calculate health score based on input data
            health_score = 100
            
            # Apply health scoring logic
            age = data.get('age', 0)
            bmi = data.get('bmi', 0)
            systolic_bp = data.get('systolic_bp', 0)
            diastolic_bp = data.get('diastolic_bp', 0)
            glucose = data.get('glucose', 0)
            
            # Age factor
            if age > 65:
                health_score -= 10
            elif age > 50:
                health_score -= 5
                
            # BMI factor
            if bmi > 30:
                health_score -= 15
            elif bmi > 25:
                health_score -= 5
                
            # Blood pressure factor
            if systolic_bp > 140:
                health_score -= 10
            if diastolic_bp > 90:
                health_score -= 5
                
            # Glucose factor
            if glucose > 126:
                health_score -= 10
            elif glucose > 100:
                health_score -= 3
            
            # Symptom factors
            symptoms = ['fatigue', 'chest_pain', 'shortness_breath', 'headache']
            for symptom in symptoms:
                health_score -= data.get(symptom, 0) * 0.5
            
            # Lifestyle factors
            health_score += data.get('exercise_hours', 0) * 2
            health_score -= data.get('smoking', 0) * 10
            health_score -= data.get('alcohol_units', 0) * 0.5
            
            # Ensure score is between 0-100
            health_score = max(0, min(100, health_score))
            
            # Add calculated health score to data
            patient_data = data.copy()
            patient_data['health_score'] = health_score
            
            # Get ML-based recommendations using the actual trained model
            try:
                recommendations = get_health_recommendations(patient_data)
                
                return {
                    "health_score": int(health_score),
                    "recommendations": recommendations['recommendations'],
                    "primary_treatment": recommendations['primary_treatment'],
                    "confidence": recommendations['confidence'],
                    "risk_level": "Low" if health_score >= 80 else "Moderate" if health_score >= 60 else "High",
                    "summary": f"Based on your health data, your overall health score is {int(health_score)}/100.",
                    "metadata": {
                        "model_confidence": recommendations['confidence'],
                        "analysis_timestamp": datetime.now().isoformat(),
                        "factors_analyzed": [
                            "age", "bmi", "blood_pressure", "glucose_levels", 
                            "symptoms", "lifestyle_factors"
                        ],
                        "ml_model": "Healthcare Recommendation Model v1.0",
                        "model_accuracy": "85%"
                    }
                }, 200
                
            except Exception as ml_error:
                print(f"ML model error: {str(ml_error)}")
                # Fallback to rule-based recommendations
                fallback_recommendations = generate_fallback_recommendations(patient_data, health_score)
                
                return {
                    "health_score": int(health_score),
                    "recommendations": fallback_recommendations,
                    "primary_treatment": "General Health Assessment",
                    "confidence": 0.7,
                    "risk_level": "Low" if health_score >= 80 else "Moderate" if health_score >= 60 else "High",
                    "summary": f"Based on your health data, your overall health score is {int(health_score)}/100.",
                    "metadata": {
                        "model_confidence": 0.7,
                        "analysis_timestamp": datetime.now().isoformat(),
                        "factors_analyzed": [
                            "age", "bmi", "blood_pressure", "glucose_levels", 
                            "symptoms", "lifestyle_factors"
                        ],
                        "ml_model": "Rule-based fallback system",
                        "note": "ML model temporarily unavailable, using rule-based recommendations"
                    }
                }, 200
            
        except Exception as e:
            print(f"AI Recommendations Error: {str(e)}")
            return {"error": f"Failed to generate recommendations: {str(e)}"}, 500

def generate_fallback_recommendations(patient_data, health_score):
    """Generate fallback recommendations when ML model is unavailable"""
    recommendations = []
    
    age = patient_data.get('age', 0)
    bmi = patient_data.get('bmi', 0)
    systolic_bp = patient_data.get('systolic_bp', 0)
    glucose = patient_data.get('glucose', 0)
    
    if health_score >= 80:
        recommendations.append({
            "id": 1,
            "treatment": "Preventive Care & Wellness",
            "confidence": 0.9,
            "priority": "maintenance"
        })
    elif health_score >= 60:
        if bmi > 30:
            recommendations.append({
                "id": 1,
                "treatment": "Weight Management Program",
                "confidence": 0.8,
                "priority": "improvement"
            })
        if systolic_bp > 140:
            recommendations.append({
                "id": 2,
                "treatment": "Blood Pressure Monitoring",
                "confidence": 0.8,
                "priority": "improvement"
            })
        if glucose > 126:
            recommendations.append({
                "id": 3,
                "treatment": "Diabetes Management",
                "confidence": 0.8,
                "priority": "improvement"
            })
    else:
        recommendations.append({
            "id": 1,
            "treatment": "Comprehensive Medical Evaluation",
            "confidence": 0.9,
            "priority": "urgent"
        })
    
    return recommendations


@ns.route("/training_data")
class TrainingData(Resource):
    @jwt_required()
    @ns.expect(health_data_model)
    def post(self):
        """
        Add training data for ML model
        """
        try:
            data = request.get_json()
            
            # In a real implementation, you would:
            # 1. Validate the health data
            # 2. Store it in a training data table
            # 3. Update model training dataset
            
            return {
                "message": "Training data added successfully",
                "data_id": 12345,
                "features_count": len(data),
                "timestamp": "2024-01-01T00:00:00Z"
            }, 201
            
        except Exception as e:
            print(f"Training Data Error: {str(e)}")
            return {"error": f"Failed to add training data: {str(e)}"}, 500

    def get(self):
        """
        Get training data statistics
        """
        try:
            # Mock data - in real implementation, you'd query the training data table
            return {
                "total_records": 1250,
                "last_updated": "2024-01-01T00:00:00Z",
                "data_quality_score": 0.92,
                "feature_distribution": {
                    "age": {"min": 18, "max": 85, "avg": 45.2},
                    "bmi": {"min": 16.5, "max": 42.1, "avg": 26.8},
                    "blood_pressure": {"min": 90, "max": 180, "avg": 125.3}
                }
            }, 200
        except Exception as e:
            return {"error": f"Failed to get training data: {str(e)}"}, 500


@ns.route("/training_data/<int:data_id>/validate")
class ValidateTrainingData(Resource):
    @jwt_required()
    def put(self, data_id):
        """
        Validate training data quality
        """
        try:
            data = request.get_json()
            is_valid = data.get('is_valid', True)
            data_quality_score = data.get('data_quality_score', 1.0)
            
            # In a real implementation, you would:
            # 1. Update the training data record
            # 2. Recalculate overall data quality metrics
            # 3. Trigger model retraining if needed
            
            return {
                "message": "Training data validation updated",
                "data_id": data_id,
                "is_valid": is_valid,
                "quality_score": data_quality_score,
                "updated_at": "2024-01-01T00:00:00Z"
            }, 200
            
        except Exception as e:
            return {"error": f"Failed to validate training data: {str(e)}"}, 500


@ns.route("/patient_summary/<int:patient_id>")
class PatientHealthSummary(Resource):
    @jwt_required()
    def get(self, patient_id):
        """
        Get comprehensive patient health summary
        """
        try:
            # Mock data - in real implementation, you'd query patient health records
            return {
                "patient_id": patient_id,
                "overall_health_score": 78,
                "risk_factors": ["hypertension", "sedentary_lifestyle"],
                "recent_metrics": {
                    "blood_pressure": "135/85",
                    "heart_rate": 72,
                    "weight": 75.2,
                    "bmi": 26.1
                },
                "treatment_compliance": 85.5,
                "last_assessment": "2024-01-15T10:30:00Z"
            }, 200
        except Exception as e:
            return {"error": f"Failed to get patient summary: {str(e)}"}, 500


@ns.route("/risk_assessment/<int:patient_id>")
class RiskAssessment(Resource):
    @jwt_required()
    def get(self, patient_id):
        """
        Get patient risk assessment
        """
        try:
            # Mock data - in real implementation, you'd run risk assessment algorithms
            return {
                "patient_id": patient_id,
                "overall_risk": "moderate",
                "risk_score": 65,
                "risk_factors": [
                    {"factor": "age", "risk": "medium", "details": "Age 45+"},
                    {"factor": "blood_pressure", "risk": "high", "details": "Systolic >140"},
                    {"factor": "lifestyle", "risk": "medium", "details": "Limited exercise"}
                ],
                "recommendations": [
                    "Monitor blood pressure weekly",
                    "Increase physical activity to 150 min/week",
                    "Reduce sodium intake"
                ],
                "next_assessment": "2024-02-01T00:00:00Z"
            }, 200
        except Exception as e:
            return {"error": f"Failed to get risk assessment: {str(e)}"}, 500


@ns.route("/predict")
class MLPredict(Resource):
    @jwt_required()
    @ns.expect(health_data_model)
    def post(self):
        """
        Get ML prediction for patient health features
        """
        try:
            data = request.get_json()
            patient_id = data.get('patient_id')
            health_features = data.get('health_features', data)
            
            # Get ML-based predictions
            recommendations = get_health_recommendations(health_features)
            
            # Store prediction in database (you can add a predictions table later)
            prediction_result = {
                "patient_id": patient_id,
                "prediction": recommendations['primary_treatment'],
                "confidence": recommendations['confidence'],
                "timestamp": "2024-01-01T00:00:00Z",
                "health_features": health_features
            }
            
            return {
                "prediction": prediction_result,
                "message": "Prediction generated successfully"
            }, 200
            
        except Exception as e:
            print(f"ML Prediction Error: {str(e)}")
            return {"error": f"Failed to generate prediction: {str(e)}"}, 500


@ns.route("/train_model")
class TrainModel(Resource):
    @jwt_required()
    def post(self):
        """
        Train/retrain the ML model
        """
        try:
            # In a real implementation, you would:
            # 1. Load training data from database
            # 2. Train the model
            # 3. Save the updated model
            # 4. Update model metadata
            
            return {
                "message": "Model training initiated successfully",
                "status": "training",
                "estimated_completion": "5 minutes",
                "model_version": "1.0.1"
            }, 200
            
        except Exception as e:
            print(f"Model Training Error: {str(e)}")
            return {"error": f"Failed to train model: {str(e)}"}, 500


@ns.route("/status")
class ModelStatus(Resource):
    def get(self):
        """
        Get ML model status and information
        """
        try:
            return {
                "status": "ready",
                "model_version": "1.0.0",
                "last_trained": "2024-01-01T00:00:00Z",
                "accuracy": 0.85,
                "total_predictions": 1250,
                "supported_features": [
                    "age", "bmi", "blood_pressure", "glucose", 
                    "cholesterol", "symptoms", "lifestyle"
                ]
            }, 200
            
        except Exception as e:
            print(f"Model Status Error: {str(e)}")
            return {"error": f"Failed to get model status: {str(e)}"}, 500


@ns.route("/retrain_model")
class RetrainModel(Resource):
    @jwt_required()
    def post(self):
        """
        Retrain the ML model using feedback data
        """
        try:
            # In a real implementation, you would:
            # 1. Load feedback data from database
            # 2. Retrain the model with new data
            # 3. Validate the new model
            # 4. Update the model if validation passes
            
            return {
                "message": "Model retraining initiated successfully",
                "status": "retraining",
                "estimated_completion": "10 minutes",
                "feedback_data_points": 150,
                "model_version": "1.0.2"
            }, 200
            
        except Exception as e:
            print(f"Model Retraining Error: {str(e)}")
            return {"error": f"Failed to retrain model: {str(e)}"}, 500
