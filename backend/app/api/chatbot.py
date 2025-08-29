from datetime import datetime
from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..extensions import db
from ..models.user import User
from ..models.patient import PatientProfile
from ..models.medical_records import (
    Allergy, Medication, MedicalCondition, VitalSign, HealthMetric
)
from ..services.gemini_service import GeminiChatbotService

ns = Namespace("chatbot", description="AI Chatbot operations")

# API Models
chat_message_model = ns.model("ChatMessage", {
    "message": fields.String(required=True, description="User's message to the chatbot"),
    "include_health_context": fields.Boolean(default=True, description="Include patient health data for context")
})

chat_response_model = ns.model("ChatResponse", {
    "response": fields.String(description="Chatbot's response"),
    "status": fields.String(description="Response status"),
    "timestamp": fields.String(description="Response timestamp"),
    "source": fields.String(description="Response source (gemini-pro or fallback)")
})

health_tips_model = ns.model("HealthTips", {
    "category": fields.String(description="Category of health tips"),
})

# Initialize chatbot service
chatbot_service = GeminiChatbotService()


def get_user_from_jwt():
    """Helper to get user from JWT"""
    user_id = int(get_jwt_identity())
    return User.query.get(user_id)


def get_patient_health_data(patient_id: int):
    """Get comprehensive patient health data for context"""
    try:
        # Get patient profile
        patient = PatientProfile.query.get(patient_id)
        if not patient:
            return None

        # Get latest vital signs
        latest_vital = VitalSign.query.filter_by(patient_id=patient_id)\
            .order_by(VitalSign.measurement_date.desc()).first()

        # Get active medications
        active_medications = Medication.query.filter_by(
            patient_id=patient_id, status="Active"
        ).all()

        # Get medical conditions
        conditions = MedicalCondition.query.filter_by(patient_id=patient_id).all()

        # Get latest health metrics
        latest_health_metric = HealthMetric.query.filter_by(patient_id=patient_id)\
            .order_by(HealthMetric.metric_date.desc()).first()

        # Get allergies
        allergies = Allergy.query.filter_by(patient_id=patient_id, is_active=True).all()

        # Build context data
        health_data = {
            "patient_id": patient_id,
            "age": getattr(patient, 'age', None),
            "latest_vitals": None,
            "medications": [],
            "conditions": [],
            "allergies": [],
            "health_scores": None
        }

        # Add vital signs
        if latest_vital:
            health_data["latest_vitals"] = {
                "blood_pressure": f"{latest_vital.systolic_bp}/{latest_vital.diastolic_bp}" 
                    if latest_vital.systolic_bp and latest_vital.diastolic_bp else None,
                "heart_rate": f"{latest_vital.heart_rate} bpm" if latest_vital.heart_rate else None,
                "weight": f"{latest_vital.weight} lbs" if latest_vital.weight else None,
                "temperature": f"{latest_vital.temperature}°F" if latest_vital.temperature else None,
                "measurement_date": latest_vital.measurement_date.isoformat() if latest_vital.measurement_date else None
            }

        # Add medications
        health_data["medications"] = [{
            "name": med.name,
            "dosage": med.dosage,
            "frequency": med.frequency,
            "status": med.status
        } for med in active_medications]

        # Add conditions
        health_data["conditions"] = [{
            "name": condition.name,
            "status": condition.status,
            "severity": condition.severity
        } for condition in conditions]

        # Add allergies
        health_data["allergies"] = [{
            "name": allergy.name,
            "severity": allergy.severity,
            "reaction": allergy.reaction
        } for allergy in allergies]

        # Add health scores
        if latest_health_metric:
            health_data["health_scores"] = {
                "overall_health_score": latest_health_metric.overall_health_score,
                "physical_health_score": latest_health_metric.physical_health_score,
                "mental_health_score": latest_health_metric.mental_health_score,
                "lifestyle_score": latest_health_metric.lifestyle_score
            }

        return health_data

    except Exception as e:
        print(f"Error getting patient health data: {str(e)}")
        return None


@ns.route("/chat")
class ChatbotChat(Resource):
    @jwt_required()
    @ns.expect(chat_message_model, validate=True)
    @ns.marshal_with(chat_response_model)
    def post(self):
        """Send message to AI chatbot and get response"""
        user = get_user_from_jwt()
        if not user:
            return {"message": "User not found"}, 404

        data = request.get_json()
        message = data.get("message", "").strip()
        include_health_context = data.get("include_health_context", True)

        if not message:
            return {"message": "Message cannot be empty"}, 400

        # Get patient health data for context (only for patients)
        patient_data = None
        if user.role == "patient" and include_health_context:
            patient_profile = PatientProfile.query.filter_by(user_id=user.id).first()
            if patient_profile:
                patient_data = get_patient_health_data(patient_profile.id)

        # TODO: Store conversation history in database for better context
        conversation_history = []

        try:
            # Get response from Gemini service (synchronous fallback)
            # Since Flask is synchronous, we'll use the fallback responses
            response_data = chatbot_service._get_fallback_response(message)

            # TODO: Save chat interaction to database for future reference
            
            return response_data, 200

        except Exception as e:
            print(f"Chatbot error: {str(e)}")
            return {
                "response": "I'm experiencing technical difficulties. Please try again later or contact support if the issue persists.",
                "status": "error",
                "timestamp": datetime.utcnow().isoformat(),
                "source": "error_handler"
            }, 500


@ns.route("/health-tips")
class HealthTips(Resource):
    @jwt_required()
    def get(self):
        """Get health tips by category"""
        category = request.args.get('category', 'general')
        
        valid_categories = ['general', 'heart', 'diabetes', 'mental']
        if category not in valid_categories:
            category = 'general'
        
        tips_data = chatbot_service.get_health_tips(category)
        return tips_data, 200


@ns.route("/health-tips/<string:category>")
class HealthTipsByCategory(Resource):
    @jwt_required()
    def get(self, category):
        """Get health tips for specific category"""
        tips_data = chatbot_service.get_health_tips(category)
        return tips_data, 200


@ns.route("/quick-help")
class QuickHelp(Resource):
    @jwt_required()
    def get(self):
        """Get quick help and common questions"""
        user = get_user_from_jwt()
        if not user:
            return {"message": "User not found"}, 404

        common_questions = {
            "patient": [
                {
                    "question": "How do I book an appointment?",
                    "answer": "Go to 'Find Doctors' in your dashboard, search for a doctor, and click 'Book Appointment' on their profile."
                },
                {
                    "question": "Where can I see my lab results?",
                    "answer": "Your lab results are available in the 'Medical Records' section under the 'Lab Results' tab."
                },
                {
                    "question": "How do I track my symptoms?",
                    "answer": "Use the 'Progress Tracking' section to log your daily symptoms, mood, and activities."
                },
                {
                    "question": "Can I see my health score?",
                    "answer": "Yes! Your personalized health score is displayed on the main Health Dashboard with detailed breakdowns."
                },
                {
                    "question": "How do I manage my medications?",
                    "answer": "View and manage your medications in the 'Medical Records' section under 'Medications'."
                }
            ],
            "doctor": [
                {
                    "question": "How do I view my patient appointments?",
                    "answer": "Your upcoming and past appointments are displayed in your doctor dashboard."
                },
                {
                    "question": "How can I access patient medical records?",
                    "answer": "Patient records are accessible when you have scheduled appointments with them."
                },
                {
                    "question": "Can I prescribe medications through the platform?",
                    "answer": "Yes, you can add and manage patient prescriptions through their medical records."
                }
            ]
        }

        user_questions = common_questions.get(user.role, common_questions["patient"])

        return {
            "quick_help": user_questions,
            "user_role": user.role,
            "timestamp": datetime.utcnow().isoformat()
        }, 200


@ns.route("/emergency-contacts")
class EmergencyContacts(Resource):
    @jwt_required()
    def get(self):
        """Get emergency contact information"""
        emergency_info = {
            "emergency_numbers": [
                {"service": "Emergency Services", "number": "911", "description": "For immediate life-threatening emergencies"},
                {"service": "Poison Control", "number": "1-800-222-1222", "description": "For poisoning emergencies"},
                {"service": "Mental Health Crisis", "number": "988", "description": "Suicide & Crisis Lifeline"}
            ],
            "urgent_care_tips": [
                "If experiencing chest pain, difficulty breathing, or severe injury, call 911 immediately",
                "For non-emergency urgent care, consider visiting an urgent care center",
                "Keep important medical information readily available (medications, allergies, conditions)",
                "If unsure whether to seek emergency care, err on the side of caution"
            ],
            "when_to_call_emergency": [
                "Difficulty breathing or shortness of breath",
                "Chest pain or pressure",
                "Severe bleeding that won't stop",
                "Loss of consciousness",
                "Severe allergic reactions",
                "Signs of stroke (facial drooping, arm weakness, speech difficulty)",
                "Severe burns",
                "Suspected poisoning"
            ],
            "disclaimer": "This information is for educational purposes only. In case of a medical emergency, always call 911 or go to the nearest emergency room.",
            "timestamp": datetime.utcnow().isoformat()
        }
        
        return emergency_info, 200
