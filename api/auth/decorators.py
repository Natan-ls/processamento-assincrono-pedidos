from functools import wraps
from flask import request, jsonify, current_app
import jwt
from extensions import db
from api.models.user import User 
from datetime import datetime, timezone

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
            request.pessoa_id = payload.get("pessoa_id")

        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expirado"}), 401

        except jwt.InvalidTokenError:
            return jsonify({"error": "Token inválido"}), 401

        return f(*args, **kwargs)

    return decorated

def vip_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):

        # jwt_required PRECISA rodar antes
        user_id = getattr(request, "user_id", None)

        if not user_id:
            return jsonify({"error": "Usuário não autenticado"}), 401

        user = db.session.get(User, user_id)

        if not user:
            return jsonify({"error": "Usuário não encontrado"}), 404

        # Verifica se é VIP (regra central)
        if not user.vip_ativo():
            return jsonify({"error": "Usuário não é VIP"}), 403

        # (Opcional) Mensagem mais específica se quiser detalhar expiração
        if user.vip_until is not None:
            now = datetime.utcnow()
            if user.vip_until < now:
                return jsonify({
                    "error": "VIP expirado",
                    "vip_until": user.vip_until.isoformat()
                }), 403

        return f(*args, **kwargs)

    return decorated

