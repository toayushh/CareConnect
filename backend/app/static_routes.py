from flask import Blueprint, send_from_directory, abort
import os

static_bp = Blueprint("static", __name__)

@static_bp.route("/favicon.ico")
def favicon():
    """Serve favicon to prevent 404 errors"""
    # Return a simple 204 No Content response for favicon requests
    # This prevents 404 errors in the browser console
    return "", 204

@static_bp.route("/robots.txt")
def robots():
    """Basic robots.txt"""
    return "User-agent: *\nDisallow:", 200, {"Content-Type": "text/plain"}

@static_bp.route("/health")
def health_check():
    """Simple health check endpoint"""
    return {"status": "healthy", "service": "LeapFrog Backend"}, 200
