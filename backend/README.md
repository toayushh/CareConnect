# LeapFrog Backend (Flask + PostgreSQL)

## Quick start (Docker)

1. Start services: `docker compose up --build`
2. API available at `http://localhost:5001/api` (docs at `/api/docs`)

Run DB verification inside container:

```bash
docker compose exec backend python manage_db.py
```

## Quick start (local Python)

- Python 3.11+
- Postgres running locally on `localhost:5432`

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export FLASK_ENV=development
export DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/leapfrog
python manage_db.py  # verifies connection and tables, creates missing in dev
python run.py        # starts app on :5001
```

## Endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/users/me`
- `GET /api/doctors` `POST /api/doctors`
- `GET /api/doctors/:id`
- `GET /api/appointments` `POST /api/appointments`

## Notes
- On startup, the app verifies DB connectivity and ensures required tables exist (auto-creates in development).
- Use JWT access token in `Authorization: Bearer <token>`.
