from datetime import date
from ..extensions import db


class PatientProfile(db.Model):
    __tablename__ = "patient_profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True)
    phone = db.Column(db.String(50))
    date_of_birth = db.Column(db.Date)
    emergency_contact = db.Column(db.String(100))
    insurance_provider = db.Column(db.String(120))  # optional

    user = db.relationship("User", backref=db.backref("patient_profile", uselist=False))
