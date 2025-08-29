from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..extensions import db
from ..models.user import User
from ..models.patient import PatientProfile
from ..models.doctor import Doctor

ns = Namespace("users", description="User operations")

# API Models
profile_model = ns.model("Profile", {
    "full_name": fields.String(),
    "email": fields.String(),
    "phone": fields.String(),
    "date_of_birth": fields.String(),
    "emergency_contact": fields.String(),
    "insurance_provider": fields.String(),
})


@ns.route("/me")
class Me(Resource):
    @jwt_required()
    def get(self):
        # get_jwt_identity returns a string per our JWT config; cast to int for DB lookup
        user = User.query.get(int(get_jwt_identity()))
        if not user:
            return {"message": "Not found"}, 404

        # Ensure role-specific profile exists and include it in the response
        patient_profile = None
        doctor_profile = None

        if user.role == "patient":
            patient_profile = PatientProfile.query.filter_by(user_id=user.id).first()
            if not patient_profile:
                # Auto-provision a minimal patient profile to keep data consistent
                patient_profile = PatientProfile(user_id=user.id)
                db.session.add(patient_profile)
                db.session.commit()
        elif user.role == "doctor":
            doctor_profile = Doctor.query.filter_by(user_id=user.id).first()
            # Do not auto-provision doctor profile silently; registration should handle it

        return {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "patient_profile": (
                {"id": patient_profile.id} if patient_profile else None
            ),
            "doctor_profile": (
                {"id": doctor_profile.id} if doctor_profile else None
            ),
        }


@ns.route("/profile")
class UserProfile(Resource):
    @jwt_required()
    def get(self):
        """Get user profile information"""
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return {"message": "User not found"}, 404
            
        profile_data = {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
        }
        
        if user.role == "patient":
            patient_profile = PatientProfile.query.filter_by(user_id=user_id).first()
            if patient_profile:
                profile_data.update({
                    "phone": patient_profile.phone,
                    "date_of_birth": str(patient_profile.date_of_birth) if patient_profile.date_of_birth else None,
                    "emergency_contact": patient_profile.emergency_contact,
                    "insurance_provider": patient_profile.insurance_provider,
                })
        
        return profile_data
    
    @jwt_required()
    @ns.expect(profile_model)
    def put(self):
        """Update user profile information"""
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return {"message": "User not found"}, 404
            
        data = request.get_json()
        
        # Update user fields
        if "full_name" in data:
            user.full_name = data["full_name"]
        if "email" in data:
            # Check if email is already taken by another user
            existing = User.query.filter_by(email=data["email"]).first()
            if existing and existing.id != user_id:
                return {"message": "Email already in use"}, 400
            user.email = data["email"]
        
        # Update patient profile if user is a patient
        if user.role == "patient":
            patient_profile = PatientProfile.query.filter_by(user_id=user_id).first()
            if not patient_profile:
                patient_profile = PatientProfile(user_id=user_id)
                db.session.add(patient_profile)
            
            if "phone" in data:
                patient_profile.phone = data["phone"]
            if "date_of_birth" in data:
                patient_profile.date_of_birth = data["date_of_birth"]
            if "emergency_contact" in data:
                patient_profile.emergency_contact = data["emergency_contact"]
            if "insurance_provider" in data:
                patient_profile.insurance_provider = data["insurance_provider"]
        
        db.session.commit()
        return {"message": "Profile updated successfully"}
