from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..extensions import db
from ..models.consent import ConsentRecord


ns = Namespace("consents", description="Digital consent management")

consent_model = ns.model(
    "ConsentRecord",
    {
        "scope": fields.String(required=True, description="e.g., marketing, research, terms"),
        "version": fields.String(required=True),
        "consented": fields.Boolean(default=True),
        "evidence": fields.Raw(description="client evidence like ip, userAgent, locale"),
    },
)


@ns.route("")
class ConsentList(Resource):
    @jwt_required()
    def get(self):
        user_id = int(get_jwt_identity())
        items = ConsentRecord.query.filter_by(user_id=user_id).order_by(ConsentRecord.consented_at.desc()).all()
        return [
            {
                "id": c.id,
                "scope": c.scope,
                "version": c.version,
                "consented": c.consented,
                "consented_at": c.consented_at.isoformat() if c.consented_at else None,
                "revoked_at": c.revoked_at.isoformat() if c.revoked_at else None,
                "evidence": c.evidence,
            }
            for c in items
        ]

    @jwt_required()
    @ns.expect(consent_model, validate=True)
    def post(self):
        user_id = int(get_jwt_identity())
        data = request.get_json()
        record = ConsentRecord(user_id=user_id, **data)
        db.session.add(record)
        db.session.commit()
        return {"id": record.id}, 201


@ns.route("/<int:consent_id>/revoke")
class ConsentRevoke(Resource):
    @jwt_required()
    def post(self, consent_id: int):
        record = ConsentRecord.query.get_or_404(consent_id)
        record.consented = False
        from datetime import datetime as _dt
        record.revoked_at = _dt.utcnow()
        db.session.commit()
        return {"id": record.id, "revoked_at": record.revoked_at.isoformat()}


