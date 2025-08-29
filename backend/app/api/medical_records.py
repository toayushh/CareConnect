from datetime import datetime, date
from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..extensions import db
from ..models.medical_records import (
    Allergy, Medication, MedicalCondition, LabResult, 
    MedicalProcedure, VitalSign, HealthMetric
)
from ..models.patient import PatientProfile
from ..models.user import User

ns = Namespace("medical-records", description="Medical Records operations")

# API Models for validation
allergy_model = ns.model("Allergy", {
    "name": fields.String(required=True),
    "severity": fields.String(required=True, enum=["Low", "Medium", "High"]),
    "reaction": fields.String(),
    "notes": fields.String()
})

medication_model = ns.model("Medication", {
    "name": fields.String(required=True),
    "dosage": fields.String(),
    "frequency": fields.String(),
    "prescribed_by": fields.String(),
    "start_date": fields.String(),
    "status": fields.String(enum=["Active", "Inactive", "Discontinued"]),
    "purpose": fields.String(),
    "instructions": fields.String()
})

condition_model = ns.model("MedicalCondition", {
    "name": fields.String(required=True),
    "diagnosed_date": fields.String(),
    "status": fields.String(enum=["Active", "Managed", "Resolved", "Chronic"]),
    "severity": fields.String(enum=["Mild", "Moderate", "Severe"]),
    "diagnosed_by": fields.String(),
    "notes": fields.String()
})

lab_result_model = ns.model("LabResult", {
    "test_name": fields.String(required=True),
    "value": fields.String(required=True),
    "reference_range": fields.String(),
    "status": fields.String(enum=["Normal", "Abnormal", "Critical", "High", "Low"]),
    "test_date": fields.String(),
    "ordered_by": fields.String(),
    "notes": fields.String()
})

procedure_model = ns.model("MedicalProcedure", {
    "name": fields.String(required=True),
    "procedure_date": fields.String(),
    "provider_name": fields.String(),
    "location": fields.String(),
    "outcome": fields.String(),
    "notes": fields.String()
})

vital_signs_model = ns.model("VitalSigns", {
    "systolic_bp": fields.Integer(),
    "diastolic_bp": fields.Integer(),
    "heart_rate": fields.Integer(),
    "temperature": fields.Float(),
    "weight": fields.Float(),
    "height": fields.Float(),
    "oxygen_saturation": fields.Float(),
    "measured_by": fields.String(),
    "notes": fields.String()
})


def get_patient_from_user():
    """Helper to get patient profile from JWT user"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != "patient":
        return None
    return PatientProfile.query.filter_by(user_id=user_id).first()


@ns.route("/allergies")
class AllergyList(Resource):
    @jwt_required()
    def get(self):
        """Get all allergies for the patient"""
        patient = get_patient_from_user()
        if not patient:
            return {"message": "Patient profile not found"}, 404
        
        allergies = Allergy.query.filter_by(patient_id=patient.id, is_active=True).all()
        return [allergy.to_dict() for allergy in allergies]
    
    @jwt_required()
    @ns.expect(allergy_model, validate=True)
    def post(self):
        """Add a new allergy"""
        patient = get_patient_from_user()
        if not patient:
            return {"message": "Patient profile not found"}, 404
        
        data = request.get_json()
        
        allergy = Allergy(
            patient_id=patient.id,
            name=data["name"],
            severity=data["severity"],
            reaction=data.get("reaction"),
            notes=data.get("notes")
        )
        
        db.session.add(allergy)
        db.session.commit()
        
        return allergy.to_dict(), 201


@ns.route("/allergies/<int:allergy_id>")
class AllergyDetail(Resource):
    @jwt_required()
    def delete(self, allergy_id):
        """Delete (deactivate) an allergy"""
        patient = get_patient_from_user()
        if not patient:
            return {"message": "Patient profile not found"}, 404
        
        allergy = Allergy.query.filter_by(id=allergy_id, patient_id=patient.id).first()
        if not allergy:
            return {"message": "Allergy not found"}, 404
        
        allergy.is_active = False
        db.session.commit()
        
        return {"message": "Allergy removed"}, 200


@ns.route("/medications")
class MedicationList(Resource):
    @jwt_required()
    def get(self):
        """Get all medications for the patient"""
        patient = get_patient_from_user()
        if not patient:
            return {"message": "Patient profile not found"}, 404
        
        medications = Medication.query.filter_by(patient_id=patient.id).all()
        return [med.to_dict() for med in medications]
    
    @jwt_required()
    @ns.expect(medication_model, validate=True)
    def post(self):
        """Add a new medication"""
        patient = get_patient_from_user()
        if not patient:
            return {"message": "Patient profile not found"}, 404
        
        data = request.get_json()
        
        # Parse start_date if provided
        start_date = None
        if data.get("start_date"):
            try:
                start_date = datetime.strptime(data["start_date"], "%Y-%m-%d").date()
            except ValueError:
                return {"message": "Invalid start_date format. Use YYYY-MM-DD"}, 400
        
        medication = Medication(
            patient_id=patient.id,
            name=data["name"],
            dosage=data.get("dosage"),
            frequency=data.get("frequency"),
            prescribed_by=data.get("prescribed_by"),
            start_date=start_date,
            status=data.get("status", "Active"),
            purpose=data.get("purpose"),
            instructions=data.get("instructions")
        )
        
        db.session.add(medication)
        db.session.commit()
        
        return medication.to_dict(), 201


@ns.route("/conditions")
class ConditionList(Resource):
    @jwt_required()
    def get(self):
        """Get all medical conditions for the patient"""
        patient = get_patient_from_user()
        if not patient:
            return {"message": "Patient profile not found"}, 404
        
        conditions = MedicalCondition.query.filter_by(patient_id=patient.id).all()
        return [condition.to_dict() for condition in conditions]
    
    @jwt_required()
    @ns.expect(condition_model, validate=True)
    def post(self):
        """Add a new medical condition"""
        patient = get_patient_from_user()
        if not patient:
            return {"message": "Patient profile not found"}, 404
        
        data = request.get_json()
        
        # Parse diagnosed_date if provided
        diagnosed_date = None
        if data.get("diagnosed_date"):
            try:
                diagnosed_date = datetime.strptime(data["diagnosed_date"], "%Y-%m-%d").date()
            except ValueError:
                return {"message": "Invalid diagnosed_date format. Use YYYY-MM-DD"}, 400
        
        condition = MedicalCondition(
            patient_id=patient.id,
            name=data["name"],
            diagnosed_date=diagnosed_date,
            status=data.get("status", "Active"),
            severity=data.get("severity"),
            diagnosed_by=data.get("diagnosed_by"),
            notes=data.get("notes")
        )
        
        db.session.add(condition)
        db.session.commit()
        
        return condition.to_dict(), 201


@ns.route("/lab-results")
class LabResultList(Resource):
    @jwt_required()
    def get(self):
        """Get all lab results for the patient"""
        patient = get_patient_from_user()
        if not patient:
            return {"message": "Patient profile not found"}, 404
        
        results = LabResult.query.filter_by(patient_id=patient.id).order_by(LabResult.test_date.desc()).all()
        return [result.to_dict() for result in results]
    
    @jwt_required()
    @ns.expect(lab_result_model, validate=True)
    def post(self):
        """Add a new lab result"""
        patient = get_patient_from_user()
        if not patient:
            return {"message": "Patient profile not found"}, 404
        
        data = request.get_json()
        
        # Parse test_date if provided
        test_date = None
        if data.get("test_date"):
            try:
                test_date = datetime.strptime(data["test_date"], "%Y-%m-%d")
            except ValueError:
                return {"message": "Invalid test_date format. Use YYYY-MM-DD"}, 400
        
        result = LabResult(
            patient_id=patient.id,
            test_name=data["test_name"],
            value=data["value"],
            reference_range=data.get("reference_range"),
            status=data.get("status", "Normal"),
            test_date=test_date or datetime.utcnow(),
            ordered_by=data.get("ordered_by"),
            notes=data.get("notes")
        )
        
        db.session.add(result)
        db.session.commit()
        
        return result.to_dict(), 201


@ns.route("/procedures")
class ProcedureList(Resource):
    @jwt_required()
    def get(self):
        """Get all procedures for the patient"""
        patient = get_patient_from_user()
        if not patient:
            return {"message": "Patient profile not found"}, 404
        
        procedures = MedicalProcedure.query.filter_by(patient_id=patient.id).order_by(MedicalProcedure.procedure_date.desc()).all()
        return [proc.to_dict() for proc in procedures]
    
    @jwt_required()
    @ns.expect(procedure_model, validate=True)
    def post(self):
        """Add a new procedure"""
        patient = get_patient_from_user()
        if not patient:
            return {"message": "Patient profile not found"}, 404
        
        data = request.get_json()
        
        # Parse procedure_date if provided
        procedure_date = None
        if data.get("procedure_date"):
            try:
                procedure_date = datetime.strptime(data["procedure_date"], "%Y-%m-%d")
            except ValueError:
                return {"message": "Invalid procedure_date format. Use YYYY-MM-DD"}, 400
        
        procedure = MedicalProcedure(
            patient_id=patient.id,
            name=data["name"],
            procedure_date=procedure_date,
            provider_name=data.get("provider_name"),
            location=data.get("location"),
            outcome=data.get("outcome"),
            notes=data.get("notes")
        )
        
        db.session.add(procedure)
        db.session.commit()
        
        return procedure.to_dict(), 201


@ns.route("/vital-signs")
class VitalSignsList(Resource):
    @jwt_required()
    def get(self):
        """Get all vital signs for the patient"""
        patient = get_patient_from_user()
        if not patient:
            return {"message": "Patient profile not found"}, 404
        
        # Get recent vitals (last 30 entries)
        vitals = VitalSign.query.filter_by(patient_id=patient.id).order_by(VitalSign.measurement_date.desc()).limit(30).all()
        return [vital.to_dict() for vital in vitals]
    
    @jwt_required()
    @ns.expect(vital_signs_model, validate=True)
    def post(self):
        """Add new vital signs"""
        patient = get_patient_from_user()
        if not patient:
            return {"message": "Patient profile not found"}, 404
        
        data = request.get_json()
        
        # Calculate BMI if height and weight are provided
        bmi = None
        if data.get("height") and data.get("weight"):
            height_m = data["height"] * 0.0254  # inches to meters
            weight_kg = data["weight"] * 0.453592  # lbs to kg
            bmi = weight_kg / (height_m ** 2)
        
        vital = VitalSign(
            patient_id=patient.id,
            systolic_bp=data.get("systolic_bp"),
            diastolic_bp=data.get("diastolic_bp"),
            heart_rate=data.get("heart_rate"),
            temperature=data.get("temperature"),
            weight=data.get("weight"),
            height=data.get("height"),
            bmi=bmi,
            oxygen_saturation=data.get("oxygen_saturation"),
            measured_by=data.get("measured_by"),
            notes=data.get("notes")
        )
        
        db.session.add(vital)
        db.session.commit()
        
        return vital.to_dict(), 201


@ns.route("/health-metrics")
class HealthMetricsList(Resource):
    @jwt_required()
    def get(self):
        """Get health metrics summary for the patient"""
        patient = get_patient_from_user()
        if not patient:
            return {"message": "Patient profile not found"}, 404
        
        # Get latest health metrics
        latest_metric = HealthMetric.query.filter_by(patient_id=patient.id).order_by(HealthMetric.metric_date.desc()).first()
        
        # Get latest vitals
        latest_vital = VitalSign.query.filter_by(patient_id=patient.id).order_by(VitalSign.measurement_date.desc()).first()
        
        # Calculate summary stats
        total_allergies = Allergy.query.filter_by(patient_id=patient.id, is_active=True).count()
        active_medications = Medication.query.filter_by(patient_id=patient.id, status="Active").count()
        managed_conditions = MedicalCondition.query.filter_by(patient_id=patient.id, status="Managed").count()
        recent_labs = LabResult.query.filter_by(patient_id=patient.id).order_by(LabResult.test_date.desc()).limit(5).count()
        
        response = {
            "summary": {
                "allergies_count": total_allergies,
                "active_medications_count": active_medications,
                "managed_conditions_count": managed_conditions,
                "recent_labs_count": recent_labs
            },
            "latest_health_score": latest_metric.to_dict() if latest_metric else None,
            "latest_vitals": latest_vital.to_dict() if latest_vital else None
        }
        
        return response


@ns.route("/overview")
class MedicalRecordsOverview(Resource):
    @jwt_required()
    def get(self):
        """Get complete medical records overview"""
        patient = get_patient_from_user()
        if not patient:
            return {"message": "Patient profile not found"}, 404
        
        # Get all data
        allergies = Allergy.query.filter_by(patient_id=patient.id, is_active=True).all()
        medications = Medication.query.filter_by(patient_id=patient.id).all()
        conditions = MedicalCondition.query.filter_by(patient_id=patient.id).all()
        lab_results = LabResult.query.filter_by(patient_id=patient.id).order_by(LabResult.test_date.desc()).limit(10).all()
        procedures = MedicalProcedure.query.filter_by(patient_id=patient.id).order_by(MedicalProcedure.procedure_date.desc()).limit(10).all()
        
        return {
            "allergies": [allergy.to_dict() for allergy in allergies],
            "medications": [med.to_dict() for med in medications],
            "conditions": [condition.to_dict() for condition in conditions],
            "lab_results": [result.to_dict() for result in lab_results],
            "procedures": [proc.to_dict() for proc in procedures]
        }
