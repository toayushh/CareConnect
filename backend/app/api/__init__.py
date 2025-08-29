from flask import Blueprint
from flask_restx import Api
from flask_jwt_extended.exceptions import JWTExtendedException, NoAuthorizationError, InvalidHeaderError, JWTDecodeError

from .auth import ns as auth_ns
from .users import ns as users_ns
from .doctors import ns as doctors_ns
from .appointments import ns as appointments_ns
from .partners import ns as partners_ns
from .consents import ns as consents_ns
from .feedback import ns as feedback_ns
from .workshops import ns as workshops_ns
from .progress import ns as progress_ns
from .treatment_plans import ns as treatment_plans_ns
from .ai import ns as ai_ns
from .recommendations import ns as recommendations_ns
from .medical_records import ns as medical_records_ns
from .health_analytics import ns as health_analytics_ns
from .chatbot import ns as chatbot_ns
from .messages import ns as messages_ns
from .patient_photos import ns as patient_photos_ns
from .patient_progress import ns as patient_progress_ns
from .data_quality import ns as data_quality_ns

api_bp = Blueprint("api", __name__)
api = Api(api_bp, title="LeapFrog API", version="1.0", doc="/docs")

# Add comprehensive JWT error handling
@api.errorhandler(NoAuthorizationError)
def handle_no_authorization(e):
    return {"message": "Missing Authorization Header"}, 401

@api.errorhandler(JWTDecodeError)
def handle_jwt_decode_error(e):
    return {"message": "Invalid token format"}, 401

@api.errorhandler(InvalidHeaderError)
def handle_invalid_header(e):
    return {"message": "Invalid Authorization Header"}, 401

@api.errorhandler(JWTExtendedException)
def handle_jwt_exceptions(e):
    return {"message": str(e)}, 401

# Add simple health check endpoint
@api_bp.route("/health")
def api_health():
    """API health check endpoint"""
    return {"status": "healthy", "service": "LeapFrog API", "timestamp": "2025-08-28T20:00:00Z"}

api.add_namespace(auth_ns, path="/auth")
api.add_namespace(users_ns, path="/users")
api.add_namespace(doctors_ns, path="/doctors")
api.add_namespace(appointments_ns, path="/appointments")
api.add_namespace(partners_ns, path="/partners")
api.add_namespace(consents_ns, path="/consents")
api.add_namespace(feedback_ns, path="/feedback")
api.add_namespace(workshops_ns, path="/workshops")
api.add_namespace(progress_ns, path="/progress")
api.add_namespace(treatment_plans_ns, path="/treatment-plans")
api.add_namespace(ai_ns, path="/ai")
api.add_namespace(recommendations_ns, path="/recommendations")
api.add_namespace(medical_records_ns, path="/medical-records")
api.add_namespace(health_analytics_ns, path="/health-analytics")
api.add_namespace(chatbot_ns, path="/chatbot")
api.add_namespace(messages_ns, path="/messages")
api.add_namespace(patient_photos_ns, path="/patient-photos")
api.add_namespace(patient_progress_ns, path="/patient-progress")
api.add_namespace(data_quality_ns, path="/data-quality")
