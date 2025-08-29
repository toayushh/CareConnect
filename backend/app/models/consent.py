from datetime import datetime
from ..extensions import db


class ConsentRecord(db.Model):
    __tablename__ = "consents"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    scope = db.Column(db.String(100), nullable=False)  # e.g., marketing, research, terms
    version = db.Column(db.String(40), nullable=False)
    consented = db.Column(db.Boolean, default=True)
    consented_at = db.Column(db.DateTime, default=datetime.utcnow)
    revoked_at = db.Column(db.DateTime)
    evidence = db.Column(db.JSON)  # ip, user_agent, locale, signature ref, etc.

    user = db.relationship("User", backref=db.backref("consents", lazy=True))


