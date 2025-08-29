from datetime import datetime
from ..extensions import db


class Partner(db.Model):
    __tablename__ = "partners"

    id = db.Column(db.Integer, primary_key=True)
    organization_name = db.Column(db.String(255), nullable=False, index=True)
    contact_name = db.Column(db.String(120))
    contact_email = db.Column(db.String(255))
    contact_phone = db.Column(db.String(50))
    status = db.Column(db.String(50), default="prospect")  # prospect, active, inactive, declined
    # Use a safe Python attribute name, but keep the database column named 'metadata'
    extra = db.Column("metadata", db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class PartnerApplication(db.Model):
    __tablename__ = "partner_applications"

    id = db.Column(db.Integer, primary_key=True)
    partner_id = db.Column(db.Integer, db.ForeignKey("partners.id"), nullable=True)
    organization_name = db.Column(db.String(255), nullable=False)
    submitted_by = db.Column(db.String(120))
    email = db.Column(db.String(255))
    phone = db.Column(db.String(50))
    notes = db.Column(db.Text)
    stage = db.Column(db.String(50), default="new")  # new, screening, verified, approved, rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    partner = db.relationship("Partner", backref=db.backref("applications", lazy=True))


