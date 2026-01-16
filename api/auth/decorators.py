from functools import wraps
from flask import request, jsonify, current_app
import jwt

def jwt_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):

        if request.method == "OPTIONS":
            return "", 200

        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return jsonify({"error": "Token ausente"}), 401

        try:
            token = auth_header.split(" ")[1]

            payload = jwt.decode(
                token,
                current_app.config["SECRET_KEY"],
                algorithms=["HS256"]
            )

            request.user_id = payload["sub"]

        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expirado"}), 401

        except jwt.InvalidTokenError:
            return jsonify({"error": "Token inválido"}), 401

        return f(*args, **kwargs)

    return decorated
