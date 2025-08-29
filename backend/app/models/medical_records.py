from datetime import datetime
from ..extensions import db


class Allergy(db.Model):
    __tablename__ = "allergies"
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patient_profiles.id"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    severity = db.Column(db.String(50), nullable=False)  # Low, Medium, High
    reaction = db.Column(db.Text)
    date_added = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    notes = db.Column(db.Text)
    
    # Relationships
    patient = db.relationship("PatientProfile", backref="allergies")
    
    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "name": self.name,
            "severity": self.severity,
            "reaction": self.reaction,
            "date_added": self.date_added.isoformat() if self.date_added else None,
            "is_active": self.is_active,
            "notes": self.notes
        }


class Medication(db.Model):
    __tablename__ = "medications"
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patient_profiles.id"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    dosage = db.Column(db.String(100))
    frequency = db.Column(db.String(100))
    prescribed_by = db.Column(db.String(255))
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    status = db.Column(db.String(50), default="Active")  # Active, Inactive, Discontinued
    purpose = db.Column(db.String(255))
    side_effects = db.Column(db.Text)
    instructions = db.Column(db.Text)
    pharmacy = db.Column(db.String(255))
    refills_remaining = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    patient = db.relationship("PatientProfile", backref="medications")
    
    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "name": self.name,
            "dosage": self.dosage,
            "frequency": self.frequency,
            "prescribed_by": self.prescribed_by,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "status": self.status,
            "purpose": self.purpose,
            "side_effects": self.side_effects,
            "instructions": self.instructions,
            "pharmacy": self.pharmacy,
            "refills_remaining": self.refills_remaining,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class MedicalCondition(db.Model):
    __tablename__ = "medical_conditions"
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patient_profiles.id"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    diagnosed_date = db.Column(db.Date)
    status = db.Column(db.String(50), default="Active")  # Active, Managed, Resolved, Chronic
    severity = db.Column(db.String(50))  # Mild, Moderate, Severe
    icd_code = db.Column(db.String(20))
    diagnosed_by = db.Column(db.String(255))
    notes = db.Column(db.Text)
    treatment_plan = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    patient = db.relationship("PatientProfile", backref="medical_conditions")
    
    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "name": self.name,
            "diagnosed_date": self.diagnosed_date.isoformat() if self.diagnosed_date else None,
            "status": self.status,
            "severity": self.severity,
            "icd_code": self.icd_code,
            "diagnosed_by": self.diagnosed_by,
            "notes": self.notes,
            "treatment_plan": self.treatment_plan,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class LabResult(db.Model):
    __tablename__ = "lab_results"
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patient_profiles.id"), nullable=False)
    test_name = db.Column(db.String(255), nullable=False)
    test_code = db.Column(db.String(50))
    value = db.Column(db.String(100))
    unit = db.Column(db.String(50))
    reference_range = db.Column(db.String(100))
    status = db.Column(db.String(50))  # Normal, Abnormal, Critical, High, Low
    test_date = db.Column(db.DateTime)
    ordered_by = db.Column(db.String(255))
    lab_name = db.Column(db.String(255))
    notes = db.Column(db.Text)
    flagged = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    patient = db.relationship("PatientProfile", backref="lab_results")
    
    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "test_name": self.test_name,
            "test_code": self.test_code,
            "value": self.value,
            "unit": self.unit,
            "reference_range": self.reference_range,
            "status": self.status,
            "test_date": self.test_date.isoformat() if self.test_date else None,
            "ordered_by": self.ordered_by,
            "lab_name": self.lab_name,
            "notes": self.notes,
            "flagged": self.flagged,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class MedicalProcedure(db.Model):
    __tablename__ = "medical_procedures"
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patient_profiles.id"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    procedure_code = db.Column(db.String(50))
    procedure_date = db.Column(db.DateTime)
    provider_name = db.Column(db.String(255))
    location = db.Column(db.String(255))
    outcome = db.Column(db.Text)
    complications = db.Column(db.Text)
    notes = db.Column(db.Text)
    cost = db.Column(db.Numeric(10, 2))
    insurance_covered = db.Column(db.Boolean, default=True)
    follow_up_required = db.Column(db.Boolean, default=False)
    follow_up_date = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    patient = db.relationship("PatientProfile", backref="medical_procedures")
    
    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "name": self.name,
            "procedure_code": self.procedure_code,
            "procedure_date": self.procedure_date.isoformat() if self.procedure_date else None,
            "provider_name": self.provider_name,
            "location": self.location,
            "outcome": self.outcome,
            "complications": self.complications,
            "notes": self.notes,
            "cost": float(self.cost) if self.cost else None,
            "insurance_covered": self.insurance_covered,
            "follow_up_required": self.follow_up_required,
            "follow_up_date": self.follow_up_date.isoformat() if self.follow_up_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class VitalSign(db.Model):
    __tablename__ = "vital_signs"
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patient_profiles.id"), nullable=False)
    measurement_date = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Vital measurements
    systolic_bp = db.Column(db.Integer)  # mmHg
    diastolic_bp = db.Column(db.Integer)  # mmHg
    heart_rate = db.Column(db.Integer)  # bpm
    temperature = db.Column(db.Float)  # Fahrenheit
    weight = db.Column(db.Float)  # lbs
    height = db.Column(db.Float)  # inches
    bmi = db.Column(db.Float)
    oxygen_saturation = db.Column(db.Float)  # %
    respiratory_rate = db.Column(db.Integer)  # breaths per minute
    
    # Metadata
    measured_by = db.Column(db.String(255))
    location = db.Column(db.String(255))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    patient = db.relationship("PatientProfile", backref="vital_signs")
    
    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "measurement_date": self.measurement_date.isoformat() if self.measurement_date else None,
            "systolic_bp": self.systolic_bp,
            "diastolic_bp": self.diastolic_bp,
            "heart_rate": self.heart_rate,
            "temperature": self.temperature,
            "weight": self.weight,
            "height": self.height,
            "bmi": self.bmi,
            "oxygen_saturation": self.oxygen_saturation,
            "respiratory_rate": self.respiratory_rate,
            "measured_by": self.measured_by,
            "location": self.location,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class HealthMetric(db.Model):
    __tablename__ = "health_metrics"
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patient_profiles.id"), nullable=False)
    metric_date = db.Column(db.Date, default=datetime.utcnow().date)
    
    # Calculated health scores
    overall_health_score = db.Column(db.Float)  # 0-100
    physical_health_score = db.Column(db.Float)  # 0-100
    mental_health_score = db.Column(db.Float)  # 0-100
    lifestyle_score = db.Column(db.Float)  # 0-100
    
    # Activity metrics
    steps_count = db.Column(db.Integer)
    active_minutes = db.Column(db.Integer)
    sleep_hours = db.Column(db.Float)
    water_intake = db.Column(db.Float)  # glasses
    
    # Health indicators
    stress_level = db.Column(db.Integer)  # 1-10
    energy_level = db.Column(db.Integer)  # 1-10
    pain_level = db.Column(db.Integer)  # 1-10
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    patient = db.relationship("PatientProfile", backref="health_metrics")
    
    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "metric_date": self.metric_date.isoformat() if self.metric_date else None,
            "overall_health_score": self.overall_health_score,
            "physical_health_score": self.physical_health_score,
            "mental_health_score": self.mental_health_score,
            "lifestyle_score": self.lifestyle_score,
            "steps_count": self.steps_count,
            "active_minutes": self.active_minutes,
            "sleep_hours": self.sleep_hours,
            "water_intake": self.water_intake,
            "stress_level": self.stress_level,
            "energy_level": self.energy_level,
            "pain_level": self.pain_level,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
