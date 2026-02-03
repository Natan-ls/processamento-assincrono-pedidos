import os

class Config:
    SECRET_KEY = os.getenv("JWT_SECRET", "dev_secret_key")
    JWT_EXPIRATION_SECONDS = 3600

    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "postgresql://pedidos_user:pedidos_passwd@postgres_db:5432/pedidos_db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_size": 10,
        "max_overflow": 20,
        "pool_timeout": 30,
        "pool_recycle": 1800,
    }
  