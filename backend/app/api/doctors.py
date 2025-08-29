from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..extensions import db
from ..models.doctor import Doctor
from ..models.user import User

ns = Namespace("doctors", description="Doctor operations")

doctor_model = ns.model(
    "Doctor",
    {
        "user_id": fields.Integer(required=True),
        "specialty": fields.String(required=True),
        "hospital": fields.String,
        "languages": fields.String,
        "bio": fields.String,
        "consultation_fee": fields.Integer,
        "availability": fields.String,
    },
)


@ns.route("")
class DoctorList(Resource):
    def get(self):
        q = Doctor.query
        specialty = request.args.get("specialty")
        language = request.args.get("language")
        availability = request.args.get("availability")
        if specialty:
            q = q.filter(Doctor.specialty.ilike(f"%{specialty}%"))
        if language:
            q = q.filter(Doctor.languages.ilike(f"%{language}%"))
        if availability:
            q = q.filter(Doctor.availability == availability)
        doctors = q.limit(100).all()
        return [
            {
                "id": d.id,
                "user_id": d.user_id,
                "specialty": d.specialty,
                "hospital": d.hospital,
                "languages": d.languages,
                "rating": d.rating,
                "bio": d.bio,
                "consultation_fee": d.consultation_fee,
                "availability": d.availability,
                "name": d.user.full_name if d.user else None,
            }
            for d in doctors
        ]

    @jwt_required()
    @ns.expect(doctor_model, validate=True)
    def post(self):
        data = request.get_json()
        if not User.query.get(data["user_id"]):
            return {"message": "user_id not found"}, 400
        doctor = Doctor(**data)
        db.session.add(doctor)
        db.session.commit()
        return {"id": doctor.id}, 201


@ns.route("/<int:doctor_id>")
class DoctorDetail(Resource):
    def get(self, doctor_id: int):
        d = Doctor.query.get_or_404(doctor_id)
        return {
            "id": d.id,
            "user_id": d.user_id,
            "specialty": d.specialty,
            "hospital": d.hospital,
            "languages": d.languages,
            "rating": d.rating,
            "bio": d.bio,
            "consultation_fee": d.consultation_fee,
            "availability": d.availability,
            "name": d.user.full_name if d.user else None,
        }

@ns.route("/me")
class MyDoctorProfile(Resource):
    @jwt_required()
    def get(self):
        user_id = int(get_jwt_identity())
        d = Doctor.query.filter_by(user_id=user_id).first()
        if not d:
            return {"message": "Doctor profile not found"}, 404
        return {
            "id": d.id,
            "user_id": d.user_id,
            "specialty": d.specialty,
            "hospital": d.hospital,
            "languages": d.languages,
            "rating": d.rating,
            "bio": d.bio,
            "consultation_fee": d.consultation_fee,
            "availability": d.availability,
            "name": d.user.full_name if d.user else None,
        }

    @jwt_required()
    @ns.expect(doctor_model, validate=True)
    def put(self):
        user_id = int(get_jwt_identity())
        d = Doctor.query.filter_by(user_id=user_id).first()
        if not d:
            return {"message": "Doctor profile not found"}, 404
        data = request.get_json()
        for key, value in data.items():
            if hasattr(d, key):
                setattr(d, key, value)
        db.session.commit()
        return {"message": "Profile updated successfully"}


@ns.route("/patients")
class DoctorPatients(Resource):
    @jwt_required()
    def get(self):
        """Get all patients assigned to the current doctor"""
        user_id = int(get_jwt_identity())
        doctor = Doctor.query.filter_by(user_id=user_id).first()
        
        if not doctor:
            return {"message": "Doctor profile not found"}, 404
        
        # Get patients from appointments or treatment plans
        from ..models.appointment import Appointment
        from ..models.treatment_plans import TreatmentPlan
        
        # Get unique patient IDs from appointments
        appointment_patients = db.session.query(Appointment.patient_id).filter_by(doctor_id=doctor.id).distinct().all()
        appointment_patient_ids = [p[0] for p in appointment_patients]
        
        # Get unique patient IDs from treatment plans
        treatment_patients = db.session.query(TreatmentPlan.patient_id).filter_by(doctor_id=doctor.id).distinct().all()
        treatment_patient_ids = [p[0] for p in treatment_patients]
        
        # Combine and get unique patient IDs
        all_patient_ids = list(set(appointment_patient_ids + treatment_patient_ids))
        
        if not all_patient_ids:
            return []
        
        # Get patient profiles
        from ..models.patient import PatientProfile
        patients = PatientProfile.query.filter(PatientProfile.id.in_(all_patient_ids)).all()
        
        return [
            {
                "id": p.id,
                "name": p.user.full_name if p.user else "Unknown",
                "age": p.age,
                "condition": p.primary_condition or "Not specified",
                "status": p.status or "active",
                "priority": p.priority or "medium",
                "last_visit": p.last_visit.isoformat() if p.last_visit else None,
                "email": p.user.email if p.user else None
            }
            for p in patients
        ]

@ns.route("/<int:patient_id>")
class PatientDetail(Resource):
    @jwt_required()
    def get(self, patient_id):
        """Get detailed patient information for doctors"""
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if user.role != "doctor":
            return {"message": "Only doctors can access patient details"}, 403
        
         # Get actual patient from database
        from ..models.patient import PatientProfile
        patient_profile = PatientProfile.query.get(patient_id)
        
        if not patient_profile or not patient_profile.user:
            return {"message": "Patient not found"}, 404
        
        # Get patient's actual data
        patient_user = patient_profile.user
        
        # In a real implementation, you'd get this data from actual models
        patient_details = {
            "id": patient_profile.id,
            "name": patient_user.full_name,
            "age": getattr(patient_user, 'age', None),
            "condition": "General health monitoring",  # Would come from medical records
            "last_visit": "2024-01-15",  # Would come from appointments
            "next_appointment": "2024-01-25",  # Would come from appointments
            "status": "active",
            "priority": "medium",
            "phone": getattr(patient_user, 'phone', None),
            "email": patient_user.email,
            "medical_history": [
                {"date": "2024-01-15", "diagnosis": "General checkup", "treatment": "Health monitoring"},
                {"date": "2023-12-20", "diagnosis": "Routine examination", "treatment": "Preventive care"}
            ],
            "current_medications": [],  # Would come from medical records
            "allergies": [],  # Would come from medical records
            "emergency_contact": "Emergency Contact - (555) 123-4568"  # Would come from patient profile
        }
        
        return patient_details


@ns.route("/recommendations")
class DoctorRecommendations(Resource):
    def get(self):
        # MVP: simple filters-based order, no hardcoded doctor list
        q = Doctor.query
        specialty = request.args.get("specialty")
        language = request.args.get("language")
        if specialty:
            q = q.filter(Doctor.specialty.ilike(f"%{specialty}%"))
        if language:
            q = q.filter(Doctor.languages.ilike(f"%{language}%"))
        doctors = q.order_by(Doctor.rating.desc()).limit(10).all()
        return [
            {
                "id": d.id,
                "name": d.user.full_name if d.user else None,
                "specialty": d.specialty,
                "hospital": d.hospital,
                "languages": d.languages,
                "rating": d.rating,
                "consultation_fee": d.consultation_fee,
                "availability": d.availability,
            }
            for d in doctors
        ]
