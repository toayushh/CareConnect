import logging
import os
from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
from flask_jwt_extended.exceptions import JWTExtendedException, NoAuthorizationError, InvalidHeaderError, JWTDecodeError
from .config import get_config
from .extensions import init_extensions, db
from .api import api_bp
from .db_utils import verify_and_init_database


def create_app(config_name: str | None = None) -> Flask:
    app = Flask(__name__)
    app.config.from_object(get_config(config_name))

    # Basic logging setup if not configured by host
    if not app.logger.handlers:
        logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

    # Enable CORS for all routes
    CORS(app, resources={
        r"/*": {
            "origins": ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "*"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })

    # Add CORS preflight handler
    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            response = make_response()
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
            response.headers.add("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
            return response

    init_extensions(app)

    # Import models early to register metadata for create_all
    from . import models  # noqa: F401

    app.register_blueprint(api_bp, url_prefix="/api")
    
    # Register static routes for favicon, etc.
    from .static_routes import static_bp
    app.register_blueprint(static_bp)

    # Add JWT error handlers to Flask app as backup
    @app.errorhandler(NoAuthorizationError)
    def handle_no_authorization(e):
        return jsonify({"message": "Missing Authorization Header"}), 401

    @app.errorhandler(JWTDecodeError)
    def handle_jwt_decode_error(e):
        return jsonify({"message": "Invalid token format"}), 401

    @app.errorhandler(InvalidHeaderError)
    def handle_invalid_header(e):
        return jsonify({"message": "Invalid Authorization Header"}), 401

    @app.errorhandler(JWTExtendedException)
    def handle_jwt_exceptions(e):
        return jsonify({"message": str(e)}), 401

    with app.app_context():
        verify_and_init_database()

    return app
