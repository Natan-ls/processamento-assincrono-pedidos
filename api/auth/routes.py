from flask import Blueprint, request, jsonify
from api.models.user import User
from extensions import db
from api.auth.service import generate_token
from api.models.pessoa import Pessoa
from api.auth.validators import is_valid_email, is_strong_password,  is_valid_phone, is_valid_address, is_valid_cpf
from sqlalchemy.exc import IntegrityError
import re
auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    nome = data.get("nome")
    cpf = data.get("cpf")
    endereco = data.get("endereco")
    telefone = data.get("telefone")

    if not all([email, password, nome, cpf, endereco, telefone]):
        return jsonify({"error": "Todos os campos são obrigatórios"}), 400

    email = email.strip().lower()
    nome = nome.strip()
    cpf = re.sub(r"\D", "", cpf)
    telefone = re.sub(r"\D", "", telefone)
    endereco = endereco.strip()

    #Funct para fazer a validação do formato do email - cpf - telefone e endereco inseridos no cadastro
    if not is_valid_email(email):
        return jsonify({"error": "Email inválido"}), 400

    if not is_valid_cpf(cpf):
        return jsonify({"error": "CPF Inválido"}),400

    if not is_valid_phone(telefone):
        return jsonify({"error": "Telefone inválido"}), 400

    if not is_valid_address(endereco):
        return jsonify({"error": "Endereço inválido"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Usuario já existe"}), 409

    if not is_strong_password(password):
        return jsonify({
            "error": (
                "A senha deve conter no mínimo 6 caracteres, "
                "uma letra maiúscula, uma letra minúscula, "
                "um número e um caractere especial"
            )
        }), 400

    try:
        # criandoa pessoa antes de criar o user
        pessoa = Pessoa(
            nome=nome,
            cpf=cpf,
            endereco=endereco,
            telefone=telefone
        )
        db.session.add(pessoa)
        db.session.flush()  # irá gerar um id sem commit

        # criaNdo o user 
        user = User(
            email=email,
            pessoa_id=pessoa.id,
            tipo_usuario="cliente"
        )
        user.set_password(password)
        db.session.add(user)
        db.session.commit()        
        return jsonify({"message": "Usuario criado com sucesso"}), 201
    except IntegrityError: # excesão p impedir q caso acconteça de ter 2 requests simultaneos aombos possam acabar sendo validados
        db.session.rollback()
        return jsonify({"error": "Email ou CPF já cadastrado"}), 409
    
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
    email = email.strip().lower()

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

