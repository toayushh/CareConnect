from datetime import datetime, timedelta, date
from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, desc

from ..extensions import db
from ..models.medical_records import VitalSign, HealthMetric
from ..models.progress import SymptomEntry, MoodEntry, ActivityEntry
from ..models.appointment import Appointment
from ..models.patient import PatientProfile
from ..models.user import User

ns = Namespace("health-analytics", description="Health Analytics and Dashboard")

health_metric_model = ns.model("HealthMetric", {
    "overall_health_score": fields.Float(),
    "physical_health_score": fields.Float(),
    "mental_health_score": fields.Float(),
    "lifestyle_score": fields.Float(),
    "steps_count": fields.Integer(),
    "active_minutes": fields.Integer(),
    "sleep_hours": fields.Float(),
    "water_intake": fields.Float(),
    "stress_level": fields.Integer(),
    "energy_level": fields.Integer(),
    "pain_level": fields.Integer()
})


def get_patient_from_user():
    """Helper to get patient profile from JWT user"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != "patient":
        return None
    return PatientProfile.query.filter_by(user_id=user_id).first()


def calculate_health_scores(patient_id):
    """Calculate health scores based on patient data"""
    # Get recent data (last 30 days)
    thirty_days_ago = date.today() - timedelta(days=30)
    
    # Get recent mood entries
    mood_entries = MoodEntry.query.filter(
        MoodEntry.patient_id == patient_id,
        MoodEntry.date_recorded >= thirty_days_ago
    ).all()
    
    # Get recent activity entries
    activity_entries = ActivityEntry.query.filter(
        ActivityEntry.patient_id == patient_id,
        ActivityEntry.date_recorded >= thirty_days_ago
    ).all()
    
    # Get recent symptom entries
    symptom_entries = SymptomEntry.query.filter(
        SymptomEntry.patient_id == patient_id,
        SymptomEntry.created_at >= datetime.combine(thirty_days_ago, datetime.min.time())
    ).all()
    
    # Calculate scores (0-100)
    mental_health_score = 75  # Default
    if mood_entries:
        avg_mood = sum(entry.mood_score for entry in mood_entries) / len(mood_entries)
        mental_health_score = min(100, max(0, avg_mood * 10))
    
    physical_health_score = 85  # Default
    if symptom_entries:
        avg_severity = sum(entry.severity for entry in symptom_entries) / len(symptom_entries)
        physical_health_score = min(100, max(0, 100 - (avg_severity * 8)))
    
    lifestyle_score = 80  # Default
    if activity_entries:
        active_days = len([e for e in activity_entries if e.duration_minutes >= 30])
        lifestyle_score = min(100, (active_days / 30) * 100)
    
    overall_health_score = (mental_health_score + physical_health_score + lifestyle_score) / 3
    
    return {
        "overall_health_score": round(overall_health_score, 1),
        "physical_health_score": round(physical_health_score, 1),
        "mental_health_score": round(mental_health_score, 1),
        "lifestyle_score": round(lifestyle_score, 1)
    }


@ns.route("/dashboard")
class HealthDashboard(Resource):
    @jwt_required()
    def get(self):
        """Get comprehensive health dashboard data"""
        patient = get_patient_from_user()
        if not patient:
            return {"message": "Patient profile not found"}, 404
        
        # Get appointments summary
        appointments = Appointment.query.filter_by(patient_id=patient.id).all()
        upcoming_appointments = [a for a in appointments if a.start_time > datetime.utcnow() and a.status == 'scheduled']
        completed_appointments = [a for a in appointments if a.status == 'completed']
        
        # Get latest vitals
        latest_vital = VitalSign.query.filter_by(patient_id=patient.id).order_by(VitalSign.measurement_date.desc()).first()
        
        # Get recent activity
        recent_activities = []
        
        # Recent appointments
        recent_appts = Appointment.query.filter_by(patient_id=patient.id).order_by(Appointment.start_time.desc()).limit(3).all()
        for appt in recent_appts:
            recent_activities.append({
                "id": f"appt_{appt.id}",
                "type": "appointment",
                "description": f"Appointment with {appt.doctor.user.full_name if appt.doctor and appt.doctor.user else 'Doctor'}",
                "date": appt.start_time.isoformat(),
                "icon": "📅"
            })
        
        # Recent mood entries
        recent_moods = MoodEntry.query.filter_by(patient_id=patient.id).order_by(MoodEntry.created_at.desc()).limit(2).all()
        for mood in recent_moods:
            recent_activities.append({
                "id": f"mood_{mood.id}",
                "type": "progress",
                "description": f"Mood updated: {mood.mood_score}/10",
                "date": mood.created_at.isoformat(),
                "icon": "😊"
            })
        
        # Recent health recommendations
        from ..models.recommendations import HealthRecommendation
        recent_recommendations = HealthRecommendation.query.filter_by(patient_id=patient.id).order_by(HealthRecommendation.created_at.desc()).limit(2).all()
        for rec in recent_recommendations:
            recent_activities.append({
                "id": f"rec_{rec.id}",
                "type": "recommendation",
                "description": f"New recommendation: {rec.title}",
                "date": rec.created_at.isoformat(),
                "icon": "🧠"
            })
        
        # Sort activities by date
        recent_activities.sort(key=lambda x: x["date"], reverse=True)
        recent_activities = recent_activities[:5]  # Keep only 5 most recent
        
        # Calculate health scores
        health_scores = calculate_health_scores(patient.id)
        
        # Build vitals summary
        vitals_summary = None
        if latest_vital:
            vitals_summary = {
                "blood_pressure": f"{latest_vital.systolic_bp}/{latest_vital.diastolic_bp}" if latest_vital.systolic_bp and latest_vital.diastolic_bp else None,
                "heart_rate": f"{latest_vital.heart_rate} bpm" if latest_vital.heart_rate else None,
                "weight": f"{latest_vital.weight} lbs" if latest_vital.weight else None,
                "temperature": f"{latest_vital.temperature}°F" if latest_vital.temperature else None,
                "last_measured": latest_vital.measurement_date.isoformat()
            }
        
        # Get medications count
        from ..models.medical_records import Medication
        active_medications = Medication.query.filter_by(patient_id=patient.id, status="Active").count()
        
        return {
            "appointments": {
                "total": len(appointments),
                "upcoming": len(upcoming_appointments),
                "completed": len(completed_appointments)
            },
            "vitals": vitals_summary,
            "medications": {
                "active": active_medications,
                "pending": 0  # Could be calculated based on refill dates
            },
            "health_scores": health_scores,
            "recent_activity": recent_activities
        }


@ns.route("/metrics")
class HealthMetricsResource(Resource):
    @jwt_required()
    def get(self):
        """Get health metrics over time"""
        patient = get_patient_from_user()
        if not patient:
            return {"message": "Patient profile not found"}, 404
        
        # Get date range from query params
        days = request.args.get('days', 30, type=int)
        start_date = date.today() - timedelta(days=days)
        
        # Get health metrics
        metrics = HealthMetric.query.filter(
            HealthMetric.patient_id == patient.id,
            HealthMetric.metric_date >= start_date
        ).order_by(HealthMetric.metric_date.desc()).all()
        
        return [metric.to_dict() for metric in metrics]
    
    @jwt_required()
    @ns.expect(health_metric_model, validate=True)
    def post(self):
        """Log daily health metrics"""
        patient = get_patient_from_user()
        if not patient:
            return {"message": "Patient profile not found"}, 404
        
        data = request.get_json()
        today = date.today()
        
        # Check if metrics already exist for today
        existing = HealthMetric.query.filter_by(
            patient_id=patient.id,
            metric_date=today
        ).first()
        
        if existing:
            # Update existing
            for key, value in data.items():
                if hasattr(existing, key) and value is not None:
                    setattr(existing, key, value)
            existing.updated_at = datetime.utcnow()
        else:
            # Create new
            metric = HealthMetric(
                patient_id=patient.id,
                metric_date=today,
                **data
            )
            db.session.add(metric)
        
        db.session.commit()
        
        # Return updated/created metric
        result = existing if existing else metric
        return result.to_dict(), 201


@ns.route("/vital-trends")
class VitalTrends(Resource):
    @jwt_required()
    def get(self):
        """Get vital signs trends"""
        patient = get_patient_from_user()
        if not patient:
            return {"message": "Patient profile not found"}, 404
        
        # Get date range from query params
        days = request.args.get('days', 30, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        vitals = VitalSign.query.filter(
            VitalSign.patient_id == patient.id,
            VitalSign.measurement_date >= start_date
        ).order_by(VitalSign.measurement_date.desc()).all()
        
        # Process data for trends
        bp_data = []
        weight_data = []
        heart_rate_data = []
        
        for vital in vitals:
            date_str = vital.measurement_date.strftime('%Y-%m-%d')
            
            if vital.systolic_bp and vital.diastolic_bp:
                bp_data.append({
                    "date": date_str,
                    "systolic": vital.systolic_bp,
                    "diastolic": vital.diastolic_bp
                })
            
            if vital.weight:
                weight_data.append({
                    "date": date_str,
                    "weight": vital.weight
                })
            
            if vital.heart_rate:
                heart_rate_data.append({
                    "date": date_str,
                    "heart_rate": vital.heart_rate
                })
        
        return {
            "blood_pressure": bp_data,
            "weight": weight_data,
            "heart_rate": heart_rate_data
        }


@ns.route("/progress-summary")
class ProgressSummary(Resource):
    @jwt_required()
    def get(self):
        """Get progress tracking summary"""
        patient = get_patient_from_user()
        if not patient:
            return {"message": "Patient profile not found"}, 404
        
        # Get date range
        days = request.args.get('days', 30, type=int)
        start_date = date.today() - timedelta(days=days)
        
        # Get mood trends
        mood_entries = MoodEntry.query.filter(
            MoodEntry.patient_id == patient.id,
            MoodEntry.date_recorded >= start_date
        ).order_by(MoodEntry.date_recorded.desc()).all()
        
        # Get activity summary
        activity_entries = ActivityEntry.query.filter(
            ActivityEntry.patient_id == patient.id,
            ActivityEntry.date_recorded >= start_date
        ).all()
        
        # Get symptom summary
        symptom_entries = SymptomEntry.query.filter(
            SymptomEntry.patient_id == patient.id,
            SymptomEntry.created_at >= datetime.combine(start_date, datetime.min.time())
        ).all()
        
        # Calculate summaries
        mood_avg = sum(entry.mood_score for entry in mood_entries) / len(mood_entries) if mood_entries else 0
        active_days = len(set(entry.date_recorded for entry in activity_entries))
        total_symptoms = len(symptom_entries)
        avg_symptom_severity = sum(entry.severity for entry in symptom_entries) / len(symptom_entries) if symptom_entries else 0
        
        return {
            "mood": {
                "average_score": round(mood_avg, 1),
                "entries_count": len(mood_entries),
                "trend": "improving" if mood_avg > 6 else "stable" if mood_avg > 4 else "concerning"
            },
            "activity": {
                "active_days": active_days,
                "total_entries": len(activity_entries),
                "goal_achievement": min(100, (active_days / days) * 100)
            },
            "symptoms": {
                "total_reported": total_symptoms,
                "average_severity": round(avg_symptom_severity, 1),
                "status": "low" if avg_symptom_severity < 3 else "moderate" if avg_symptom_severity < 6 else "high"
            }
        }


@ns.route("/accuracy_vs_feedback")
class AccuracyVsFeedback(Resource):
    @jwt_required()
    def get(self):
        """
        Get AI accuracy vs doctor feedback statistics
        """
        try:
            # Mock data - in real implementation, you'd query the feedback table
            return {
                "total_predictions": 1250,
                "doctor_approved": 980,
                "doctor_rejected": 270,
                "accuracy_rate": 78.4,
                "feedback_compliance": 85.2,
                "recent_trends": {
                    "last_week": 82.1,
                    "last_month": 79.3,
                    "last_quarter": 76.8
                },
                "by_specialty": {
                    "cardiology": 85.2,
                    "neurology": 72.1,
                    "orthopedics": 79.8,
                    "psychiatry": 81.5
                }
            }, 200
        except Exception as e:
            return {"error": f"Failed to get accuracy data: {str(e)}"}, 500


@ns.route("/trends")
class HealthTrends(Resource):
    @jwt_required()
    def get(self):
        """
        Get health trends and patterns
        """
        try:
            # Mock data - in real implementation, you'd analyze historical data
            return {
                "patient_improvement_rate": 73.5,
                "treatment_effectiveness": 81.2,
                "common_conditions": [
                    {"condition": "Hypertension", "frequency": 45, "trend": "increasing"},
                    {"condition": "Diabetes", "frequency": 32, "trend": "stable"},
                    {"condition": "Anxiety", "frequency": 28, "trend": "decreasing"}
                ],
                "seasonal_patterns": {
                    "winter": {"respiratory": 35, "mental_health": 42},
                    "spring": {"allergies": 28, "exercise": 65},
                    "summer": {"heat_stress": 15, "injury": 38},
                    "fall": {"depression": 45, "chronic_pain": 52}
                }
            }, 200
        except Exception as e:
            return {"error": f"Failed to get trends data: {str(e)}"}, 500


@ns.route("/doctor_performance")
class DoctorPerformance(Resource):
    @jwt_required()
    def get(self):
        """
        Get doctor performance analytics
        """
        try:
            # Mock data - in real implementation, you'd query doctor performance metrics
            return {
                "total_doctors": 45,
                "average_rating": 4.6,
                "patient_satisfaction": 87.3,
                "treatment_success_rate": 79.8,
                "top_performers": [
                    {"name": "Dr. Smith", "specialty": "Cardiology", "rating": 4.9, "patients": 156},
                    {"name": "Dr. Johnson", "specialty": "Neurology", "rating": 4.8, "patients": 142},
                    {"name": "Dr. Williams", "specialty": "Orthopedics", "rating": 4.7, "patients": 134}
                ],
                "specialty_performance": {
                    "cardiology": {"avg_rating": 4.7, "success_rate": 82.1},
                    "neurology": {"avg_rating": 4.6, "success_rate": 78.9},
                    "orthopedics": {"avg_rating": 4.5, "success_rate": 76.3}
                }
            }, 200
        except Exception as e:
            return {"error": f"Failed to get doctor performance data: {str(e)}"}, 500
