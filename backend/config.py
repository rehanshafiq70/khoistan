import os

class Config:
    # ── Auto-detect: PostgreSQL on Render, SQLite locally ──────────────────
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))

    DATABASE_URL = os.environ.get('DATABASE_URL', '')

    # Render gives postgres:// but SQLAlchemy needs postgresql://
    if DATABASE_URL.startswith('postgres://'):
        DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

    SQLALCHEMY_DATABASE_URI = DATABASE_URL or f"sqlite:///{os.path.join(BASE_DIR, 'transport.db')}"

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.environ.get('SECRET_KEY', 'kkg-transport-secret-2026')

    # Allow CORS from any origin (needed for Vercel frontend)
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*')
