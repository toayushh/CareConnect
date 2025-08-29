from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import json

from ..extensions import db
from ..models.user import User
from ..models.patient import PatientProfile
from ..models.doctor import Doctor
from ..models.progress import (
    SymptomEntry, MoodEntry, ActivityEntry, ClinicalAssessment,
    TreatmentPlan
)
from ..ai.leapfrog_engine import AdvancedLeapFrogAI

ns = Namespace("data-quality", description="Data quality assessment and validation")

# API Models
data_validation_model = ns.model("DataValidation", {
    "patient_id": fields.Integer(required=True),
    "validation_type": fields.String(enum=["completeness", "consistency", "recency", "accuracy"], default="completeness"),
    "date_range": fields.String(description="Date range for validation (e.g., '7d', '30d', '90d')")
})

quality_metric_model = ns.model("QualityMetric", {
    "metric_name": fields.String(required=True),
    "value": fields.Float(required=True),
    "threshold": fields.Float(required=True),
    "status": fields.String(enum=["excellent", "good", "fair", "poor"], required=True),
    "description": fields.String(required=True)
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

@ns.route("/assessment/<int:patient_id>")
class DataQualityAssessment(Resource):
    @jwt_required()
    def get(self, patient_id):
        """Get comprehensive data quality assessment for a patient"""
        user, role, profile = get_user_role_and_profile()
        if not user:
            return {"message": "User not found"}, 404

        # Check access permissions
        if role == "patient" and profile.id != patient_id:
            return {"message": "Unauthorized"}, 403
        elif role == "doctor":
            # Verify doctor has access to this patient
            treatment = TreatmentPlan.query.filter_by(
                patient_id=patient_id, doctor_id=profile.id
            ).first()
            if not treatment:
                return {"message": "Unauthorized access to patient"}, 403

        # Get date range from query params
        date_range = request.args.get("range", "30d")
        if date_range == "7d":
            days_back = 7
        elif date_range == "90d":
            days_back = 90
        else:
            days_back = 30

        cutoff_date = datetime.now() - timedelta(days=days_back)

        # Fetch patient data
        symptoms = SymptomEntry.query.filter(
            SymptomEntry.patient_id == patient_id,
            SymptomEntry.created_at >= cutoff_date
        ).all()

        moods = MoodEntry.query.filter(
            MoodEntry.patient_id == patient_id,
            MoodEntry.date_recorded >= cutoff_date
        ).all()

        activities = ActivityEntry.query.filter(
            ActivityEntry.patient_id == patient_id,
            ActivityEntry.date_recorded >= cutoff_date
        ).all()

        assessments = ClinicalAssessment.query.filter(
            ClinicalAssessment.patient_id == patient_id,
            ClinicalAssessment.date_completed >= cutoff_date
        ).all()

        # progress_entries = []  # ProgressEntry model not available

        # Calculate quality metrics
        quality_metrics = calculate_data_quality_metrics(
            symptoms, moods, activities, assessments, [], days_back
        )

        # Generate recommendations
        recommendations = generate_quality_recommendations(quality_metrics)

        return {
            "patient_id": patient_id,
            "date_completed": datetime.now().isoformat(),
            "date_range_days": days_back,
            "quality_metrics": quality_metrics,
            "overall_score": quality_metrics["overall_quality"],
            "recommendations": recommendations,
            "data_summary": {
                "total_symptom_entries": len(symptoms),
                "total_mood_entries": len(moods),
                "total_activity_entries": len(activities),
                "total_assessments": len(assessments),
                "total_progress_entries": 0  # ProgressEntry model not available
            }
        }

def calculate_data_quality_metrics(symptoms, moods, activities, assessments, days_back):
    """Calculate comprehensive data quality metrics"""
    metrics = {}

    # Completeness - check if all data types are present
    data_types = [symptoms, moods, activities, assessments]
    completeness = sum(1 for data in data_types if len(data) > 0) / len(data_types)
    metrics["completeness"] = {
        "value": completeness,
        "threshold": 0.8,
        "status": get_quality_status(completeness, 0.8),
        "description": f"Data completeness: {completeness:.1%} of expected data types present"
    }

    # Consistency - regular data entry patterns
    if moods:
        dates = [m.date_recorded for m in moods]
        unique_dates = len(set(dates))
        expected_entries = min(days_back, 30)  # Cap at 30 days for consistency calculation
        consistency = min(1.0, unique_dates / expected_entries)
        metrics["consistency"] = {
            "value": consistency,
            "threshold": 0.7,
            "status": get_quality_status(consistency, 0.7),
            "description": f"Data consistency: {unique_dates} unique days with data out of {expected_entries} days"
        }
    else:
        metrics["consistency"] = {
            "value": 0.0,
            "threshold": 0.7,
            "status": "poor",
            "description": "No mood data available for consistency assessment"
        }

    # Recency - how recent is the latest data
    most_recent = datetime.now().date()
    latest_entries = []
    
    if symptoms:
        latest_entries.append(symptoms[-1].created_at.date())
    if moods:
        latest_entries.append(moods[-1].date_recorded)
    if activities:
        latest_entries.append(activities[-1].date_recorded)
    if assessments:
        latest_entries.append(assessments[-1].date_completed)
    # if progress_entries:
    #     latest_entries.append(progress_entries[-1].entry_date)  # ProgressEntry not available

    if latest_entries:
        days_since_latest = (most_recent - max(latest_entries)).days
        recency = max(0, 1 - (days_since_latest / 7))  # Decay over 7 days
        metrics["recency"] = {
            "value": recency,
            "threshold": 0.8,
            "status": get_quality_status(recency, 0.8),
            "description": f"Data recency: {days_since_latest} days since last entry"
        }
    else:
        metrics["recency"] = {
            "value": 0.0,
            "threshold": 0.8,
            "status": "poor",
            "description": "No recent data entries found"
        }

    # Accuracy - check for data validation issues
    accuracy_score = 1.0
    validation_issues = []

    # Check for missing required fields
    if symptoms:
        missing_fields = sum(1 for s in symptoms if not s.symptom_type or not s.severity)
        if missing_fields > 0:
            accuracy_score -= 0.1
            validation_issues.append(f"{missing_fields} symptom entries with missing data")

    if moods:
        missing_fields = sum(1 for m in moods if not m.mood_type or m.mood_score is None)
        if missing_fields > 0:
            accuracy_score -= 0.1
            validation_issues.append(f"{missing_fields} mood entries with missing data")

    # Check for unrealistic values
    if symptoms:
        unrealistic_severity = sum(1 for s in symptoms if s.severity < 0 or s.severity > 10)
        if unrealistic_severity > 0:
            accuracy_score -= 0.1
            validation_issues.append(f"{unrealistic_severity} symptom entries with unrealistic severity values")

    if moods:
        unrealistic_mood = sum(1 for m in moods if m.mood_score < 1 or m.mood_score > 10)
        if unrealistic_mood > 0:
            accuracy_score -= 0.1
            validation_issues.append(f"{unrealistic_mood} mood entries with unrealistic mood scores")

    accuracy_score = max(0.0, accuracy_score)
    metrics["accuracy"] = {
        "value": accuracy_score,
        "threshold": 0.9,
        "status": get_quality_status(accuracy_score, 0.9),
        "description": f"Data accuracy: {accuracy_score:.1%} with {len(validation_issues)} validation issues found"
    }

    # Volume - sufficient data for analysis
    total_entries = len(symptoms) + len(moods) + len(activities) + len(assessments)
    expected_entries = days_back * 2  # Expect at least 2 entries per day
    volume_score = min(1.0, total_entries / expected_entries)
    
    metrics["volume"] = {
        "value": volume_score,
        "threshold": 0.6,
        "status": get_quality_status(volume_score, 0.6),
        "description": f"Data volume: {total_entries} entries collected vs {expected_entries} expected"
    }

    # Overall quality score
    overall_quality = sum([
        metrics["completeness"]["value"],
        metrics["consistency"]["value"],
        metrics["recency"]["value"],
        metrics["accuracy"]["value"],
        metrics["volume"]["value"]
    ]) / 5

    metrics["overall_quality"] = overall_quality

    return metrics

def get_quality_status(value, threshold):
    """Determine quality status based on value and threshold"""
    if value >= threshold:
        return "excellent"
    elif value >= threshold * 0.8:
        return "good"
    elif value >= threshold * 0.6:
        return "fair"
    else:
        return "poor"

def generate_quality_recommendations(quality_metrics):
    """Generate recommendations to improve data quality"""
    recommendations = []

    if quality_metrics["completeness"]["status"] in ["fair", "poor"]:
        recommendations.append({
            "priority": "high",
            "category": "completeness",
            "action": "Enable additional data collection methods",
            "description": "Consider adding symptom tracking, mood monitoring, or activity logging"
        })

    if quality_metrics["consistency"]["status"] in ["fair", "poor"]:
        recommendations.append({
            "priority": "high",
            "category": "consistency",
            "action": "Implement daily reminder system",
            "description": "Set up notifications to encourage regular data entry"
        })

    if quality_metrics["recency"]["status"] in ["fair", "poor"]:
        recommendations.append({
            "priority": "medium",
            "category": "recency",
            "action": "Encourage recent data entry",
            "description": "Prompt user to update their health status"
        })

    if quality_metrics["accuracy"]["status"] in ["fair", "poor"]:
        recommendations.append({
            "priority": "medium",
            "category": "accuracy",
            "action": "Review data validation rules",
            "description": "Check for data entry errors and improve validation"
        })

    if quality_metrics["volume"]["status"] in ["fair", "poor"]:
        recommendations.append({
            "priority": "medium",
            "category": "volume",
            "action": "Increase data collection frequency",
            "description": "Encourage more frequent health updates"
        })

    # Add general recommendations
    if len(recommendations) == 0:
        recommendations.append({
            "priority": "low",
            "category": "maintenance",
            "action": "Maintain current data quality",
            "description": "Your data quality is excellent. Keep up the good work!"
        })

    return recommendations

@ns.route("/validation/<int:patient_id>")
class DataValidation(Resource):
    @jwt_required()
    def post(self, patient_id):
        """Validate specific patient data and return quality report"""
        user, role, profile = get_user_role_and_profile()
        if not user:
            return {"message": "User not found"}, 404

        # Check access permissions
        if role == "patient" and profile.id != patient_id:
            return {"message": "Unauthorized"}, 403
        elif role == "doctor":
            treatment = TreatmentPlan.query.filter_by(
                patient_id=patient_id, doctor_id=profile.id
            ).first()
            if not treatment:
                return {"message": "Unauthorized access to patient"}, 403

        data = request.get_json()
        validation_type = data.get("validation_type", "comprehensive")
        date_range = data.get("date_range", "30d")

        # Run validation
        validation_result = run_data_validation(patient_id, validation_type, date_range)

        return {
            "patient_id": patient_id,
            "validation_type": validation_type,
            "validation_date": datetime.now().isoformat(),
            "result": validation_result
        }

def run_data_validation(patient_id, validation_type, date_range):
    """Run specific data validation checks"""
    if date_range == "7d":
        days_back = 7
    elif date_range == "90d":
        days_back = 90
    else:
        days_back = 30

    cutoff_date = datetime.now() - timedelta(days=days_back)

    validation_result = {
        "passed_checks": [],
        "failed_checks": [],
        "warnings": [],
        "total_checks": 0
    }

    # Check data completeness
    validation_result["total_checks"] += 1
    symptoms = SymptomEntry.query.filter(
        SymptomEntry.patient_id == patient_id,
        SymptomEntry.created_at >= cutoff_date
    ).count()
    
    if symptoms >= 5:
        validation_result["passed_checks"].append("Sufficient symptom data for analysis")
    else:
        validation_result["failed_checks"].append(f"Insufficient symptom data: {symptoms} entries (need at least 5)")

    # Check data consistency
    validation_result["total_checks"] += 1
    moods = MoodEntry.query.filter(
        MoodEntry.patient_id == patient_id,
        MoodEntry.date_recorded >= cutoff_date
    ).all()
    
    if moods:
        unique_dates = len(set(m.date_recorded for m in moods))
        if unique_dates >= days_back * 0.3:  # At least 30% of days have data
            validation_result["passed_checks"].append("Good mood data consistency")
        else:
            validation_result["warnings"].append(f"Low mood data consistency: {unique_dates} days with data out of {days_back}")

    # Check data recency
    validation_result["total_checks"] += 1
    latest_entry = db.session.query(
        db.func.max(SymptomEntry.created_at)
    ).filter(SymptomEntry.patient_id == patient_id).scalar()
    
    if latest_entry:
        days_since = (datetime.now() - latest_entry).days
        if days_since <= 3:
            validation_result["passed_checks"].append("Recent data entry detected")
        elif days_since <= 7:
            validation_result["warnings"].append(f"Data is {days_since} days old")
        else:
            validation_result["failed_checks"].append(f"Data is too old: {days_since} days")

    # Check data accuracy
    validation_result["total_checks"] += 1
    invalid_symptoms = SymptomEntry.query.filter(
        SymptomEntry.patient_id == patient_id,
        SymptomEntry.created_at >= cutoff_date,
        db.or_(
            SymptomEntry.severity < 0,
            SymptomEntry.severity > 10,
            SymptomEntry.symptom_type.is_(None)
        )
    ).count()
    
    if invalid_symptoms == 0:
        validation_result["passed_checks"].append("All symptom data is valid")
    else:
        validation_result["failed_checks"].append(f"Found {invalid_symptoms} invalid symptom entries")

    return validation_result

@ns.route("/trends/<int:patient_id>")
class DataQualityTrends(Resource):
    @jwt_required()
    def get(self, patient_id):
        """Get data quality trends over time"""
        user, role, profile = get_user_role_and_profile()
        if not user:
            return {"message": "User not found"}, 404

        # Check access permissions
        if role == "patient" and profile.id != patient_id:
            return {"message": "Unauthorized"}, 403
        elif role == "doctor":
            treatment = TreatmentPlan.query.filter_by(
                patient_id=patient_id, doctor_id=profile.id
            ).first()
            if not treatment:
                return {"message": "Unauthorized access to patient"}, 403

        # Get trends for last 4 weeks
        trends = []
        for week in range(4):
            week_start = datetime.now() - timedelta(weeks=week+1)
            week_end = datetime.now() - timedelta(weeks=week)
            
            # Calculate weekly quality metrics
            weekly_metrics = calculate_weekly_quality(patient_id, week_start, week_end)
            trends.append({
                "week": week + 1,
                "start_date": week_start.isoformat(),
                "end_date": week_end.isoformat(),
                "quality_score": weekly_metrics["overall_quality"],
                "data_points": weekly_metrics["total_entries"]
            })

        return {
            "patient_id": patient_id,
            "trends": trends,
            "analysis": analyze_quality_trends(trends)
        }

def calculate_weekly_quality(patient_id, start_date, end_date):
    """Calculate quality metrics for a specific week"""
    symptoms = SymptomEntry.query.filter(
        SymptomEntry.patient_id == patient_id,
        SymptomEntry.created_at >= start_date,
        SymptomEntry.created_at < end_date
    ).count()

    moods = MoodEntry.query.filter(
        MoodEntry.patient_id == patient_id,
        MoodEntry.date_recorded >= start_date,
        MoodEntry.date_recorded < end_date
    ).count()

    activities = ActivityEntry.query.filter(
        ActivityEntry.patient_id == patient_id,
        ActivityEntry.date_recorded >= start_date,
        ActivityEntry.date_recorded < end_date
    ).count()

    total_entries = symptoms + moods + activities
    
    # Simple quality calculation for weekly data
    if total_entries >= 14:  # Expect at least 2 entries per day
        quality_score = 1.0
    elif total_entries >= 7:
        quality_score = 0.7
    elif total_entries >= 3:
        quality_score = 0.4
    else:
        quality_score = 0.1

    return {
        "overall_quality": quality_score,
        "total_entries": total_entries,
        "symptoms": symptoms,
        "moods": moods,
        "activities": activities
    }

def analyze_quality_trends(trends):
    """Analyze quality trends and provide insights"""
    scores = [t["quality_score"] for t in trends]
    
    if len(scores) < 2:
        return {"trend": "insufficient_data", "description": "Need more data to analyze trends"}
    
    # Calculate trend
    if scores[0] > scores[-1] + 0.1:
        trend = "improving"
        description = "Data quality is improving over time"
    elif scores[-1] > scores[0] + 0.1:
        trend = "declining"
        description = "Data quality is declining - consider intervention"
    else:
        trend = "stable"
        description = "Data quality is stable"
    
    # Calculate average
    avg_score = sum(scores) / len(scores)
    
    return {
        "trend": trend,
        "description": description,
        "average_score": round(avg_score, 2),
        "best_week": max(scores),
        "worst_week": min(scores)
    }
