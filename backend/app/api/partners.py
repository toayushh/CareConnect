from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required

from ..extensions import db
from ..models.partner import Partner, PartnerApplication


ns = Namespace("partners", description="Partner recruitment operations")

partner_model = ns.model(
    "Partner",
    {
        "organization_name": fields.String(required=True),
        "contact_name": fields.String,
        "contact_email": fields.String,
        "contact_phone": fields.String,
        "status": fields.String(enum=["prospect", "active", "inactive", "declined"]),
        "metadata": fields.Raw,
    },
)

application_model = ns.model(
    "PartnerApplication",
    {
        "organization_name": fields.String(required=True),
        "submitted_by": fields.String,
        "email": fields.String,
        "phone": fields.String,
        "notes": fields.String,
        "stage": fields.String(enum=["new", "screening", "verified", "approved", "rejected"]),
        "partner_id": fields.Integer,
    },
)


@ns.route("/partners")
class PartnerList(Resource):
    def get(self):
        items = Partner.query.order_by(Partner.created_at.desc()).all()
        return [
            {
                "id": p.id,
                "organization_name": p.organization_name,
                "contact_name": p.contact_name,
                "contact_email": p.contact_email,
                "contact_phone": p.contact_phone,
                "status": p.status,
                "metadata": p.extra,
                "created_at": p.created_at.isoformat(),
            }
            for p in items
        ]

    @jwt_required()
    @ns.expect(partner_model, validate=True)
    def post(self):
        data = request.get_json()
        # Accept 'metadata' in payload and map to model attribute
        if "metadata" in data:
            data["extra"] = data.pop("metadata")
        partner = Partner(**data)
        db.session.add(partner)
        db.session.commit()
        return {"id": partner.id}, 201


@ns.route("/applications")
class PartnerApplicationList(Resource):
    def get(self):
        items = PartnerApplication.query.order_by(PartnerApplication.created_at.desc()).all()
        return [
            {
                "id": a.id,
                "partner_id": a.partner_id,
                "organization_name": a.organization_name,
                "submitted_by": a.submitted_by,
                "email": a.email,
                "phone": a.phone,
                "notes": a.notes,
                "stage": a.stage,
                "created_at": a.created_at.isoformat(),
            }
            for a in items
        ]

    @ns.expect(application_model, validate=True)
    def post(self):
        data = request.get_json()
        app = PartnerApplication(**data)
        db.session.add(app)
        db.session.commit()
        return {"id": app.id}, 201


