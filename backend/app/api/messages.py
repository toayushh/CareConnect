from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

from ..extensions import db
from ..models.user import User
from ..models.patient import PatientProfile
from ..models.doctor import Doctor

ns = Namespace("messages", description="Doctor-Patient messaging")

# Models for API documentation
message_model = ns.model("Message", {
    "conversation_id": fields.Integer(required=True),
    "content": fields.String(required=True),
    "type": fields.String(enum=["text", "file", "urgent"]),
    "attachments": fields.List(fields.Raw)
})

conversation_model = ns.model("Conversation", {
    "participant_id": fields.Integer(required=True),
    "participant_type": fields.String(enum=["patient", "doctor"]),
    "type": fields.String(enum=["individual", "group", "urgent"])
})

@ns.route("/conversations")
class ConversationList(Resource):
    @jwt_required()
    def get(self):
        """Get all conversations for the current doctor"""
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if user.role != "doctor":
            return {"message": "Only doctors can access this endpoint"}, 403
            
        # Mock data for now - in real implementation, you'd have a Message/Conversation model
        conversations = [
            {
                "id": 1,
                "participant_id": 1,
                "participant_name": "Test Patient",
                "participant_type": "patient",
                "type": "individual",
                "last_message": "I'm feeling much better today, thank you for the new treatment plan!",
                "last_message_time": "2024-01-20T10:30:00Z",
                "unread_count": 0,
                "has_urgent_messages": False
            },
            {
                "id": 2,
                "participant_id": 2,
                "participant_name": "Dr. John Smith",
                "participant_type": "provider",
                "type": "urgent",
                "last_message": "Patient shows good progress on the joint therapy plan",
                "last_message_time": "2024-01-20T08:45:00Z",
                "unread_count": 1,
                "has_urgent_messages": False
            }
        ]
        
        return conversations

@ns.route("/conversations/<int:conversation_id>/messages")
class ConversationMessages(Resource):
    @jwt_required()
    def get(self, conversation_id):
        """Get messages for a specific conversation"""
        user_id = int(get_jwt_identity())
        
        # Mock messages - in real implementation, fetch from Message model
        messages = [
            {
                "id": 1,
                "conversation_id": conversation_id,
                "sender_id": 1,
                "sender_type": "patient",
                "content": "Hello Dr. Smith, I wanted to update you on my progress",
                "timestamp": "2024-01-20T09:00:00Z",
                "type": "text",
                "attachments": [],
                "is_urgent": False
            },
            {
                "id": 2,
                "conversation_id": conversation_id,
                "sender_id": user_id,
                "sender_type": "doctor",
                "content": "Thank you for the update! How are you feeling today?",
                "timestamp": "2024-01-20T09:15:00Z",
                "type": "text",
                "attachments": [],
                "is_urgent": False
            },
            {
                "id": 3,
                "conversation_id": conversation_id,
                "sender_id": 1,
                "sender_type": "patient",
                "content": "Much better! The new medication is really helping.",
                "timestamp": "2024-01-20T10:30:00Z",
                "type": "text",
                "attachments": [],
                "is_urgent": False
            }
        ]
        
        return messages

@ns.route("")
class MessageSend(Resource):
    @jwt_required()
    @ns.expect(message_model)
    def post(self):
        """Send a new message"""
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        # In real implementation, save to Message model
        new_message = {
            "id": 999,  # Would be auto-generated
            "conversation_id": data["conversation_id"],
            "sender_id": user_id,
            "sender_type": "doctor",
            "content": data["content"],
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "type": data.get("type", "text"),
            "attachments": data.get("attachments", []),
            "is_urgent": data.get("type") == "urgent"
        }
        
        return new_message, 201

@ns.route("/urgent-alerts")
class UrgentAlerts(Resource):
    @jwt_required()
    def get(self):
        """Get urgent alerts for the doctor"""
        user_id = int(get_jwt_identity())
        
        # Mock urgent alerts - in real implementation, query from database
        alerts = [
            {
                "id": 1,
                "patient_id": 102,
                "patient_name": "Sarah Johnson",
                "type": "mood_crisis",
                "message": "Mood score dropped to 2/10 - immediate attention needed",
                "timestamp": "2024-01-20T09:15:00Z",
                "severity": "critical"
            },
            {
                "id": 2,
                "patient_id": 104,
                "patient_name": "Michael Brown",
                "type": "pain_flare",
                "message": "Pain level reported as 9/10 for 2 hours",
                "timestamp": "2024-01-20T08:30:00Z",
                "severity": "high"
            }
        ]
        
        return alerts

@ns.route("/<int:message_id>/urgent")
class MarkMessageUrgent(Resource):
    @jwt_required()
    def post(self, message_id):
        """Mark a message as urgent"""
        user_id = int(get_jwt_identity())
        
        # In real implementation, update Message model
        return {"message": "Message marked as urgent", "message_id": message_id}, 200
