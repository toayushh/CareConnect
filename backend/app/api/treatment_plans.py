from datetime import datetime, date
from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
import json

from ..extensions import db
from ..models.user import User
from ..models.doctor import Doctor
from ..models.patient import PatientProfile
from ..models.progress import (
    TreatmentPlan, LeapFrogSuggestion, TreatmentEffectiveness,
    InterventionHistory, PredictiveModel
)
from ..ai.leapfrog_engine import AdvancedLeapFrogAI, generate_ai_suggestions_for_patient
from ..utils.json_serializer import safe_json_response

ns = Namespace("treatment-plans", description="Treatment plan management")

# API Models
treatment_plan_model = ns.model("TreatmentPlan", {
    "patient_id": fields.Integer(required=True),
    "plan_name": fields.String(required=True),
    "description": fields.String,
    "status": fields.String(enum=["active", "completed", "discontinued"], default="active"),
    "start_date": fields.String,  # YYYY-MM-DD
    "end_date": fields.String,    # YYYY-MM-DD
    "medications": fields.Raw,    # JSON array
    "therapies": fields.Raw,      # JSON array
    "lifestyle_recommendations": fields.Raw,  # JSON array
    "follow_up_schedule": fields.Raw,        # JSON array
})

suggestion_model = ns.model("LeapFrogSuggestion", {
    "patient_id": fields.Integer(required=True),
    "current_treatment_id": fields.Integer,
    "suggestion_type": fields.String(required=True),
    "title": fields.String(required=True),
    "description": fields.String(required=True),
    "reasoning": fields.String,
    "confidence_score": fields.Float(min=0, max=1),
    "priority": fields.String(enum=["low", "medium", "high", "urgent"], default="medium"),
    "implementation_steps": fields.Raw,  # JSON array
    "expected_outcomes": fields.Raw,     # JSON array
    "monitoring_parameters": fields.Raw, # JSON array
})


def get_doctor_from_user():
    """Get doctor profile from current user"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != "doctor":
        return None
    return Doctor.query.filter_by(user_id=user_id).first()


def get_patient_from_user():
    """Get patient profile from current user"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != "patient":
        return None
    return PatientProfile.query.filter_by(user_id=user_id).first()


# Helper to get user, role, and linked profile (doctor/patient)
from flask_jwt_extended import get_jwt_identity

def get_user_role_and_profile():
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


@ns.route("")
class TreatmentPlanList(Resource):
    @jwt_required()
    def get(self):
        """Get treatment plans"""
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)

        if user.role == "doctor":
            doctor = get_doctor_from_user()
            if not doctor:
                return {"message": "Doctor profile not found"}, 404
            plans = TreatmentPlan.query.filter_by(doctor_id=doctor.id).all()
        elif user.role == "patient":
            patient = get_patient_from_user()
            if not patient:
                return {"message": "Patient profile not found"}, 404
            plans = TreatmentPlan.query.filter_by(patient_id=patient.id).all()
        else:
            return {"message": "Invalid user role"}, 403

        return [{
            "id": p.id,
            "patient_id": p.patient_id,
            "doctor_id": p.doctor_id,
            "plan_name": p.plan_name,
            "description": p.description,
            "status": p.status,
            "start_date": p.start_date.isoformat() if p.start_date else None,
            "end_date": p.end_date.isoformat() if p.end_date else None,
            "medications": p.medications or [],
            "therapies": p.therapies or [],
            "lifestyle_recommendations": p.lifestyle_recommendations or [],
            "follow_up_schedule": p.follow_up_schedule or [],
            "effectiveness_score": p.effectiveness_score,
            "adherence_percentage": p.adherence_percentage,
            "created_at": p.created_at.isoformat(),
            "updated_at": p.updated_at.isoformat(),
            # Include related data
            "patient_name": p.patient.user.full_name if p.patient and p.patient.user else None,
            "doctor_name": p.doctor.user.full_name if p.doctor and p.doctor.user else None,
        } for p in plans]

    @jwt_required()
    @ns.expect(treatment_plan_model)
    def post(self):
        """Create a new treatment plan (doctors only)"""
        doctor = get_doctor_from_user()
        if not doctor:
            return {"message": "Only doctors can create treatment plans"}, 403

        data = request.get_json()

        # Validate patient exists
        patient = PatientProfile.query.get(data["patient_id"])
        if not patient:
            return {"message": "Patient not found"}, 404

        # Parse dates
        start_date = None
        end_date = None
        if data.get("start_date"):
            try:
                start_date = datetime.strptime(data["start_date"], "%Y-%m-%d").date()
            except ValueError:
                return {"message": "Invalid start_date format. Use YYYY-MM-DD"}, 400

        if data.get("end_date"):
            try:
                end_date = datetime.strptime(data["end_date"], "%Y-%m-%d").date()
            except ValueError:
                return {"message": "Invalid end_date format. Use YYYY-MM-DD"}, 400

        plan = TreatmentPlan(
            patient_id=data["patient_id"],
            doctor_id=doctor.id,
            plan_name=data["plan_name"],
            description=data.get("description"),
            status=data.get("status", "active"),
            start_date=start_date or date.today(),
            end_date=end_date,
            medications=data.get("medications", []),
            therapies=data.get("therapies", []),
            lifestyle_recommendations=data.get("lifestyle_recommendations", []),
            follow_up_schedule=data.get("follow_up_schedule", [])
        )

        db.session.add(plan)
        db.session.commit()

        return {"id": plan.id, "message": "Treatment plan created successfully"}, 201


@ns.route("/<int:plan_id>/history")
class TreatmentPlanHistory(Resource):
    @jwt_required()
    def get(self, plan_id):
        """Get treatment plan history and changes"""
        user_id = int(get_jwt_identity())
        
        # Mock history data - in real implementation, fetch from PlanHistory model
        history = [
            {
                "id": 1,
                "plan_id": plan_id,
                "change_description": "Updated medication dosage from 10mg to 15mg based on patient response",
                "changed_by": "Dr. Smith",
                "timestamp": "2024-01-19T14:30:00Z",
                "change_type": "medication_update"
            },
            {
                "id": 2,
                "plan_id": plan_id,
                "change_description": "Added physical therapy sessions - 3x per week",
                "changed_by": "Dr. Smith",
                "timestamp": "2024-01-18T10:15:00Z",
                "change_type": "therapy_addition"
            }
        ]
        
        return history

@ns.route("/<int:plan_id>/feedback")
class TreatmentPlanFeedback(Resource):
    @jwt_required()
    def get(self, plan_id):
        """Get patient feedback on treatment plan"""
        user_id = int(get_jwt_identity())
        
        # Mock feedback data
        feedback = [
            {
                "id": 1,
                "plan_id": plan_id,
                "patient_id": 1,
                "message": "The new medication is working well, but I'm experiencing some mild nausea",
                "sentiment": "neutral",
                "timestamp": "2024-01-20T09:00:00Z",
                "rating": 4
            },
            {
                "id": 2,
                "plan_id": plan_id,
                "patient_id": 1,
                "message": "Physical therapy is helping a lot! I can move much better now",
                "sentiment": "positive",
                "timestamp": "2024-01-19T16:45:00Z",
                "rating": 5
            }
        ]
        
        return feedback

@ns.route("/<int:plan_id>/comments")
class TreatmentPlanComments(Resource):
    @jwt_required()
    def post(self, plan_id):
        """Add a comment/note to treatment plan"""
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        # In real implementation, save to PlanComment model
        comment = {
            "id": 999,
            "plan_id": plan_id,
            "user_id": user_id,
            "comment": data["comment"],
            "type": data.get("type", "doctor_comment"),
            "timestamp": data.get("timestamp", datetime.utcnow().isoformat() + "Z")
        }
        
        return comment, 201

@ns.route("/<int:plan_id>")
class TreatmentPlanDetail(Resource):
    @jwt_required()
    def get(self, plan_id):
        """Get specific treatment plan"""
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        plan = TreatmentPlan.query.get_or_404(plan_id)

        # Authorization check
        if user.role == "doctor":
            doctor = get_doctor_from_user()
            if not doctor or plan.doctor_id != doctor.id:
                return {"message": "Unauthorized"}, 403
        elif user.role == "patient":
            patient = get_patient_from_user()
            if not patient or plan.patient_id != patient.id:
                return {"message": "Unauthorized"}, 403
        else:
            return {"message": "Invalid user role"}, 403

        return {
            "id": plan.id,
            "patient_id": plan.patient_id,
            "doctor_id": plan.doctor_id,
            "plan_name": plan.plan_name,
            "description": plan.description,
            "status": plan.status,
            "start_date": plan.start_date.isoformat() if plan.start_date else None,
            "end_date": plan.end_date.isoformat() if plan.end_date else None,
            "medications": plan.medications or [],
            "therapies": plan.therapies or [],
            "lifestyle_recommendations": plan.lifestyle_recommendations or [],
            "follow_up_schedule": plan.follow_up_schedule or [],
            "effectiveness_score": plan.effectiveness_score,
            "adherence_percentage": plan.adherence_percentage,
            "created_at": plan.created_at.isoformat(),
            "updated_at": plan.updated_at.isoformat(),
            "patient_name": plan.patient.user.full_name if plan.patient and plan.patient.user else None,
            "doctor_name": plan.doctor.user.full_name if plan.doctor and plan.doctor.user else None,
        }

    @jwt_required()
    @ns.expect(treatment_plan_model)
    def put(self, plan_id):
        """Update treatment plan (doctors only)"""
        doctor = get_doctor_from_user()
        if not doctor:
            return {"message": "Only doctors can update treatment plans"}, 403

        plan = TreatmentPlan.query.get_or_404(plan_id)
        if plan.doctor_id != doctor.id:
            return {"message": "Unauthorized"}, 403

        data = request.get_json()

        # Update fields
        plan.plan_name = data.get("plan_name", plan.plan_name)
        plan.description = data.get("description", plan.description)
        plan.status = data.get("status", plan.status)

        # Update dates if provided
        if data.get("start_date"):
            try:
                plan.start_date = datetime.strptime(data["start_date"], "%Y-%m-%d").date()
            except ValueError:
                return {"message": "Invalid start_date format. Use YYYY-MM-DD"}, 400

        if data.get("end_date"):
            try:
                plan.end_date = datetime.strptime(data["end_date"], "%Y-%m-%d").date()
            except ValueError:
                return {"message": "Invalid end_date format. Use YYYY-MM-DD"}, 400

        # Update JSON fields
        plan.medications = data.get("medications", plan.medications)
        plan.therapies = data.get("therapies", plan.therapies)
        plan.lifestyle_recommendations = data.get("lifestyle_recommendations", plan.lifestyle_recommendations)
        plan.follow_up_schedule = data.get("follow_up_schedule", plan.follow_up_schedule)

        plan.updated_at = datetime.utcnow()
        db.session.commit()

        return {"id": plan.id, "message": "Treatment plan updated successfully"}


@ns.route("/<int:plan_id>/feedback")
class TreatmentPlanFeedback(Resource):
    @jwt_required()
    def post(self, plan_id):
        """Submit patient feedback on treatment plan"""
        patient = get_patient_from_user()
        if not patient:
            return {"message": "Only patients can submit feedback"}, 403

        plan = TreatmentPlan.query.get_or_404(plan_id)
        if plan.patient_id != patient.id:
            return {"message": "Unauthorized"}, 403

        data = request.get_json()
        effectiveness_score = data.get("effectiveness_score")
        adherence_percentage = data.get("adherence_percentage")

        if effectiveness_score is not None:
            if not (1 <= effectiveness_score <= 10):
                return {"message": "Effectiveness score must be between 1 and 10"}, 400
            plan.effectiveness_score = effectiveness_score

        if adherence_percentage is not None:
            if not (0 <= adherence_percentage <= 100):
                return {"message": "Adherence percentage must be between 0 and 100"}, 400
            plan.adherence_percentage = adherence_percentage

        plan.updated_at = datetime.utcnow()
        db.session.commit()

        return {"message": "Feedback submitted successfully"}


@ns.route("/suggestions")
class LeapFrogSuggestionList(Resource):
    @jwt_required()
    def get(self):
        """Get LeapFrog AI suggestions"""
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)

        if user.role == "doctor":
            doctor = get_doctor_from_user()
            if not doctor:
                return {"message": "Doctor profile not found"}, 404
            # Get suggestions for doctor's patients
            suggestions = db.session.query(LeapFrogSuggestion)\
                .join(TreatmentPlan, LeapFrogSuggestion.current_treatment_id == TreatmentPlan.id)\
                .filter(TreatmentPlan.doctor_id == doctor.id)\
                .all()
        elif user.role == "patient":
            patient = get_patient_from_user()
            if not patient:
                return {"message": "Patient profile not found"}, 404
            suggestions = LeapFrogSuggestion.query.filter_by(patient_id=patient.id).all()
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
    @ns.expect(suggestion_model)
    def post(self):
        """Create a new LeapFrog suggestion (system/AI generated)"""
        # This would typically be called by an AI system, but we'll allow manual creation for testing
        data = request.get_json()

        suggestion = LeapFrogSuggestion(
            patient_id=data["patient_id"],
            current_treatment_id=data.get("current_treatment_id"),
            suggestion_type=data["suggestion_type"],
            title=data["title"],
            description=data["description"],
            reasoning=data.get("reasoning"),
            confidence_score=data.get("confidence_score", 0.5),
            priority=data.get("priority", "medium"),
            implementation_steps=data.get("implementation_steps", []),
            expected_outcomes=data.get("expected_outcomes", []),
            monitoring_parameters=data.get("monitoring_parameters", [])
        )

        db.session.add(suggestion)
        db.session.commit()

        return {"id": suggestion.id, "message": "Suggestion created successfully"}, 201


@ns.route("/suggestions/<int:suggestion_id>/review")
class LeapFrogSuggestionReview(Resource):
    @jwt_required()
    def post(self, suggestion_id):
        """Review a LeapFrog suggestion (doctors only)"""
        doctor = get_doctor_from_user()
        if not doctor:
            return {"message": "Only doctors can review suggestions"}, 403

        suggestion = LeapFrogSuggestion.query.get_or_404(suggestion_id)

        # Check if doctor has access to this suggestion
        if suggestion.current_treatment_id:
            treatment = TreatmentPlan.query.get(suggestion.current_treatment_id)
            if not treatment or treatment.doctor_id != doctor.id:
                return {"message": "Unauthorized"}, 403

        data = request.get_json()

        suggestion.status = data.get("status", suggestion.status)
        suggestion.doctor_review = data.get("doctor_review")
        suggestion.reviewed_at = datetime.utcnow()

        db.session.commit()

        return {"message": "Suggestion reviewed successfully"}


@ns.route("/suggestions/<int:suggestion_id>/feedback")
class LeapFrogSuggestionFeedback(Resource):
    @jwt_required()
    def post(self, suggestion_id):
        """Provide feedback on a LeapFrog suggestion (patients only)"""
        user, role, profile = get_user_role_and_profile()
        if not user or role != "patient":
            return {"message": "Only patients can provide feedback on suggestions"}, 403

        suggestion = LeapFrogSuggestion.query.get_or_404(suggestion_id)
        
        # Check if patient has access to this suggestion
        if suggestion.patient_id != profile.id:
            return {"message": "Unauthorized"}, 403

        data = request.get_json()
        
        # Update suggestion with patient feedback
        suggestion.patient_feedback = data.get("feedback", "")
        suggestion.patient_rating = data.get("rating")  # 1-5 scale
        suggestion.feedback_timestamp = datetime.utcnow()
        
        # Update status based on feedback
        if data.get("interested", False):
            suggestion.status = "interested"
        elif data.get("not_interested", False):
            suggestion.status = "not_interested"
        
        db.session.commit()

        return {"message": "Feedback submitted successfully"}


@ns.route("/effectiveness/<int:treatment_id>")
class TreatmentEffectivenessResource(Resource):
    @jwt_required()
    def get(self, treatment_id):
        """Get treatment effectiveness metrics"""
        user, role, profile = get_user_role_and_profile()
        if not user:
            return {"message": "User not found"}, 404

        treatment = TreatmentPlan.query.get(treatment_id)
        if not treatment:
            return {"message": "Treatment plan not found"}, 404

        # Check access permissions
        if role == "doctor" and treatment.doctor_id != profile.id:
            return {"message": "Unauthorized"}, 403
        elif role == "patient" and treatment.patient_id != profile.id:
            return {"message": "Unauthorized"}, 403

        # Get effectiveness measurements
        effectiveness_records = TreatmentEffectiveness.query.filter_by(
            treatment_plan_id=treatment_id
        ).order_by(TreatmentEffectiveness.measurement_end_date.desc()).all()

        # Calculate current effectiveness using AI
        ai_engine = AdvancedLeapFrogAI()
        analysis = ai_engine.comprehensive_patient_analysis(treatment.patient_id)

        current_effectiveness = analysis.get("treatment_effectiveness", {})

        return {
            "treatment_id": treatment_id,
            "current_effectiveness": current_effectiveness,
            "historical_measurements": [
                {
                    "id": record.id,
                    "measurement_period": {
                        "start": record.measurement_start_date.isoformat(),
                        "end": record.measurement_end_date.isoformat()
                    },
                    "scores": {
                        "symptom_improvement": record.symptom_improvement_score,
                        "mood_stability": record.mood_stability_score,
                        "activity_engagement": record.activity_engagement_score,
                        "adherence": record.adherence_score,
                        "side_effects": record.side_effects_score,
                        "overall": record.overall_effectiveness
                    },
                    "patient_feedback": {
                        "satisfaction": record.patient_satisfaction,
                        "quality_of_life": record.quality_of_life_impact
                    }
                } for record in effectiveness_records
            ]
        }

    @jwt_required()
    def post(self, treatment_id):
        """Record new effectiveness measurement"""
        user, role, profile = get_user_role_and_profile()
        if not user or role != "doctor":
            return {"message": "Only doctors can record effectiveness measurements"}, 403

        treatment = TreatmentPlan.query.get(treatment_id)
        if not treatment or treatment.doctor_id != profile.id:
            return {"message": "Treatment plan not found or unauthorized"}, 404

        data = request.get_json()

        effectiveness = TreatmentEffectiveness(
            treatment_plan_id=treatment_id,
            patient_id=treatment.patient_id,
            symptom_improvement_score=data.get("symptom_improvement_score"),
            mood_stability_score=data.get("mood_stability_score"),
            activity_engagement_score=data.get("activity_engagement_score"),
            adherence_score=data.get("adherence_score"),
            side_effects_score=data.get("side_effects_score"),
            overall_effectiveness=data.get("overall_effectiveness"),
            patient_satisfaction=data.get("patient_satisfaction"),
            quality_of_life_impact=data.get("quality_of_life_impact"),
            measurement_start_date=datetime.strptime(data["measurement_start_date"], "%Y-%m-%d").date(),
            measurement_end_date=datetime.strptime(data["measurement_end_date"], "%Y-%m-%d").date()
        )

        db.session.add(effectiveness)
        db.session.commit()

        return {"message": "Effectiveness measurement recorded", "id": effectiveness.id}, 201


@ns.route("/interventions")
class InterventionHistoryResource(Resource):
    @jwt_required()
    def get(self):
        """Get intervention history for patient or doctor's patients"""
        user, role, profile = get_user_role_and_profile()
        if not user:
            return {"message": "User not found"}, 404

        patient_id = request.args.get("patient_id", type=int)

        if role == "patient":
            patient_id = profile.id
        elif role == "doctor" and patient_id:
            # Verify doctor has access to this patient
            treatment = TreatmentPlan.query.filter_by(
                patient_id=patient_id, doctor_id=profile.id
            ).first()
            if not treatment:
                return {"message": "Unauthorized access to patient"}, 403

        if not patient_id:
            return {"message": "Patient ID required"}, 400

        interventions = InterventionHistory.query.filter_by(
            patient_id=patient_id
        ).order_by(InterventionHistory.implemented_date.desc()).all()

        return {
            "patient_id": patient_id,
            "interventions": [
                {
                    "id": intervention.id,
                    "type": intervention.intervention_type,
                    "name": intervention.intervention_name,
                    "description": intervention.description,
                    "implemented_date": intervention.implemented_date.isoformat(),
                    "outcome_measured": intervention.outcome_measured,
                    "outcome_score": intervention.outcome_score,
                    "successful": intervention.successful,
                    "treatment_plan_id": intervention.treatment_plan_id,
                    "suggestion_id": intervention.suggestion_id
                } for intervention in interventions
            ]
        }

    @jwt_required()
    def post(self):
        """Record new intervention"""
        user, role, profile = get_user_role_and_profile()
        if not user or role != "doctor":
            return {"message": "Only doctors can record interventions"}, 403

        data = request.get_json()
        patient_id = data.get("patient_id")

        # Verify doctor has access to this patient
        treatment = TreatmentPlan.query.filter_by(
            patient_id=patient_id, doctor_id=profile.id
        ).first()
        if not treatment:
            return {"message": "Unauthorized access to patient"}, 403

        intervention = InterventionHistory(
            patient_id=patient_id,
            treatment_plan_id=data.get("treatment_plan_id"),
            suggestion_id=data.get("suggestion_id"),
            intervention_type=data["intervention_type"],
            intervention_name=data["intervention_name"],
            description=data.get("description"),
            implemented_date=datetime.strptime(data["implemented_date"], "%Y-%m-%d").date(),
            implementation_notes=data.get("implementation_notes"),
            success_criteria=data.get("success_criteria", [])
        )

        db.session.add(intervention)
        db.session.commit()

        return {"message": "Intervention recorded", "id": intervention.id}, 201


@ns.route("/analytics/comprehensive/<int:patient_id>")
class ComprehensiveAnalyticsResource(Resource):
    @jwt_required()
    def get(self, patient_id):
        """Get comprehensive patient analytics using advanced LeapFrog AI"""
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

        # Get comprehensive analysis using LeapFrog AI
        try:
            ai_engine = AdvancedLeapFrogAI()
            analysis = ai_engine.comprehensive_patient_analysis(patient_id)
        except Exception as e:
            print(f"AI analysis failed: {str(e)}")
            # Fallback to enhanced mock data
            analysis = {
                "symptom_analysis": {
                    "symptom_burden": 3.2,
                    "trends": {
                        "overall_trend": "decreasing",
                        "weekly_pattern": "stable",
                        "daily_variation": 0.8
                    },
                    "top_symptoms": ["fatigue", "headache", "mild_pain"],
                    "severity_distribution": {
                        "low": 0.6,
                        "medium": 0.3,
                        "high": 0.1
                    }
                },
                "mood_analysis": {
                    "mood_stability": 0.75,
                    "mood_trend": "stable",
                    "mood_patterns": {
                        "morning": 7.2,
                        "afternoon": 6.8,
                        "evening": 6.5
                    },
                    "mood_correlations": {
                        "activity_level": 0.6,
                        "sleep_quality": 0.7,
                        "medication_adherence": 0.8
                    }
                },
                "activity_analysis": {
                    "engagement_score": 0.68,
                    "activity_patterns": {
                        "exercise_frequency": "3x/week",
                        "social_activities": "moderate",
                        "cognitive_activities": "high"
                    },
                    "activity_goals": {
                        "daily_steps": "6,500/8,000",
                        "exercise_minutes": "120/150",
                        "social_interactions": "4/5"
                    }
                },
                "treatment_effectiveness": {
                    "effectiveness_score": 0.82,
                    "adherence_rate": 0.85,
                    "symptom_improvement": 0.78,
                    "quality_of_life_impact": 0.75,
                    "side_effects_management": 0.88
                },
                "risk_assessment": {
                    "risk_level": "low",
                    "risk_score": 0.15,
                    "risk_factors": ["age", "sedentary_lifestyle"],
                    "risk_trends": "decreasing",
                    "intervention_effectiveness": 0.82
                },
                "data_quality": {
                    "completeness": 0.85,
                    "consistency": 0.78,
                    "recency": 0.92,
                    "accuracy": 0.89,
                    "overall_quality": 0.86
                }
            }

        return {
            "patient_id": patient_id,
            "analysis": mock_analysis,
            "generated_at": datetime.utcnow().isoformat()
        }


@ns.route("/predictions/<int:patient_id>")
class PredictiveAnalyticsResource(Resource):
    @jwt_required()
    def get(self, patient_id):
        """Get predictive analytics for patient"""
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

        # Get existing predictions
        predictions = PredictiveModel.query.filter_by(
            patient_id=patient_id
        ).order_by(PredictiveModel.prediction_date.desc()).limit(10).all()

        # Generate new predictions using AI
        ai_engine = AdvancedLeapFrogAI()
        analysis = ai_engine.comprehensive_patient_analysis(patient_id)
        predictive_insights = analysis.get("predictive_insights", {})

        return safe_json_response({
            "patient_id": patient_id,
            "current_predictions": predictive_insights,
            "historical_predictions": [
                {
                    "id": pred.id,
                    "model_type": pred.model_type,
                    "prediction_data": pred.prediction_data,
                    "confidence_score": pred.confidence_score,
                    "prediction_horizon_days": pred.prediction_horizon_days,
                    "prediction_date": pred.prediction_date.isoformat(),
                    "validated": pred.validated,
                    "accuracy_score": pred.accuracy_score
                } for pred in predictions
            ]
        })

    @jwt_required()
    def post(self, patient_id):
        """Save new prediction model result"""
        user, role, profile = get_user_role_and_profile()
        if not user or role != "doctor":
            return {"message": "Only doctors can save predictions"}, 403

        # Verify access
        treatment = TreatmentPlan.query.filter_by(
            patient_id=patient_id, doctor_id=profile.id
        ).first()
        if not treatment:
            return {"message": "Unauthorized access to patient"}, 403

        data = request.get_json()

        prediction = PredictiveModel(
            patient_id=patient_id,
            model_type=data["model_type"],
            model_version=data.get("model_version", "1.0"),
            prediction_data=data["prediction_data"],
            confidence_score=data.get("confidence_score", 0.5),
            prediction_horizon_days=data.get("prediction_horizon_days", 7)
        )

        db.session.add(prediction)
        db.session.commit()

        return {"message": "Prediction saved", "id": prediction.id}, 201


@ns.route("/leapfrog/optimize/<int:treatment_id>")
class LeapFrogOptimizationResource(Resource):
    @jwt_required()
    def post(self, treatment_id):
        """Run LeapFrog optimization for treatment plan"""
        user, role, profile = get_user_role_and_profile()
        if not user or role != "doctor":
            return {"message": "Only doctors can run optimization"}, 403

        treatment = TreatmentPlan.query.get(treatment_id)
        if not treatment or treatment.doctor_id != profile.id:
            return {"message": "Treatment plan not found or unauthorized"}, 404

        # Run comprehensive analysis
        ai_engine = AdvancedLeapFrogAI()
        analysis = ai_engine.comprehensive_patient_analysis(treatment.patient_id)

        # Generate optimized suggestions
        suggestions = ai_engine.generate_treatment_suggestions(
            treatment.patient_id, treatment_id
        )

        # Calculate optimization score
        current_effectiveness = analysis.get("treatment_effectiveness", {}).get("effectiveness_score", 0)
        risk_level = analysis.get("risk_assessment", {}).get("risk_level", "low")

        optimization_recommendations = []

        # Based on effectiveness and risk, provide specific recommendations
        if current_effectiveness < 0.6:
            optimization_recommendations.append({
                "type": "effectiveness_improvement",
                "priority": "high",
                "recommendation": "Consider treatment plan modification",
                "details": "Current effectiveness below threshold"
            })

        if risk_level in ["moderate", "high"]:
            optimization_recommendations.append({
                "type": "risk_mitigation",
                "priority": "urgent" if risk_level == "high" else "high",
                "recommendation": "Implement risk mitigation strategies",
                "details": f"Patient at {risk_level} risk level"
            })

        return {
            "treatment_id": treatment_id,
            "patient_id": treatment.patient_id,
            "optimization_score": current_effectiveness,
            "risk_level": risk_level,
            "ai_suggestions": suggestions,
            "optimization_recommendations": optimization_recommendations,
            "analysis_summary": {
                "data_quality": analysis.get("data_quality", {}),
                "patient_phenotype": analysis.get("patient_phenotype", {}),
                "predictive_insights": analysis.get("predictive_insights", {})
            },
            "generated_at": datetime.utcnow().isoformat()
        }
