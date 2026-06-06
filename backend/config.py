import os

class Config:
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))

    # ── Get DATABASE_URL from environment ──────────────────────────────────
    _db_url = os.environ.get('DATABASE_URL', '').strip()

    # Fix Render's postgres:// → postgresql://
    if _db_url.startswith('postgres://'):
        _db_url = _db_url.replace('postgres://', 'postgresql://', 1)

    # Use PostgreSQL if available, else fall back to SQLite
    SQLALCHEMY_DATABASE_URI = _db_url if _db_url.startswith(('postgresql://', 'mysql://')) \
        else f"sqlite:///{os.path.join(BASE_DIR, 'transport.db')}"

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.environ.get('SECRET_KEY', 'khoistan2026secret')
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*')
