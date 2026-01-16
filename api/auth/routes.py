from flask import Blueprint, request, jsonify
from api.models.user import User
from extensions import db
from api.auth.service import generate_token

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email e senha obrigatorios"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Usuario já existe"}), 409

    new_user = User(email=email)
    new_user.set_password(password)
    
    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "Usuario criado com sucesso"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Erro ao salvar usuario", "details": str(e)}), 500

@auth_bp.route("/login", methods=["POST"])
def login():
    if not request.is_json:
        return jsonify({"error": "Requisição deve ser JSON"}), 400

    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email e senha obrigatórios"}), 400

    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        return jsonify({"error": "Email ou senha incorretos"}), 401

    try:
        token = generate_token(user.id)
        return jsonify({"access_token": token}), 200

    except Exception as e:
        return jsonify({
            "error": "Erro ao gerar token",
            "details": str(e)
        }), 500

