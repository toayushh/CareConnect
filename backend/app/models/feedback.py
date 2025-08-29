from datetime import datetime
from ..extensions import db


class Feedback(db.Model):
    __tablename__ = "feedback"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)
    source = db.Column(db.String(50), default="web")  # web, mobile, kiosk, api
    category = db.Column(db.String(50), default="general")  # ux, bug, compliment, suggestion
    message = db.Column(db.Text, nullable=False)
    rating = db.Column(db.Integer)  # optional 1..5
    # Map DB column 'metadata' to a safe attribute name
    extra = db.Column("metadata", db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref=db.backref("feedback", lazy=True))


