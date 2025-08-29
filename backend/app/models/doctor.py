from ..extensions import db


class Doctor(db.Model):
    __tablename__ = "doctors"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True)
    specialty = db.Column(db.String(120), nullable=False)
    hospital = db.Column(db.String(255))
    languages = db.Column(db.String(255))  # comma-separated for MVP
    rating = db.Column(db.Float, default=0)
    bio = db.Column(db.Text)
    consultation_fee = db.Column(db.Integer, default=0)
    availability = db.Column(db.String(50))  # today/this-week/next-week (MVP)

    user = db.relationship("User", backref=db.backref("doctor_profile", uselist=False))
