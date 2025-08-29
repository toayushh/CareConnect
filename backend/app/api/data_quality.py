from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta

from ..extensions import db
from ..models.user import User
from ..models.patient import PatientProfile
from ..models.doctor import Doctor

ns = Namespace("data-quality", description="Data quality assessment and validation")

@ns.route("/assessment/<int:patient_id>")
class DataQualityAssessment(Resource):
    @jwt_required()
    def get(self, patient_id):
        """Get comprehensive data quality assessment for a patient"""
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return {"message": "User not found"}, 404

        # Check access permissions
        if user.role == "patient":
            profile = PatientProfile.query.filter_by(user_id=user_id).first()
            if not profile or profile.id != patient_id:
                return {"message": "Unauthorized"}, 403
        elif user.role == "doctor":
            profile = Doctor.query.filter_by(user_id=user_id).first()
            if not profile:
                return {"message": "Doctor profile not found"}, 404
        else:
            return {"message": "Invalid user role"}, 403

        # Get date range from query params
        date_range = request.args.get("range", "30d")
        if date_range == "7d":
            days_back = 7
        elif date_range == "90d":
            days_back = 90
        else:
            days_back = 30

        # Return mock data for now
        return {
            "patient_id": patient_id,
            "date_completed": datetime.now().isoformat(),
            "date_range_days": days_back,
            "overall_score": 0.85,
            "quality_metrics": {
                "completeness": {
                    "value": 0.8,
                    "threshold": 0.8,
                    "status": "good",
                    "description": "Data completeness: 80.0% of expected data types present"
                },
                "consistency": {
                    "value": 0.7,
                    "threshold": 0.7,
                    "status": "good",
                    "description": "Data consistency: 21 unique days with data out of 30 days"
                },
                "recency": {
                    "value": 0.9,
                    "threshold": 0.8,
                    "status": "excellent",
                    "description": "Data recency: 1 days since last entry"
                },
                "accuracy": {
                    "value": 0.95,
                    "threshold": 0.9,
                    "status": "excellent",
                    "description": "Data accuracy: High quality with minimal validation issues"
                },
                "volume": {
                    "value": 0.75,
                    "threshold": 0.6,
                    "status": "good",
                    "description": "Data volume: Sufficient data for analysis"
                }
            },
            "recommendations": [
                "Consider adding more detailed symptom tracking",
                "Increase frequency of mood assessments",
                "Document activity patterns more consistently"
            ],
            "data_summary": {
                "total_symptom_entries": 15,
                "total_mood_entries": 21,
                "total_activity_entries": 18,
                "total_assessments": 3,
                "total_progress_entries": 0
            }
        }
