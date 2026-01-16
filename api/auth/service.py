import jwt
from datetime import datetime, timedelta
from flask import current_app

def generate_token(user_id: int) -> str:
    payload = {
        "sub": user_id,
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


def decode_token(token: str) -> int:
    try:
        payload = jwt.decode(
            token,
            Config.JWT_SECRET_KEY, 
            algorithms=["HS256"]
        )
        return int(payload["sub"])  # 

    except jwt.ExpiredSignatureError:
        raise Exception("Token expirado")

    except jwt.InvalidTokenError:
        raise Exception("Token inválido")
