import logging
from flask import current_app
from sqlalchemy import inspect, text
from .extensions import db

REQUIRED_TABLES = {
    "users",
    "doctors",
    "appointments",
    "patient_profiles",
    # New modules
    "partners",
    "partner_applications",
    "consents",
    "feedback",
    "workshops",
    "workshop_notes",
    # Progress tracking
    "symptom_entries",
    "mood_entries",
    "activity_entries",
    "clinical_assessments",
    "progress_goals",
    "treatment_plans",
    "leapfrog_suggestions",
    # Enhanced LeapFrog models
    "treatment_effectiveness",
    "intervention_history",
    "predictive_models",
    "patient_engagement",
}

# Minimal column evolution support for development environment
REQUIRED_COLUMNS = {
    "doctors": {
        "consultation_fee": "INTEGER DEFAULT 0",
        "availability": "VARCHAR(50)",
    },
    "appointments": {
        "appointment_type": "VARCHAR(20)",
        "reason": "TEXT",
    },
}


def _ensure_missing_columns(engine, table_name, required_columns, logger):
    inspector = inspect(engine)
    existing = {c['name'] for c in inspector.get_columns(table_name)}
    missing = [c for c in required_columns.keys() if c not in existing]
    if not missing:
        return
    logger.warning("%s: adding missing columns: %s", table_name, ", ".join(missing))
    with engine.begin() as conn:
        for col in missing:
            ddl = f"ALTER TABLE {table_name} ADD COLUMN {col} {required_columns[col]}"
            conn.execute(text(ddl))
            logger.info("%s: added column %s", table_name, col)


def verify_and_init_database() -> None:
    logger = logging.getLogger("leapfrog.db")
    engine = db.engine

    # Test connection
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Successfully connected to the database: %s", engine.url)
    except Exception as exc:
        logger.exception("Database connection failed: %s", exc)
        raise

    # Check tables
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())

    missing = REQUIRED_TABLES - existing_tables
    env = current_app.config.get("ENV", "development")

    if missing and env == "development":
        logger.warning("Missing tables detected: %s", ", ".join(sorted(missing)))
        logger.info("Environment is development. Creating missing tables via SQLAlchemy metadata...")
        db.create_all()
        # Re-check using a fresh inspector to avoid cached metadata
        inspector = inspect(engine)
        existing_tables = set(inspector.get_table_names())
        still_missing = REQUIRED_TABLES - existing_tables
        if still_missing:
            logger.error("Some tables are still missing after create_all: %s", ", ".join(sorted(still_missing)))
            raise RuntimeError("Database initialization incomplete")
        logger.info("Database tables verified/created successfully")
    elif missing:
        logger.error("Missing required tables (not in development): %s", ", ".join(sorted(missing)))
        raise RuntimeError("Required database tables are missing")
    else:
        logger.info("All required tables exist: %s", ", ".join(sorted(REQUIRED_TABLES)))

    # Ensure required columns exist (development only)
    if env == "development":
        for table, cols in REQUIRED_COLUMNS.items():
            if table in existing_tables:
                _ensure_missing_columns(engine, table, cols, logger)
