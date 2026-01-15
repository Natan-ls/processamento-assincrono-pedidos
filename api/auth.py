import jwt
import bcrypt
import datetime
from flask import Blueprint, request, jsonify
from db import get_connection
from config import Config

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.json

    email = data.get("email")
    senha = data.get("senha")

    if not email or not senha:
        return jsonify({"erro": "Email e senha obrigatórios"}), 400

    senha_hash = bcrypt.hashpw(
        senha.encode(),
        bcrypt.gensalt()
    ).decode()

    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            INSERT INTO usuario (email, password_hash)
            VALUES (%s, %s)
            """,
            (email, senha_hash)
        )
        conn.commit()
    except Exception:
        conn.rollback()
        return jsonify({"erro": "Usuário já existe"}), 409
    finally:
        cur.close()
        conn.close()

    return jsonify({"mensagem": "Usuário criado com sucesso"}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json

    email = data.get("email")
    senha = data.get("senha")

    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        "SELECT id, password_hash FROM usuario WHERE email = %s",
        (email,)
    )
    user = cur.fetchone()

    cur.close()
    conn.close()

    if not user:
        return jsonify({"erro": "Credenciais inválidas"}), 401

    user_id, password_hash = user

    if not bcrypt.checkpw(senha.encode(), password_hash.encode()):
        return jsonify({"erro": "Credenciais inválidas"}), 401

    payload = {
        "sub": user_id,
        "exp": datetime.datetime.utcnow()
        + datetime.timedelta(seconds=Config.JWT_EXPIRATION_SECONDS)
    }

    token = jwt.encode(payload, Config.SECRET_KEY, algorithm="HS256")

    return jsonify({"token": token})
