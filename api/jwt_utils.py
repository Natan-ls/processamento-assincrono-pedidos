import jwt
from functools import wraps
from flask import request, jsonify
from config import Config

def jwt_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return jsonify({"erro": "Token ausente"}), 401

        try:
            token = auth_header.split(" ")[1]
            payload = jwt.decode(
                token,
                Config.SECRET_KEY,
                algorithms=["HS256"]
            )
            request.user_id = payload["sub"]
        except Exception:
            return jsonify({"erro": "Token inválido ou expirado"}), 401

        return fn(*args, **kwargs)

    return wrapper
