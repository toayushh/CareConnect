from datetime import datetime
from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..extensions import db
from ..models.appointment import Appointment
from ..models.doctor import Doctor
from ..models.patient import PatientProfile
from ..models.user import User

ns = Namespace("appointments", description="Appointment operations")

appointment_model = ns.model(
    "Appointment",
    {
        "doctor_id": fields.Integer(required=True),
        "start_time": fields.String(required=True, description="ISO datetime"),
        "end_time": fields.String(required=True, description="ISO datetime"),
        "notes": fields.String,
        "appointment_type": fields.String(enum=["in-person", "video", "phone"]),
        "reason": fields.String,
    },
)


@ns.route("")
class AppointmentList(Resource):
    @jwt_required()
    def get(self):
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)

        if user.role == "doctor":
            doctor = Doctor.query.filter_by(user_id=user_id).first()
            if not doctor:
                return {"message": "Doctor profile not found"}, 404
            items = Appointment.query.filter_by(doctor_id=doctor.id).order_by(Appointment.start_time.desc()).all()
        elif user.role == "patient":
            patient = PatientProfile.query.filter_by(user_id=user_id).first()
            if not patient:
                return {"message": "Patient profile not found"}, 404
            items = Appointment.query.filter_by(patient_id=patient.id).order_by(Appointment.start_time.desc()).all()
        else:
            return {"message": "Invalid user role"}, 403

        return [
            {
                "id": a.id,
                "doctor_id": a.doctor_id,
                "patient_id": a.patient_id,
                "start_time": a.start_time.isoformat(),
                "end_time": a.end_time.isoformat(),
                "status": a.status,
                "notes": a.notes,
                "appointment_type": a.appointment_type,
                "reason": a.reason,
                # Add doctor and patient names for better UI
                "doctor_name": a.doctor.user.full_name if a.doctor and a.doctor.user else "Unknown Doctor",
                "patient_name": a.patient.user.full_name if a.patient and a.patient.user else "Unknown Patient",
                "doctor_specialty": a.doctor.specialty if a.doctor else None,
            }
            for a in items
        ]

    @jwt_required()
    @ns.expect(appointment_model, validate=True)
    def post(self):
        user_id = int(get_jwt_identity())
        data = request.get_json()

        # Get patient profile
        user = User.query.get(user_id)
        if not user or user.role != "patient":
            return {"message": "Only patients can book appointments"}, 403

        patient = PatientProfile.query.filter_by(user_id=user_id).first()
        if not patient:
            return {"message": "Patient profile not found"}, 404

        # Validate doctor exists
        doctor = Doctor.query.get(data["doctor_id"])
        if not doctor:
            return {"message": "Doctor not found"}, 400

        try:
            # Handle datetime parsing more robustly
            start_str = data["start_time"]
            end_str = data["end_time"]
            
            # Remove 'Z' if present and parse
            if start_str.endswith('Z'):
                start_str = start_str[:-1]
            if end_str.endswith('Z'):
                end_str = end_str[:-1]
                
            start = datetime.fromisoformat(start_str)
            end = datetime.fromisoformat(end_str)
        except Exception as e:
            return {"message": f"Invalid datetime format: {str(e)}"}, 400

        # Create appointment
        appt = Appointment(
            patient_id=patient.id,  # Use patient profile ID, not user ID
            doctor_id=data["doctor_id"],
            start_time=start,
            end_time=end,
            notes=data.get("notes"),
            appointment_type=data.get("appointment_type", "video"),
            reason=data.get("reason"),
            status="scheduled"
        )
        db.session.add(appt)
        db.session.commit()

        return {
            "id": appt.id,
            "message": "Appointment booked successfully!",
            "appointment": {
                "id": appt.id,
                "doctor_name": doctor.user.full_name if doctor.user else "Unknown Doctor",
                "patient_name": user.full_name,
                "start_time": appt.start_time.isoformat(),
                "end_time": appt.end_time.isoformat(),
                "appointment_type": appt.appointment_type,
                "reason": appt.reason,
                "status": appt.status
            }
        }, 201



@ns.route("/<int:appointment_id>/status")
class AppointmentStatus(Resource):
    @jwt_required()
    def post(self, appointment_id: int):
        """Update appointment status (doctor or patient of the appointment only)."""
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return {"message": "User not found"}, 404
        appt = Appointment.query.get_or_404(appointment_id)
        # Authorization: patient or doctor on the appointment
        if user.role == "patient":
            patient = PatientProfile.query.filter_by(user_id=user_id).first()
            if not patient or appt.patient_id != patient.id:
                return {"message": "Unauthorized"}, 403
        elif user.role == "doctor":
            doctor = Doctor.query.filter_by(user_id=user_id).first()
            if not doctor or appt.doctor_id != doctor.id:
                return {"message": "Unauthorized"}, 403
        data = request.get_json() or {}
        status = data.get("status")
        if status not in {"scheduled", "pending", "confirmed", "completed", "cancelled"}:
            return {"message": "Invalid status"}, 400
        appt.status = status
        db.session.commit()
        return {
            "id": appt.id,
            "status": appt.status,
            "start_time": appt.start_time.isoformat(),
            "end_time": appt.end_time.isoformat(),
        }

@ns.route("/<int:appointment_id>/cancel")
class AppointmentCancel(Resource):
    @jwt_required()
    def post(self, appointment_id: int):
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        # Patients can cancel their own appointment; doctors could cancel theirs in future
        if not user:
            return {"message": "User not found"}, 404
        appt = Appointment.query.get_or_404(appointment_id)
        if user.role == "patient":
            patient = PatientProfile.query.filter_by(user_id=user_id).first()
            if not patient or appt.patient_id != patient.id:
                return {"message": "Unauthorized"}, 403
        elif user.role == "doctor":
            doctor = Doctor.query.filter_by(user_id=user_id).first()
            if not doctor or appt.doctor_id != doctor.id:
                return {"message": "Unauthorized"}, 403
        appt.status = "cancelled"
        db.session.commit()
        return {"id": appt.id, "status": appt.status}


@ns.route("/<int:appointment_id>/reschedule")
class AppointmentReschedule(Resource):
    @jwt_required()
    def post(self, appointment_id: int):
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return {"message": "User not found"}, 404
        appt = Appointment.query.get_or_404(appointment_id)
        if user.role == "patient":
            patient = PatientProfile.query.filter_by(user_id=user_id).first()
            if not patient or appt.patient_id != patient.id:
                return {"message": "Unauthorized"}, 403
        elif user.role == "doctor":
            doctor = Doctor.query.filter_by(user_id=user_id).first()
            if not doctor or appt.doctor_id != doctor.id:
                return {"message": "Unauthorized"}, 403
        data = request.get_json() or {}
        try:
            start = datetime.fromisoformat(data.get("start_time", appt.start_time.isoformat()))
            end = datetime.fromisoformat(data.get("end_time", appt.end_time.isoformat()))
        except Exception:
            return {"message": "Invalid datetime format"}, 400
        appt.start_time = start
        appt.end_time = end
        appt.status = "scheduled"
        db.session.commit()
        return {"id": appt.id, "status": appt.status, "start_time": appt.start_time.isoformat(), "end_time": appt.end_time.isoformat()}
