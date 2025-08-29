from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

from ..extensions import db
from ..models.user import User

ns = Namespace("patients", description="Patient photo and document management")

photo_model = ns.model("PatientPhoto", {
    "description": fields.String(),
    "photo_type": fields.String(enum=["progress", "wound", "exercise", "medication"]),
    "annotations": fields.List(fields.Raw)
})

@ns.route("/<int:patient_id>/photos")
class PatientPhotos(Resource):
    @jwt_required()
    def get(self, patient_id):
        """Get photos uploaded by a patient"""
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if user.role != "doctor":
            return {"message": "Only doctors can access patient photos"}, 403
        
        # Mock photo data - in real implementation, fetch from PatientPhoto model
        photos = [
            {
                "id": 1,
                "patient_id": patient_id,
                "url": "/uploads/patient_photos/wound_progress_1.jpg",
                "description": "Wound healing progress - day 7",
                "photo_type": "wound",
                "created_at": "2024-01-20T10:00:00Z",
                "annotations": [
                    {
                        "x": 100,
                        "y": 150,
                        "note": "Significant improvement in healing",
                        "doctor_id": user_id,
                        "timestamp": "2024-01-20T11:00:00Z"
                    }
                ]
            },
            {
                "id": 2,
                "patient_id": patient_id,
                "url": "/uploads/patient_photos/exercise_form.mp4",
                "description": "Physical therapy exercise demonstration",
                "photo_type": "exercise",
                "created_at": "2024-01-19T15:30:00Z",
                "annotations": []
            }
        ]
        
        return photos

    @jwt_required()
    def post(self, patient_id):
        """Add annotation to a patient photo"""
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        # In real implementation, save annotation to database
        annotation = {
            "id": 999,
            "photo_id": data.get("photo_id"),
            "x": data.get("x"),
            "y": data.get("y"),
            "note": data.get("note"),
            "doctor_id": user_id,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
        return annotation, 201

@ns.route("/<int:patient_id>/notes")
class PatientNotes(Resource):
    @jwt_required()
    def get(self, patient_id):
        """Get patient's voice notes and text notes"""
        user_id = int(get_jwt_identity())
        
        # Mock notes data
        notes = [
            {
                "id": 1,
                "patient_id": patient_id,
                "type": "voice",
                "content": "/uploads/voice_notes/patient_update_1.mp3",
                "transcription": "Feeling much better today. Pain level is down to about 4 out of 10.",
                "created_at": "2024-01-20T09:00:00Z",
                "duration": 45
            },
            {
                "id": 2,
                "patient_id": patient_id,
                "type": "text",
                "content": "Had some trouble sleeping last night due to pain. Took extra medication as prescribed.",
                "created_at": "2024-01-19T22:30:00Z"
            }
        ]
        
        return notes

@ns.route("/<int:patient_id>/doctor-notes")
class DoctorNotes(Resource):
    @jwt_required()
    def post(self, patient_id):
        """Add a doctor's clinical note for a patient"""
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if user.role != "doctor":
            return {"message": "Only doctors can add clinical notes"}, 403
            
        data = request.get_json()
        
        # In real implementation, save to DoctorNote model
        note = {
            "id": 999,
            "patient_id": patient_id,
            "doctor_id": user_id,
            "note": data["note"],
            "type": data.get("type", "clinical_observation"),
            "timestamp": data.get("timestamp", datetime.utcnow().isoformat() + "Z"),
            "created_at": datetime.utcnow().isoformat() + "Z"
        }
        
        return note, 201
