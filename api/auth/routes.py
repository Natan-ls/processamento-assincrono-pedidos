from flask import Blueprint, request, jsonify
from models.user import User
from extensions import db
from auth.service import generate_token

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Credenciais inválidas"}), 400

    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        return jsonify({"error": "Email ou senha incorretos"}), 401

    token = generate_token(user.id)

    return jsonify({
        "access_token": token
    }), 200
