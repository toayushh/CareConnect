from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy


db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
limiter = Limiter(key_func=get_remote_address, default_limits=[])


def init_extensions(app):
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    # Configure default rate limits from config, if set
    limits = app.config.get("RATELIMIT_DEFAULT")
    if limits:
        limiter._default_limits = [limits] if isinstance(limits, str) else limits
    limiter.init_app(app)
