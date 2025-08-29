from datetime import timedelta, datetime
from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required,
)

from ..extensions import db
from ..models.user import User
from ..models.patient import PatientProfile
from ..models.doctor import Doctor

ns = Namespace("auth", description="Authentication endpoints")

signup_model = ns.model(
    "SignUp",
    {
        "email": fields.String(required=True),
        "password": fields.String(required=True),
        "full_name": fields.String,
        "role": fields.String,
        "phone": fields.String,
        # Patient fields
        "date_of_birth": fields.String,
        "emergency_contact": fields.String,
        "insurance_provider": fields.String,
        # Doctor fields
        "specialty": fields.String,
        "hospital": fields.String,
        "languages": fields.String,
        "bio": fields.String,
        "consultation_fee": fields.Integer,
        "availability": fields.String,
    },
)

doctor_signup_model = ns.model(
    "DoctorSignUp",
    {
        "name": fields.String(required=True),
        "email": fields.String(required=True),
        "password": fields.String(required=True),
        "specialization": fields.String(required=True),
        "phone": fields.String,
        "license_number": fields.String,
        "years_experience": fields.Integer,
        "hospital_affiliation": fields.String,
    },
)

patient_signup_model = ns.model(
    "PatientSignUp",
    {
        "name": fields.String(required=True),
        "email": fields.String(required=True),
        "password": fields.String(required=True),
        "age": fields.Integer,
        "gender": fields.String,
        "phone": fields.String,
        "date_of_birth": fields.String,
        "medical_history": fields.String,
    },
)

login_model = ns.model(
    "Login",
    {
        "email": fields.String(required=True),
        "password": fields.String(required=True),
    },
)


@ns.route("/register")
class Register(Resource):
    @ns.expect(signup_model, validate=True)
    def post(self):
        data = request.get_json()
        if User.query.filter_by(email=data["email"]).first():
            return {"message": "Email already registered"}, 409
        role = data.get("role", "patient")
        user = User(
            email=data["email"],
            full_name=data.get("full_name"),
            role=role,
        )
        user.set_password(data["password"])
        db.session.add(user)
        db.session.flush()

        if role == "patient":
            print("DEBUG: Processing patient registration with updated code")
            # Convert date string to Python date object for SQLite
            date_of_birth = None
            if data.get("date_of_birth"):
                try:
                    date_of_birth = datetime.strptime(data["date_of_birth"], "%Y-%m-%d").date()
                    print(f"DEBUG: Converted date: {date_of_birth}")
                except ValueError:
                    return {"message": "Invalid date format. Use YYYY-MM-DD"}, 400
            
            # insurance_provider is optional (register even if missing)
            profile = PatientProfile(
                user_id=user.id,
                phone=data.get("phone"),
                date_of_birth=date_of_birth,
                emergency_contact=data.get("emergency_contact"),
                insurance_provider=data.get("insurance_provider"),
            )
            db.session.add(profile)
        elif role == "doctor":
            # Create doctor profile with specialty as required field
            # Accept both `specialty` and legacy `specialization` from clients
            specialty = data.get("specialty") or data.get("specialization")
            if not specialty:
                return {"message": "Specialty is required for doctor registration"}, 400

            doctor_profile = Doctor(
                user_id=user.id,
                specialty=specialty,
                hospital=data.get("hospital"),
                languages=data.get("languages"),
                bio=data.get("bio"),
                consultation_fee=data.get("consultation_fee", 0),
                availability=data.get("availability", "available"),
            )
            db.session.add(doctor_profile)

        db.session.commit()
        return {"id": user.id, "email": user.email}, 201


@ns.route("/register/doctor")
class DoctorRegister(Resource):
    @ns.expect(doctor_signup_model, validate=True)
    def post(self):
        data = request.get_json()
        if User.query.filter_by(email=data["email"]).first():
            return {"message": "Email already registered"}, 409
        
        user = User(
            email=data["email"],
            full_name=data["name"],
            role="doctor",
        )
        user.set_password(data["password"])
        db.session.add(user)
        db.session.flush()

        doctor_profile = Doctor(
            user_id=user.id,
            specialty=data["specialization"],
            hospital=data.get("hospital_affiliation"),
        )
        db.session.add(doctor_profile)
        db.session.commit()
        
        return {"id": user.id, "email": data["email"], "message": "Doctor registered successfully"}, 201


@ns.route("/register/patient")
class PatientRegister(Resource):
    @ns.expect(patient_signup_model, validate=True)
    def post(self):
        data = request.get_json()
        if User.query.filter_by(email=data["email"]).first():
            return {"message": "Email already registered"}, 409
        
        user = User(
            email=data["email"],
            full_name=data["name"],
            role="patient",
        )
        user.set_password(data["password"])
        db.session.add(user)
        db.session.flush()

        # Convert date string to Python date object for SQLite
        date_of_birth = None
        if data.get("date_of_birth"):
            try:
                date_of_birth = datetime.strptime(data["date_of_birth"], "%Y-%m-%d").date()
            except ValueError:
                return {"message": "Invalid date format. Use YYYY-MM-DD"}, 400

        profile = PatientProfile(
            user_id=user.id,
            phone=data.get("phone"),
            date_of_birth=date_of_birth,
        )
        db.session.add(profile)
        db.session.commit()
        
        return {"id": user.id, "email": data["email"], "message": "Patient registered successfully"}, 201


@ns.route("/login")
class Login(Resource):
    @ns.expect(login_model, validate=True)
    def post(self):
        data = request.get_json()
        user = User.query.filter_by(email=data["email"]).first()
        if not user or not user.check_password(data["password"]):
            return {"message": "Invalid credentials"}, 401
        refresh = create_refresh_token(identity=str(user.id), expires_delta=timedelta(days=7))
        access = create_access_token(identity=str(user.id), expires_delta=timedelta(minutes=15))
        return {
            "access_token": access,
            "refresh_token": refresh,
            "user": {
                "id": user.id,
                "email": user.email,
                "role": user.role,
                "full_name": user.full_name,
            },
        }


@ns.route("/refresh")
class Refresh(Resource):
    @jwt_required(refresh=True)
    def post(self):
        user_id = get_jwt_identity()
        token = create_access_token(identity=str(user_id), expires_delta=timedelta(minutes=15))
        return {"access_token": token}
