from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request, exceptions as jwt_exceptions

from ..extensions import db
from ..models.feedback import Feedback


ns = Namespace("feedback", description="Feedback collection")

feedback_model = ns.model(
    "Feedback",
    {
        "source": fields.String(enum=["web", "mobile", "kiosk", "api"], default="web"),
        "category": fields.String(enum=["general", "ux", "bug", "compliment", "suggestion"], default="general"),
        "message": fields.String(required=True),
        "rating": fields.Integer(min=1, max=5),
        "metadata": fields.Raw,
    },
)


@ns.route("")
class FeedbackList(Resource):
    def get(self):
        items = Feedback.query.order_by(Feedback.created_at.desc()).limit(100).all()
        return [
            {
                "id": f.id,
                "user_id": f.user_id,
                "source": f.source,
                "category": f.category,
                "message": f.message,
                "rating": f.rating,
                "metadata": f.extra,
                "created_at": f.created_at.isoformat(),
            }
            for f in items
        ]

    @ns.expect(feedback_model, validate=True)
    def post(self):
        data = request.get_json()
        user_id = None
        try:
            verify_jwt_in_request(optional=True)
            user_id = int(get_jwt_identity())
        except jwt_exceptions.NoAuthorizationError:
            user_id = None
        if "metadata" in data:
            data["extra"] = data.pop("metadata")
        entry = Feedback(user_id=user_id, **data)
        db.session.add(entry)
        db.session.commit()
        return {"id": entry.id}, 201


@ns.route("/submit")
class SubmitFeedback(Resource):
    @ns.expect(feedback_model, validate=True)
    def post(self):
        """
        Submit doctor feedback on AI prediction
        """
        try:
            data = request.get_json()
            user_id = None
            try:
                verify_jwt_in_request(optional=True)
                user_id = int(get_jwt_identity())
            except jwt_exceptions.NoAuthorizationError:
                user_id = None
            
            if "metadata" in data:
                data["extra"] = data.pop("metadata")
            
            entry = Feedback(user_id=user_id, **data)
            db.session.add(entry)
            db.session.commit()
            
            return {
                "id": entry.id,
                "message": "Feedback submitted successfully"
            }, 201
            
        except Exception as e:
            return {"error": f"Failed to submit feedback: {str(e)}"}, 500


@ns.route("/stats")
class FeedbackStats(Resource):
    def get(self):
        """
        Get feedback statistics
        """
        try:
            # Mock data - in real implementation, you'd query the feedback table
            return {
                "total_feedback": 1250,
                "positive_feedback": 980,
                "negative_feedback": 270,
                "satisfaction_rate": 78.4,
                "recent_submissions": 45,
                "by_category": {
                    "general": 320,
                    "ux": 280,
                    "bug": 150,
                    "compliment": 400,
                    "suggestion": 100
                }
            }, 200
        except Exception as e:
            return {"error": f"Failed to get feedback stats: {str(e)}"}, 500


@ns.route("/pending")
class PendingReviews(Resource):
    def get(self):
        """
        Get pending feedback reviews
        """
        try:
            # Mock data - in real implementation, you'd query pending reviews
            return {
                "pending_reviews": 23,
                "urgent_reviews": 5,
                "reviews": [
                    {
                        "id": 1,
                        "patient_name": "John Doe",
                        "ai_prediction": "Hypertension risk",
                        "submitted_date": "2024-01-20T10:30:00Z",
                        "priority": "high"
                    },
                    {
                        "id": 2,
                        "patient_name": "Sarah Johnson",
                        "ai_prediction": "Diabetes management",
                        "submitted_date": "2024-01-19T14:15:00Z",
                        "priority": "medium"
                    }
                ]
            }, 200
        except Exception as e:
            return {"error": f"Failed to get pending reviews: {str(e)}"}, 500


