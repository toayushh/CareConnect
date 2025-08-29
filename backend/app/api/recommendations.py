from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta

from ..extensions import db
from ..models.user import User
from ..models.patient import PatientProfile
from ..models.recommendations import (
    HealthRecommendation, HealthInsight, RiskAssessment,
    PersonalizedMetric, HealthPrediction, InterventionTracking
)
from ..ai.recommendation_engine import recommendation_engine

ns = Namespace("recommendations", description="AI-powered health recommendations")

# API Models
recommendation_model = ns.model("HealthRecommendation", {
    "id": fields.Integer,
    "category": fields.String,
    "title": fields.String,
    "description": fields.String,
    "priority": fields.String,
    "confidence_score": fields.Float,
    "reasoning": fields.String,
    "data_sources": fields.List(fields.String),
    "status": fields.String,
    "target_date": fields.String,
    "created_at": fields.String
})

insight_model = ns.model("HealthInsight", {
    "id": fields.Integer,
    "insight_type": fields.String,
    "title": fields.String,
    "description": fields.String,
    "severity": fields.String,
    "metrics_analyzed": fields.List(fields.String),
    "correlation_strength": fields.Float,
    "trend_direction": fields.String,
    "time_period": fields.String,
    "created_at": fields.String
})

risk_assessment_model = ns.model("RiskAssessment", {
    "id": fields.Integer,
    "risk_category": fields.String,
    "risk_level": fields.String,
    "risk_score": fields.Float,
    "risk_factors": fields.List(fields.String),
    "protective_factors": fields.List(fields.String),
    "description": fields.String,
    "recommendations": fields.List(fields.String),
    "next_assessment_date": fields.String,
    "created_at": fields.String
})

personalized_metric_model = ns.model("PersonalizedMetric", {
    "id": fields.Integer,
    "metric_name": fields.String,
    "current_value": fields.Float,
    "target_value": fields.Float,
    "optimal_range_min": fields.Float,
    "optimal_range_max": fields.Float,
    "unit": fields.String,
    "baseline_value": fields.Float,
    "improvement_rate": fields.Float,
    "difficulty_level": fields.String,
    "target_date": fields.String,
    "status": fields.String,
    "progress_percentage": fields.Float
})

prediction_model = ns.model("HealthPrediction", {
    "id": fields.Integer,
    "prediction_type": fields.String,
    "outcome": fields.String,
    "probability": fields.Float,
    "confidence_interval": fields.List(fields.Float),
    "prediction_horizon": fields.String,
    "predicted_date": fields.String,
    "explanation": fields.String,
    "features_used": fields.List(fields.String),
    "created_at": fields.String
})


def get_patient_from_user():
    """Get patient profile from current user"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != "patient":
        return None
    return PatientProfile.query.filter_by(user_id=user_id).first()


@ns.route("/generate")
class GenerateRecommendations(Resource):
    @jwt_required()
    def post(self):
        """
        Generate comprehensive AI recommendations for the current patient
        """
        patient = get_patient_from_user()
        if not patient:
            return {"message": "Patient profile not found"}, 404
        
        try:
            # Generate recommendations using AI engine
            result = recommendation_engine.generate_comprehensive_recommendations(patient.id)
            
            return {
                "message": "Recommendations generated successfully",
                "summary": {
                    "recommendations_count": len(result["recommendations"]),
                    "insights_count": len(result["insights"]),
                    "risk_assessments_count": len(result["risk_assessments"]),
                    "predictions_count": len(result["predictions"]),
                    "personalized_metrics_count": len(result["personalized_metrics"])
                },
                "generated_at": result["generated_at"]
            }, 201
            
        except Exception as e:
            return {"message": f"Failed to generate recommendations: {str(e)}"}, 500


@ns.route("/recommendations")
class RecommendationList(Resource):
    @jwt_required()
    @ns.marshal_list_with(recommendation_model)
    def get(self):
        """
        Get health recommendations for the current patient
        """
        patient = get_patient_from_user()
        if not patient:
            return {"message": "Patient profile not found"}, 404
        
        status = request.args.get("status", "pending")
        priority = request.args.get("priority")
        category = request.args.get("category")
        limit = min(int(request.args.get("limit", 20)), 100)
        
        query = HealthRecommendation.query.filter_by(patient_id=patient.id)
        
        if status != "all":
            query = query.filter_by(status=status)
        if priority:
            query = query.filter_by(priority=priority)
        if category:
            query = query.filter_by(category=category)
        
        recommendations = query.order_by(
            HealthRecommendation.priority.desc(),
            HealthRecommendation.created_at.desc()
        ).limit(limit).all()
        
        return [{
            "id": r.id,
            "category": r.category,
            "title": r.title,
            "description": r.description,
            "priority": r.priority,
            "confidence_score": r.confidence_score,
            "reasoning": r.reasoning,
            "data_sources": r.data_sources,
            "status": r.status,
            "target_date": r.target_date.isoformat() if r.target_date else None,
            "created_at": r.created_at.isoformat()
        } for r in recommendations]


@ns.route("/recommendations/<int:recommendation_id>/status")
class RecommendationStatus(Resource):
    @jwt_required()
    def put(self, recommendation_id):
        """
        Update recommendation status (accept, reject, complete)
        """
        patient = get_patient_from_user()
        if not patient:
            return {"message": "Patient profile not found"}, 404
        
        data = request.get_json()
        new_status = data.get("status")
        notes = data.get("notes", "")
        
        if new_status not in ["accepted", "rejected", "completed"]:
            return {"message": "Invalid status. Must be: accepted, rejected, or completed"}, 400
        
        recommendation = HealthRecommendation.query.filter_by(
            id=recommendation_id,
            patient_id=patient.id
        ).first()
        
        if not recommendation:
            return {"message": "Recommendation not found"}, 404
        
        recommendation.status = new_status
        recommendation.implementation_notes = notes
        recommendation.updated_at = datetime.utcnow()
        
        # If completed, record as intervention
        if new_status == "completed":
            intervention = InterventionTracking(
                patient_id=patient.id,
                recommendation_id=recommendation.id,
                intervention_type=recommendation.category,
                intervention_name=recommendation.title,
                description=recommendation.description,
                start_date=recommendation.created_at.date(),
                end_date=datetime.utcnow().date(),
                status="completed",
                completion_reason="Patient completed recommendation"
            )
            db.session.add(intervention)
        
        db.session.commit()
        
        return {"message": f"Recommendation status updated to {new_status}"}, 200


@ns.route("/insights")
class InsightList(Resource):
    @jwt_required()
    @ns.marshal_list_with(insight_model)
    def get(self):
        """
        Get health insights for the current patient
        """
        patient = get_patient_from_user()
        if not patient:
            return {"message": "Patient profile not found"}, 404
        
        insight_type = request.args.get("type")
        severity = request.args.get("severity")
        limit = min(int(request.args.get("limit", 20)), 100)
        
        query = HealthInsight.query.filter_by(patient_id=patient.id)
        
        # Only show non-expired insights
        query = query.filter(
            db.or_(
                HealthInsight.expires_at.is_(None),
                HealthInsight.expires_at > datetime.utcnow()
            )
        )
        
        if insight_type:
            query = query.filter_by(insight_type=insight_type)
        if severity:
            query = query.filter_by(severity=severity)
        
        insights = query.order_by(
            HealthInsight.created_at.desc()
        ).limit(limit).all()
        
        return [{
            "id": i.id,
            "insight_type": i.insight_type,
            "title": i.title,
            "description": i.description,
            "severity": i.severity,
            "metrics_analyzed": i.metrics_analyzed,
            "correlation_strength": i.correlation_strength,
            "trend_direction": i.trend_direction,
            "time_period": i.time_period,
            "created_at": i.created_at.isoformat()
        } for i in insights]


@ns.route("/risk-assessments")
class RiskAssessmentList(Resource):
    @jwt_required()
    @ns.marshal_list_with(risk_assessment_model)
    def get(self):
        """
        Get risk assessments for the current patient
        """
        patient = get_patient_from_user()
        if not patient:
            return {"message": "Patient profile not found"}, 404
        
        category = request.args.get("category")
        risk_level = request.args.get("risk_level")
        limit = min(int(request.args.get("limit", 10)), 50)
        
        query = RiskAssessment.query.filter_by(patient_id=patient.id)
        
        if category:
            query = query.filter_by(risk_category=category)
        if risk_level:
            query = query.filter_by(risk_level=risk_level)
        
        assessments = query.order_by(
            RiskAssessment.risk_score.desc(),
            RiskAssessment.created_at.desc()
        ).limit(limit).all()
        
        return [{
            "id": r.id,
            "risk_category": r.risk_category,
            "risk_level": r.risk_level,
            "risk_score": r.risk_score,
            "risk_factors": r.risk_factors,
            "protective_factors": r.protective_factors,
            "description": r.description,
            "recommendations": r.recommendations,
            "next_assessment_date": r.next_assessment_date.isoformat() if r.next_assessment_date else None,
            "created_at": r.created_at.isoformat()
        } for r in assessments]


@ns.route("/metrics")
class PersonalizedMetricList(Resource):
    @jwt_required()
    @ns.marshal_list_with(personalized_metric_model)
    def get(self):
        """
        Get personalized health metrics for the current patient
        """
        patient = get_patient_from_user()
        if not patient:
            return {"message": "Patient profile not found"}, 404
        
        status = request.args.get("status", "active")
        metric_name = request.args.get("metric_name")
        
        query = PersonalizedMetric.query.filter_by(patient_id=patient.id)
        
        if status != "all":
            query = query.filter_by(status=status)
        if metric_name:
            query = query.filter_by(metric_name=metric_name)
        
        metrics = query.order_by(PersonalizedMetric.created_at.desc()).all()
        
        result = []
        for m in metrics:
            # Calculate progress percentage
            if m.target_value and m.baseline_value is not None:
                if m.target_value > m.baseline_value:
                    progress = ((m.current_value - m.baseline_value) / 
                              (m.target_value - m.baseline_value)) * 100
                else:
                    progress = ((m.baseline_value - m.current_value) / 
                              (m.baseline_value - m.target_value)) * 100
                progress = max(0, min(100, progress))  # Clamp between 0-100
            else:
                progress = 0
            
            result.append({
                "id": m.id,
                "metric_name": m.metric_name,
                "current_value": m.current_value,
                "target_value": m.target_value,
                "optimal_range_min": m.optimal_range_min,
                "optimal_range_max": m.optimal_range_max,
                "unit": m.unit,
                "baseline_value": m.baseline_value,
                "improvement_rate": m.improvement_rate,
                "difficulty_level": m.difficulty_level,
                "target_date": m.target_date.isoformat() if m.target_date else None,
                "status": m.status,
                "progress_percentage": round(progress, 1)
            })
        
        return result


@ns.route("/predictions")
class PredictionList(Resource):
    @jwt_required()
    @ns.marshal_list_with(prediction_model)
    def get(self):
        """
        Get health predictions for the current patient
        """
        patient = get_patient_from_user()
        if not patient:
            return {"message": "Patient profile not found"}, 404
        
        prediction_type = request.args.get("type")
        limit = min(int(request.args.get("limit", 10)), 50)
        
        query = HealthPrediction.query.filter_by(patient_id=patient.id)
        
        if prediction_type:
            query = query.filter_by(prediction_type=prediction_type)
        
        predictions = query.order_by(
            HealthPrediction.probability.desc(),
            HealthPrediction.created_at.desc()
        ).limit(limit).all()
        
        return [{
            "id": p.id,
            "prediction_type": p.prediction_type,
            "outcome": p.outcome,
            "probability": p.probability,
            "confidence_interval": p.confidence_interval,
            "prediction_horizon": p.prediction_horizon,
            "predicted_date": p.predicted_date.isoformat() if p.predicted_date else None,
            "explanation": p.explanation,
            "features_used": p.features_used,
            "created_at": p.created_at.isoformat()
        } for p in predictions]


@ns.route("/dashboard")
class RecommendationDashboard(Resource):
    @jwt_required()
    def get(self):
        """
        Get comprehensive recommendation dashboard for the current patient
        """
        patient = get_patient_from_user()
        if not patient:
            return {"message": "Patient profile not found"}, 404
        
        # Get recent recommendations
        recent_recommendations = HealthRecommendation.query.filter_by(
            patient_id=patient.id,
            status="pending"
        ).order_by(
            HealthRecommendation.priority.desc(),
            HealthRecommendation.created_at.desc()
        ).limit(5).all()
        
        # Get active insights
        active_insights = HealthInsight.query.filter_by(
            patient_id=patient.id
        ).filter(
            db.or_(
                HealthInsight.expires_at.is_(None),
                HealthInsight.expires_at > datetime.utcnow()
            )
        ).order_by(HealthInsight.created_at.desc()).limit(3).all()
        
        # Get current risk assessments
        current_risks = RiskAssessment.query.filter_by(
            patient_id=patient.id
        ).order_by(
            RiskAssessment.risk_score.desc()
        ).limit(3).all()
        
        # Get active metrics
        active_metrics = PersonalizedMetric.query.filter_by(
            patient_id=patient.id,
            status="active"
        ).limit(5).all()
        
        # Get recent predictions
        recent_predictions = HealthPrediction.query.filter_by(
            patient_id=patient.id
        ).order_by(HealthPrediction.created_at.desc()).limit(3).all()
        
        # Calculate overall health score
        health_score = self._calculate_health_score(
            recent_recommendations, current_risks, active_metrics
        )
        
        return {
            "health_score": health_score,
            "recommendations": [{
                "id": r.id,
                "title": r.title,
                "category": r.category,
                "priority": r.priority,
                "confidence_score": r.confidence_score
            } for r in recent_recommendations],
            "insights": [{
                "id": i.id,
                "title": i.title,
                "insight_type": i.insight_type,
                "severity": i.severity
            } for i in active_insights],
            "risk_assessments": [{
                "id": r.id,
                "risk_category": r.risk_category,
                "risk_level": r.risk_level,
                "risk_score": r.risk_score
            } for r in current_risks],
            "metrics": [{
                "id": m.id,
                "metric_name": m.metric_name,
                "current_value": m.current_value,
                "target_value": m.target_value,
                "unit": m.unit
            } for m in active_metrics],
            "predictions": [{
                "id": p.id,
                "prediction_type": p.prediction_type,
                "outcome": p.outcome,
                "probability": p.probability
            } for p in recent_predictions]
        }
    
    def _calculate_health_score(self, recommendations, risks, metrics):
        """Calculate overall health score (0-100)"""
        base_score = 85  # Start with good health assumption
        
        # Deduct for high-priority recommendations
        high_priority_count = len([r for r in recommendations if r.priority == "high"])
        urgent_count = len([r for r in recommendations if r.priority == "urgent"])
        base_score -= (high_priority_count * 5) + (urgent_count * 10)
        
        # Deduct for high risks
        high_risk_count = len([r for r in risks if r.risk_level in ["high", "very_high"]])
        base_score -= high_risk_count * 10
        
        # Add for achieved metrics
        if metrics:
            achieved_metrics = 0
            for m in metrics:
                if (m.current_value and m.target_value and 
                    m.optimal_range_min and m.optimal_range_max):
                    if m.optimal_range_min <= m.current_value <= m.optimal_range_max:
                        achieved_metrics += 1
            
            achievement_bonus = (achieved_metrics / len(metrics)) * 15
            base_score += achievement_bonus
        
        return max(0, min(100, round(base_score)))


@ns.route("/interventions")
class InterventionList(Resource):
    @jwt_required()
    def get(self):
        """
        Get intervention tracking data for the current patient
        """
        patient = get_patient_from_user()
        if not patient:
            return {"message": "Patient profile not found"}, 404
        
        status = request.args.get("status", "active")
        limit = min(int(request.args.get("limit", 20)), 100)
        
        query = InterventionTracking.query.filter_by(patient_id=patient.id)
        
        if status != "all":
            query = query.filter_by(status=status)
        
        interventions = query.order_by(
            InterventionTracking.created_at.desc()
        ).limit(limit).all()
        
        return [{
            "id": i.id,
            "intervention_type": i.intervention_type,
            "intervention_name": i.intervention_name,
            "description": i.description,
            "start_date": i.start_date.isoformat() if i.start_date else None,
            "end_date": i.end_date.isoformat() if i.end_date else None,
            "duration_weeks": i.duration_weeks,
            "adherence_rate": i.adherence_rate,
            "effectiveness_score": i.effectiveness_score,
            "status": i.status,
            "completion_reason": i.completion_reason,
            "baseline_metrics": i.baseline_metrics,
            "current_metrics": i.current_metrics,
            "target_metrics": i.target_metrics
        } for i in interventions]
