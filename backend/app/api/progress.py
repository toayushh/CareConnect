from datetime import datetime, date, timedelta
from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_jwt_extended.exceptions import JWTExtendedException

from ..extensions import db
from ..models.user import User
from ..models.patient import PatientProfile
from ..models.doctor import Doctor
from ..models.progress import (
    SymptomEntry, MoodEntry, ActivityEntry, 
    ClinicalAssessment, ProgressGoal, TreatmentPlan, LeapFrogSuggestion
)

ns = Namespace("progress", description="Patient progress tracking")

# API Models
symptom_model = ns.model("SymptomEntry", {
    "symptom_name": fields.String(required=True),
    "severity": fields.Integer(required=True, min=1, max=10),
    "location": fields.String,
    "duration": fields.String,
    "triggers": fields.String,
    "notes": fields.String,
    "tags": fields.List(fields.String)
})

mood_model = ns.model("MoodEntry", {
    "mood_score": fields.Integer(required=True, min=1, max=10),
    "energy_level": fields.Integer(min=1, max=10),
    "stress_level": fields.Integer(min=1, max=10),
    "sleep_quality": fields.Integer(min=1, max=10),
    "mood_tags": fields.List(fields.String),
    "social_interactions": fields.Integer(min=1, max=10),
    "weather_impact": fields.String,
    "notes": fields.String,
    "date_recorded": fields.String  # YYYY-MM-DD format
})

activity_model = ns.model("ActivityEntry", {
    "activity_type": fields.String(required=True),
    "activity_name": fields.String(required=True),
    "duration": fields.Integer,
    "intensity": fields.Integer(min=1, max=10),
    "completed": fields.Boolean,
    "notes": fields.String,
    "metadata": fields.Raw,
    "date_recorded": fields.String  # YYYY-MM-DD format
})

goal_model = ns.model("ProgressGoal", {
    "goal_type": fields.String(required=True),
    "title": fields.String(required=True),
    "description": fields.String,
    "target_value": fields.Float,
    "measurement_unit": fields.String,
    "target_date": fields.String  # YYYY-MM-DD format
})

assessment_model = ns.model("ClinicalAssessment", {
    "assessment_type": fields.String(required=True),
    "responses": fields.Raw(required=True)  # Question responses
})


def get_patient_from_user():
    """Get patient profile from current user"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != "patient":
        return None
    return PatientProfile.query.filter_by(user_id=user_id).first()


def get_doctor_from_user():
    """Get doctor profile from current user"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != "doctor":
        return None
    return Doctor.query.filter_by(user_id=user_id).first()


def get_timeframe_dates(timeframe):
    """Get start and end dates based on timeframe parameter"""
    today = date.today()
    if timeframe == "week":
        start_date = today - timedelta(days=7)
    elif timeframe == "month":
        start_date = today - timedelta(days=30)
    elif timeframe == "quarter":
        start_date = today - timedelta(days=90)
    else:  # default to week
        start_date = today - timedelta(days=7)
    
    return start_date, today


# Doctor endpoints for accessing patient data
@ns.route("/symptoms")
class SymptomList(Resource):
    @jwt_required()
    def get(self):
        """Get patient's symptom entries or doctor access to patient symptoms"""
        try:
            patient_id = request.args.get("patient_id")
            
            if patient_id:
                # Doctor accessing patient data
                doctor = get_doctor_from_user()
                if not doctor:
                    return {"message": "Doctor access required"}, 403
                
                # Verify patient exists and is under this doctor's care
                patient = PatientProfile.query.get(patient_id)
                if not patient:
                    return {"message": "Patient not found"}, 404
                
                # TODO: Add doctor-patient relationship verification
                # For now, allow access to any patient
                
                timeframe = request.args.get("timeframe", "week")
                start_date, end_date = get_timeframe_dates(timeframe)
                
                symptoms = SymptomEntry.query.filter_by(patient_id=patient_id)\
                    .filter(SymptomEntry.created_at >= datetime.combine(start_date, datetime.min.time()))\
                    .filter(SymptomEntry.created_at <= datetime.combine(end_date, datetime.max.time()))\
                    .order_by(SymptomEntry.created_at.desc()).all()
                
                return [{
                    "id": s.id,
                    "patient_id": s.patient_id,
                    "symptom_name": s.symptom_name,
                    "severity": s.severity,
                    "location": s.location,
                    "duration": s.duration,
                    "triggers": s.triggers,
                    "notes": s.notes,
                    "tags": s.tags or [],
                    "created_at": s.created_at.isoformat()
                } for s in symptoms]
            else:
                # Patient accessing own data
                patient = get_patient_from_user()
                if not patient:
                    return {"message": "Patient profile not found"}, 404
                
                limit = min(int(request.args.get("limit", 50)), 100)
                symptoms = SymptomEntry.query.filter_by(patient_id=patient.id)\
                    .order_by(SymptomEntry.created_at.desc())\
                    .limit(limit).all()
                
                return [{
                    "id": s.id,
                    "symptom_name": s.symptom_name,
                    "severity": s.severity,
                    "location": s.location,
                    "duration": s.duration,
                    "triggers": s.triggers,
                    "notes": s.notes,
                    "tags": s.tags or [],
                    "created_at": s.created_at.isoformat()
                } for s in symptoms]
        except JWTExtendedException as e:
            return {"message": str(e)}, 401
        except Exception as e:
            return {"message": "Internal server error"}, 500
    
    @jwt_required()
    @ns.expect(symptom_model)
    def post(self):
        """Record a new symptom entry"""
        patient = get_patient_from_user()
        if not patient:
            return {"message": "Patient profile not found"}, 404
        
        data = request.get_json()
        symptom = SymptomEntry(
            patient_id=patient.id,
            **data
        )
        db.session.add(symptom)
        db.session.commit()
        
        return {"id": symptom.id, "message": "Symptom recorded successfully"}, 201


@ns.route("/mood")
class MoodList(Resource):
    @jwt_required()
    def get(self):
        """Get patient's mood entries or doctor access to patient mood"""
        patient_id = request.args.get("patient_id")
        
        if patient_id:
            # Doctor accessing patient data
            doctor = get_doctor_from_user()
            if not doctor:
                return {"message": "Doctor access required"}, 403
            
            patient = PatientProfile.query.get(patient_id)
            if not patient:
                return {"message": "Patient not found"}, 404
            
            timeframe = request.args.get("timeframe", "week")
            start_date, end_date = get_timeframe_dates(timeframe)
            
            moods = MoodEntry.query.filter_by(patient_id=patient_id)\
                .filter(MoodEntry.date_recorded >= start_date)\
                .filter(MoodEntry.date_recorded <= end_date)\
                .order_by(MoodEntry.date_recorded.desc()).all()
            
            return [{
                "id": m.id,
                "patient_id": m.patient_id,
                "mood_score": m.mood_score,
                "energy_level": m.energy_level,
                "stress_level": m.stress_level,
                "sleep_quality": m.sleep_quality,
                "mood_tags": m.mood_tags or [],
                "social_interactions": m.social_interactions,
                "weather_impact": m.weather_impact,
                "notes": m.notes,
                "date_recorded": m.date_recorded.isoformat(),
                "created_at": m.created_at.isoformat()
            } for m in moods]
        else:
            # Patient accessing own data
            patient = get_patient_from_user()
            if not patient:
                return {"message": "Patient profile not found"}, 404
            
            limit = min(int(request.args.get("limit", 30)), 100)
            moods = MoodEntry.query.filter_by(patient_id=patient.id)\
                .order_by(MoodEntry.date_recorded.desc())\
                .limit(limit).all()
            
            return [{
                "id": m.id,
                "mood_score": m.mood_score,
                "energy_level": m.energy_level,
                "stress_level": m.stress_level,
                "sleep_quality": m.sleep_quality,
                "mood_tags": m.mood_tags or [],
                "social_interactions": m.social_interactions,
                "weather_impact": m.weather_impact,
                "notes": m.notes,
                "date_recorded": m.date_recorded.isoformat(),
                "created_at": m.created_at.isoformat()
            } for m in moods]
    
    @jwt_required()
    @ns.expect(mood_model)
    def post(self):
        """Record a new mood entry"""
        patient = get_patient_from_user()
        if not patient:
            return {"message": "Patient profile not found"}, 404
        
        data = request.get_json()
        
        # Parse date if provided
        date_recorded = date.today()
        if data.get("date_recorded"):
            try:
                date_recorded = datetime.strptime(data["date_recorded"], "%Y-%m-%d").date()
            except ValueError:
                return {"message": "Invalid date format. Use YYYY-MM-DD"}, 400
        
        mood = MoodEntry(
            patient_id=patient.id,
            date_recorded=date_recorded,
            **{k: v for k, v in data.items() if k != "date_recorded"}
        )
        db.session.add(mood)
        db.session.commit()
        
        return {"id": mood.id, "message": "Mood entry recorded successfully"}, 201


@ns.route("/activities")
class ActivityList(Resource):
    @jwt_required()
    def get(self):
        """Get patient's activity entries or doctor access to patient activities"""
        patient_id = request.args.get("patient_id")
        
        if patient_id:
            # Doctor accessing patient data
            doctor = get_doctor_from_user()
            if not doctor:
                return {"message": "Doctor access required"}, 403
            
            patient = PatientProfile.query.get(patient_id)
            if not patient:
                return {"message": "Patient not found"}, 404
            
            timeframe = request.args.get("timeframe", "week")
            start_date, end_date = get_timeframe_dates(timeframe)
            
            activity_type = request.args.get("type")
            query = ActivityEntry.query.filter_by(patient_id=patient_id)\
                .filter(ActivityEntry.date_recorded >= start_date)\
                .filter(ActivityEntry.date_recorded <= end_date)
            
            if activity_type:
                query = query.filter_by(activity_type=activity_type)
            
            activities = query.order_by(ActivityEntry.date_recorded.desc()).all()
            
            return [{
                "id": a.id,
                "patient_id": a.patient_id,
                "activity_type": a.activity_type,
                "activity_name": a.activity_name,
                "duration": a.duration,
                "intensity": a.intensity,
                "completed": a.completed,
                "notes": a.notes,
                "metadata": a.activity_metadata,
                "date_recorded": a.date_recorded.isoformat(),
                "created_at": a.created_at.isoformat()
            } for a in activities]
        else:
            # Patient accessing own data
            patient = get_patient_from_user()
            if not patient:
                return {"message": "Patient profile not found"}, 404
            
            activity_type = request.args.get("type")
            limit = min(int(request.args.get("limit", 50)), 100)
            
            query = ActivityEntry.query.filter_by(patient_id=patient.id)
            if activity_type:
                query = query.filter_by(activity_type=activity_type)
            
            activities = query.order_by(ActivityEntry.date_recorded.desc()).limit(limit).all()
            
            return [{
                "id": a.id,
                "activity_type": a.activity_type,
                "activity_name": a.activity_name,
                "duration": a.duration,
                "intensity": a.intensity,
                "completed": a.completed,
                "notes": a.notes,
                "metadata": a.activity_metadata,
                "date_recorded": a.date_recorded.isoformat(),
                "created_at": a.created_at.isoformat()
            } for a in activities]
    
    @jwt_required()
    @ns.expect(activity_model)
    def post(self):
        """Record a new activity entry"""
        patient = get_patient_from_user()
        if not patient:
            return {"message": "Patient profile not found"}, 404
        
        data = request.get_json()
        
        # Parse date if provided
        date_recorded = date.today()
        if data.get("date_recorded"):
            try:
                date_recorded = datetime.strptime(data["date_recorded"], "%Y-%m-%d").date()
            except ValueError:
                return {"message": "Invalid date format. Use YYYY-MM-DD"}, 400
        
        # Handle metadata separately to map to activity_metadata
        activity_data = {k: v for k, v in data.items() if k not in ["date_recorded", "metadata"]}
        if "metadata" in data:
            activity_data["activity_metadata"] = data["metadata"]
        
        activity = ActivityEntry(
            patient_id=patient.id,
            date_recorded=date_recorded,
            **activity_data
        )
        db.session.add(activity)
        db.session.commit()
        
        return {"id": activity.id, "message": "Activity recorded successfully"}, 201


@ns.route("/goals")
class GoalList(Resource):
    @jwt_required()
    def get(self):
        """Get patient's progress goals"""
        patient = get_patient_from_user()
        if not patient:
            return {"message": "Patient profile not found"}, 404
        
        status = request.args.get("status", "active")
        goals = ProgressGoal.query.filter_by(patient_id=patient.id, status=status)\
            .order_by(ProgressGoal.created_at.desc()).all()
        
        return [{
            "id": g.id,
            "goal_type": g.goal_type,
            "title": g.title,
            "description": g.description,
            "target_value": g.target_value,
            "current_value": g.current_value,
            "measurement_unit": g.measurement_unit,
            "target_date": g.target_date.isoformat() if g.target_date else None,
            "status": g.status,
            "progress_percentage": g.progress_percentage,
            "created_at": g.created_at.isoformat(),
            "updated_at": g.updated_at.isoformat()
        } for g in goals]
    
    @jwt_required()
    @ns.expect(goal_model)
    def post(self):
        """Create a new progress goal"""
        patient = get_patient_from_user()
        if not patient:
            return {"message": "Patient profile not found"}, 404
        
        data = request.get_json()
        
        # Parse target date if provided
        target_date = None
        if data.get("target_date"):
            try:
                target_date = datetime.strptime(data["target_date"], "%Y-%m-%d").date()
            except ValueError:
                return {"message": "Invalid date format. Use YYYY-MM-DD"}, 400
        
        goal = ProgressGoal(
            patient_id=patient.id,
            target_date=target_date,
            **{k: v for k, v in data.items() if k != "target_date"}
        )
        db.session.add(goal)
        db.session.commit()
        
        return {"id": goal.id, "message": "Goal created successfully"}, 201


@ns.route("/analytics")
class ProgressAnalytics(Resource):
    @jwt_required()
    def get(self):
        """Get progress analytics and insights"""
        patient = get_patient_from_user()
        if not patient:
            return {"message": "Patient profile not found"}, 404
        
        # Get recent mood trend (last 7 days)
        recent_moods = MoodEntry.query.filter_by(patient_id=patient.id)\
            .filter(MoodEntry.date_recorded >= date.today().replace(day=date.today().day-7))\
            .order_by(MoodEntry.date_recorded.asc()).all()
        
        # Get symptom frequency (last 30 days)
        recent_symptoms = SymptomEntry.query.filter_by(patient_id=patient.id)\
            .filter(SymptomEntry.created_at >= datetime.now().replace(day=datetime.now().day-30))\
            .all()
        
        # Calculate analytics
        mood_trend = [{"date": m.date_recorded.isoformat(), "score": m.mood_score} for m in recent_moods]
        
        symptom_frequency = {}
        for symptom in recent_symptoms:
            name = symptom.symptom_name
            symptom_frequency[name] = symptom_frequency.get(name, 0) + 1
        
        avg_mood = sum(m.mood_score for m in recent_moods) / len(recent_moods) if recent_moods else 0
        
        return {
            "mood_trend": mood_trend,
            "average_mood_7_days": round(avg_mood, 1),
            "symptom_frequency": symptom_frequency,
            "total_symptoms_30_days": len(recent_symptoms),
            "insights": [
                f"Your average mood over the last 7 days was {avg_mood:.1f}/10",
                f"You reported {len(recent_symptoms)} symptoms in the last 30 days"
            ]
        }
