from datetime import datetime
from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..extensions import db
from ..models.workshop import Workshop, WorkshopNote


ns = Namespace("workshops", description="Workshop scheduling and documentation")

workshop_model = ns.model(
    "Workshop",
    {
        "title": fields.String(required=True),
        "description": fields.String,
        "start_time": fields.String(required=True, description="ISO datetime"),
        "end_time": fields.String(required=True, description="ISO datetime"),
        "location": fields.String,
        "capacity": fields.Integer,
    },
)

note_model = ns.model(
    "WorkshopNote",
    {
        "content": fields.String(required=True),
    },
)


@ns.route("")
class WorkshopList(Resource):
    def get(self):
        items = Workshop.query.order_by(Workshop.start_time.desc()).all()
        return [
            {
                "id": w.id,
                "title": w.title,
                "description": w.description,
                "start_time": w.start_time.isoformat(),
                "end_time": w.end_time.isoformat(),
                "location": w.location,
                "capacity": w.capacity,
            }
            for w in items
        ]

    @jwt_required()
    @ns.expect(workshop_model, validate=True)
    def post(self):
        data = request.get_json()
        try:
            start = datetime.fromisoformat(data["start_time"])
            end = datetime.fromisoformat(data["end_time"])
        except Exception:
            return {"message": "Invalid datetime format"}, 400
        item = Workshop(
            title=data["title"],
            description=data.get("description"),
            start_time=start,
            end_time=end,
            location=data.get("location"),
            capacity=data.get("capacity"),
            created_by=get_jwt_identity(),
        )
        db.session.add(item)
        db.session.commit()
        return {"id": item.id}, 201


@ns.route("/<int:workshop_id>/notes")
class WorkshopNotes(Resource):
    def get(self, workshop_id: int):
        notes = WorkshopNote.query.filter_by(workshop_id=workshop_id).order_by(WorkshopNote.created_at.desc()).all()
        return [
            {"id": n.id, "content": n.content, "created_at": n.created_at.isoformat(), "author_id": n.author_id}
            for n in notes
        ]

    @jwt_required()
    @ns.expect(note_model, validate=True)
    def post(self, workshop_id: int):
        data = request.get_json()
        note = WorkshopNote(workshop_id=workshop_id, content=data["content"], author_id=get_jwt_identity())
        db.session.add(note)
        db.session.commit()
        return {"id": note.id}, 201


