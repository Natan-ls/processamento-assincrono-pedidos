import jwt
from datetime import datetime, timedelta
from flask import current_app

def generate_token(user) -> str:
    payload = {
        "sub": user.id,
        "pessoa_id": user.pessoa_id,
        "vip": user.vip_ativo(), #VIP NO TOKEN
        "exp": datetime.utcnow() + timedelta(
            seconds=current_app.config["JWT_EXPIRATION_SECONDS"]
        )
    }

    token = jwt.encode(
        payload,
        current_app.config["SECRET_KEY"],
        algorithm="HS256"
    )

    return token
