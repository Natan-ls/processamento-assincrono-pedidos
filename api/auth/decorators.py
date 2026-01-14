from functools import wraps
from flask import request, jsonify
from auth.service import decode_token

def jwt_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return jsonify({"error": "Token não fornecido"}), 401

        try:
            token = auth_header.split(" ")[1]
            user_id = decode_token(token)

        except Exception as e:
            return jsonify({"error": str(e)}), 401

        request.user_id = user_id
        return fn(*args, **kwargs)

    return wrapper
