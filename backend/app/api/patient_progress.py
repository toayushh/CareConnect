from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import random

from ..extensions import db
from ..models.user import User

ns = Namespace("patient_progress", description="Patient progress tracking")

# API Models
symptom_model = ns.model("Symptom", {
    "symptom_name": fields.String(required=True),
    "severity": fields.Integer(min=1, max=10),
    "notes": fields.String,
    "timestamp": fields.String
})

mood_model = ns.model("Mood", {
    "mood_score": fields.Integer(min=1, max=10),
    "energy_level": fields.Integer(min=1, max=10),
    "anxiety_level": fields.Integer(min=1, max=10),
    "notes": fields.String,
    "timestamp": fields.String
})

activity_model = ns.model("Activity", {
    "activity_type": fields.String(required=True),
    "duration": fields.Integer,
    "intensity": fields.String,
    "notes": fields.String,
    "timestamp": fields.String
})

@ns.route("/symptoms")
class SymptomList(Resource):
    @jwt_required()
    def get(self):
        """Get patient symptoms with optional filtering"""
        patient_id = request.args.get("patient_id")
        timeframe = request.args.get("timeframe", "week")
        
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        # Generate mock symptom data with realistic progression
        symptoms = []
        base_date = datetime.now()
        
        days_back = {"week": 7, "month": 30, "quarter": 90}.get(timeframe, 7)
        
        for i in range(days_back):
            date = base_date - timedelta(days=i)
            
            # Simulate realistic symptom patterns
            if random.random() < 0.7:  # 70% chance of symptoms on any day
                symptoms.append({
                    "id": len(symptoms) + 1,
                    "patient_id": patient_id,
                    "symptom_name": random.choice(["Back Pain", "Headache", "Fatigue", "Joint Pain", "Muscle Tension"]),
                    "severity": random.randint(3, 9),
                    "notes": random.choice([
                        "Pain worse in the morning",
                        "Improved after medication",
                        "Triggered by physical activity",
                        "Stress-related episode",
                        "Weather-related discomfort"
                    ]),
                    "created_at": date.isoformat() + "Z",
                    "reported_time": date.strftime("%H:%M")
                })
        
        return sorted(symptoms, key=lambda x: x["created_at"], reverse=True)

@ns.route("/mood")
class MoodList(Resource):
    @jwt_required()
    def get(self):
        """Get patient mood tracking data"""
        patient_id = request.args.get("patient_id")
        timeframe = request.args.get("timeframe", "week")
        
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        mood_entries = []
        base_date = datetime.now()
        days_back = {"week": 7, "month": 30, "quarter": 90}.get(timeframe, 7)
        
        for i in range(days_back):
            date = base_date - timedelta(days=i)
            
            # Simulate mood patterns with some correlation
            base_mood = random.randint(4, 8)
            mood_entries.append({
                "id": len(mood_entries) + 1,
                "patient_id": patient_id,
                "mood_score": base_mood,
                "energy_level": max(1, min(10, base_mood + random.randint(-2, 2))),
                "anxiety_level": max(1, min(10, 11 - base_mood + random.randint(-1, 3))),
                "sleep_quality": random.randint(3, 9),
                "notes": random.choice([
                    "Feeling optimistic today",
                    "Struggling with motivation",
                    "Good day overall",
                    "Anxiety manageable",
                    "Tired but stable mood"
                ]) if random.random() < 0.6 else "",
                "created_at": date.isoformat() + "Z"
            })
        
        return sorted(mood_entries, key=lambda x: x["created_at"], reverse=True)

@ns.route("/activities")
class ActivityList(Resource):
    @jwt_required()
    def get(self):
        """Get patient activity data"""
        patient_id = request.args.get("patient_id")
        timeframe = request.args.get("timeframe", "week")
        
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        activities = []
        base_date = datetime.now()
        days_back = {"week": 7, "month": 30, "quarter": 90}.get(timeframe, 7)
        
        for i in range(days_back):
            date = base_date - timedelta(days=i)
            
            # Multiple activities per day
            daily_activities = random.randint(1, 4)
            for j in range(daily_activities):
                activity_time = date.replace(hour=random.randint(6, 22), minute=random.randint(0, 59))
                
                activity_type = random.choice([
                    "Walking", "Physical Therapy", "Meditation", "Swimming", 
                    "Yoga", "Stretching", "Gym Workout", "Sleep"
                ])
                
                activities.append({
                    "id": len(activities) + 1,
                    "patient_id": patient_id,
                    "activity_type": activity_type,
                    "duration": random.randint(15, 120),
                    "intensity": random.choice(["Low", "Moderate", "High"]),
                    "calories_burned": random.randint(50, 400) if activity_type != "Sleep" else None,
                    "notes": random.choice([
                        "Felt great afterwards",
                        "Had to stop early due to pain",
                        "Challenging but manageable",
                        "Very relaxing",
                        "Good progress today"
                    ]) if random.random() < 0.4 else "",
                    "created_at": activity_time.isoformat() + "Z"
                })
        
        return sorted(activities, key=lambda x: x["created_at"], reverse=True)[:50]

@ns.route("/vitals")
class VitalsList(Resource):
    @jwt_required()
    def get(self):
        """Get patient vital signs"""
        patient_id = request.args.get("patient_id")
        timeframe = request.args.get("timeframe", "week")
        
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        vitals = []
        base_date = datetime.now()
        days_back = {"week": 7, "month": 30, "quarter": 90}.get(timeframe, 7)
        
        for i in range(days_back):
            date = base_date - timedelta(days=i)
            
            if random.random() < 0.8:  # 80% chance of vitals recorded
                vitals.append({
                    "id": len(vitals) + 1,
                    "patient_id": patient_id,
                    "blood_pressure_systolic": random.randint(110, 140),
                    "blood_pressure_diastolic": random.randint(70, 90),
                    "heart_rate": random.randint(60, 100),
                    "temperature": round(random.uniform(97.0, 99.5), 1),
                    "weight": round(random.uniform(150, 180), 1),
                    "oxygen_saturation": random.randint(95, 100),
                    "recorded_by": "Self-monitoring",
                    "created_at": date.isoformat() + "Z"
                })
        
        return sorted(vitals, key=lambda x: x["created_at"], reverse=True)

@ns.route("/correlations")
class CorrelationAnalysis(Resource):
    @jwt_required()
    def get(self):
        """Get AI-powered correlation analysis"""
        patient_id = request.args.get("patient_id")
        
        if not patient_id:
            return {"message": "patient_id parameter is required"}, 400
        
        # Mock AI correlation insights
        correlations = [
            {
                "type": "mood_pain",
                "title": "Mood vs Pain Correlation",
                "correlation": 0.73,
                "insight": "Lower mood scores strongly correlate with higher pain levels",
                "confidence": "High",
                "recommendation": "Consider mood support interventions during high pain episodes"
            },
            {
                "type": "sleep_energy",
                "title": "Sleep Quality vs Energy",
                "correlation": 0.85,
                "insight": "Better sleep quality leads to significantly higher energy levels",
                "confidence": "Very High",
                "recommendation": "Focus on sleep hygiene for improved daily energy"
            },
            {
                "type": "activity_pain",
                "title": "Physical Activity vs Pain",
                "correlation": -0.42,
                "insight": "Regular low-intensity activity reduces pain levels over time",
                "confidence": "Moderate",
                "recommendation": "Maintain consistent gentle exercise routine"
            },
            {
                "type": "weather_symptoms",
                "title": "Weather vs Symptoms",
                "correlation": 0.31,
                "insight": "Symptoms tend to worsen during low pressure weather systems",
                "confidence": "Low",
                "recommendation": "Monitor weather patterns and adjust activity accordingly"
            }
        ]
        
        return correlations

@ns.route("/summary")
class ProgressSummary(Resource):
    @jwt_required()
    def get(self):
        """Get comprehensive progress summary"""
        patient_id = request.args.get("patient_id", 101)
        timeframe = request.args.get("timeframe", "week")
        
        # Generate comprehensive summary
        summary = {
            "patient_id": patient_id,
            "timeframe": timeframe,
            "overall_trend": "Improving",
            "key_metrics": {
                "avg_pain_level": round(random.uniform(4.2, 6.8), 1),
                "avg_mood_score": round(random.uniform(5.5, 7.8), 1),
                "total_activities": random.randint(15, 35),
                "medication_adherence": round(random.uniform(0.85, 0.98), 2)
            },
            "alerts": [
                {
                    "type": "pain_spike",
                    "message": "Pain levels exceeded 8/10 on 2 occasions this week",
                    "severity": "medium",
                    "timestamp": (datetime.now() - timedelta(days=2)).isoformat() + "Z"
                },
                {
                    "type": "mood_concern",
                    "message": "Mood score dropped below 4/10",
                    "severity": "high",
                    "timestamp": (datetime.now() - timedelta(days=1)).isoformat() + "Z"
                }
            ],
            "achievements": [
                {
                    "type": "consistency",
                    "message": "Completed physical therapy 6 days this week",
                    "icon": "🏆"
                },
                {
                    "type": "improvement",
                    "message": "Average mood improved by 15% this month",
                    "icon": "📈"
                }
            ],
            "recommendations": [
                "Continue current meditation practice",
                "Consider adjusting pain medication timing",
                "Schedule follow-up for mood assessment"
            ]
        }
        
        return summary
