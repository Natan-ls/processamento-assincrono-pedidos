from flask import Blueprint, request, jsonify
from api.models.user import User
from extensions import db
from api.auth.service import generate_token
from api.models.pessoa import Pessoa
from api.auth.validators import is_valid_email, is_strong_password,  is_valid_phone, is_valid_address, is_valid_cpf
from sqlalchemy.exc import IntegrityError
import re
from werkzeug.utils import secure_filename
import os
import uuid
from api.auth.uploads import UPLOAD_FOLDER, allowed_file
from api.auth.decorators import jwt_required
from api.models.estabelecimento import Estabelecimento
from api.auth.validators import is_valid_cnpj
from api.models.enums import CategoriaEstabelecimento

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

# ============= FUNÇÕES DE REGISTRO ============= # 

## --- Regsitro De Cliente --- 
@auth_bp.route("/register/cliente", methods=["POST"])
def register_cliente():
    data = request.form
    file = request.files.get("foto")

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

    #Fazer UPLOAD da foto (ñ é obrigatório)
    if file and allowed_file(file.filename):
        ext = file.filename.rsplit(".", 1)[1].lower()
        filename = f"{uuid.uuid4()}.{ext}"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)

        foto_url = f"/{UPLOAD_FOLDER}/{filename}"

    try:
        # criandoa pessoa antes de criar o user
        pessoa = Pessoa(
            nome=nome,
            cpf=cpf,
            endereco=endereco,
            telefone=telefone,
            url_foto_perfil=foto_url
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

## --- Regsitro De Empresa --- 
@auth_bp.route("/register/empresa", methods=["POST"])
def register_empresa():
    data = request.form
    file_logo = request.files.get("logo")

    # ====== Dados do responsável ======
    nome = data.get("nome")
    cpf = data.get("cpf")
    telefone = data.get("telefone")

    # ====== login ======
    email = data.get("email")
    password = data.get("password")

    # ====== Dados do estabelecimento ====== 
    nome_fantasia = data.get("nome_fantasia")
    cnpj = data.get("cnpj")
    categoria = data.get("categoria")
    endereco_empresa = data.get("endereco_empresa")

    # ====== Campos obrigatórios no Registro ======
    if not all([nome, cpf, telefone, email, password, nome_fantasia, cnpj, endereco_empresa, categoria]):
        return jsonify({"error": "Campos obrigatórios faltando"}), 400
    if not file_logo:
        return jsonify({"error": "Logo é obrigatória"}), 400
    
    if not allowed_file(file_logo.filename):
        return jsonify({"error": "Formato de logo inválido"}), 400

    email = email.strip().lower()
    nome_fantasia = nome_fantasia.strip()
    cnpj = re.sub(r"\D", "", cnpj)
    cpf = re.sub(r"\D", "", cpf)
    telefone = re.sub(r"\D", "", telefone)

    # ====== Verificaçãoes Validações ======
    if not is_valid_email(email):
        return jsonify({"error": "Email inválido"}), 400

    if not is_strong_password(password):
        return jsonify({"error": "Senha fraca"}), 400

    if not is_valid_cnpj(cnpj):
        return jsonify({"error": "CNPJ inválido"}), 400

    if not is_valid_cpf(cpf):
        return jsonify({"error": "CPF Inválido"}),400

    if not is_valid_phone(telefone):
        return jsonify({"error": "Telefone inválido"}), 400

    if not is_valid_address(endereco_empresa):
        return jsonify({"error": "Endereço inválido"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Usuário já existe"}), 409

    if Estabelecimento.query.filter_by(cnpj=cnpj).first():
        return jsonify({"error": "CNPJ já cadastrado"}), 409

    # ====== Validação da Categoria com o enums.py ======
    try:
        categoria_enum = CategoriaEstabelecimento(categoria)
    except ValueError:
        return jsonify({
            "error": "Categoria inválida",
            "categorias_validas": [c.value for c in CategoriaEstabelecimento]
        }), 400

    #logo_url = None

    #if file_logo and allowed_file(file_logo.filename):
    ext = file_logo.filename.rsplit(".", 1)[1].lower()
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join("static/uploads/logos", filename)

    os.makedirs("static/uploads/logos", exist_ok=True)

    file_logo.save(filepath)

    logo_url = f"/static/uploads/logos/{filename}"

    # ====== Criando a Pessoa Responsavel + Usuario + Estabelecimento ======
    try:
        #Campo de Pessoa responsável
        pessoa = Pessoa(
            nome=nome,
            cpf=cpf,
            telefone=telefone
        )
        db.session.add(pessoa)
        db.session.flush()

        # Usuario do Tipo = empresa
        user = User(
            email=email,
            pessoa_id=pessoa.id,
            tipo_usuario="empresa"
        )
        user.set_password(password)
        db.session.add(user)

        #Criando o Estabelecimento
        estabelecimento = Estabelecimento(
            nome_fantasia=nome_fantasia,
            cnpj=cnpj,
            categoria=categoria_enum,
            endereco=endereco_empresa,
            url_logo=logo_url,
            pessoa_id=pessoa.id
        )

        db.session.add(estabelecimento)

        db.session.commit()

        return jsonify({"message": "Empresa cadastrada com Sucesso!"}), 201

    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "CNPJ já cadastrado"}), 409

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "error": "Erro ao salvar empresa",
            "details": str(e)
        }), 500

# ============= FUNÇÕES DE LOGIN ============= # 
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
        token = generate_token(user)
        return jsonify({"access_token": token}), 200

    except Exception as e:
        return jsonify({
            "error": "Erro ao gerar token",
            "details": str(e)
        }), 500


# ============= FUNÇÕES DE GET PERFIL do USUARIO(Cliente ou Empresa) ============= # 
@auth_bp.route("/me", methods=["GET"])
@jwt_required
def me():
    user_id = request.user_id

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Usuário não encontrado"}), 404
    pessoa = user.pessoa
    if not pessoa:
        return jsonify({"error":"Pessoa Não Encontrada!"})

    # ===== Base do perfil (vale para todos) =====
    perfil = {
        "id": user.id,
        "tipo_usuario": user.tipo_usuario,
        "nome": pessoa.nome,
        "email": user.email,
        "telefone": pessoa.telefone,
        "endereco": pessoa.endereco,
        "url_foto": pessoa.url_foto_perfil
    }

    # ===== se for uma empresa, adiciona os dados do estabelecimento se ñ só os dados do cliente normal
    if user.tipo_usuario == "empresa":

        estabelecimento = Estabelecimento.query.filter_by(
            pessoa_id=pessoa.id
        ).first()

        if not estabelecimento:
            return jsonify({"error": "Estabelecimento não encontrado"}), 404
        perfil["empresa"] = {
            "id": estabelecimento.id,
            "nome_fantasia": estabelecimento.nome_fantasia,
            "cnpj": estabelecimento.cnpj,
            "categoria": estabelecimento.categoria,
            "endereco_empresa": estabelecimento.endereco,
            "url_logo": estabelecimento.url_logo,
            "url_banner": estabelecimento.url_banner
        }

    return jsonify(perfil), 200

# ============= FUNÇÕES DE ALTERAR DADOS NO PERFIL do USUARIO(Cliente ou Empresa) ============= # 
@auth_bp.route("/me", methods=["PUT"])
@jwt_required
def update_me():
    user_id = request.user_id
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "Usuário não encontrado"}), 404

    pessoa = user.pessoa
    if not pessoa:
        return jsonify({"error": "Pessoa não encontrada"}), 404

    data = request.form
    file_foto = request.files.get("foto")

    # ====== Atualizar campos da Pessoa seja cliente ou empresa ======
    if "nome" in data:
        pessoa.nome = data.get("nome")

    if "telefone" in data:
        telefone = re.sub(r"\D", "", data.get("telefone"))
        if not is_valid_phone(telefone):
            return jsonify({"error": "Telefone inválido"}), 400
        pessoa.telefone = telefone

    if "endereco" in data:
        endereco = data.get("endereco").strip()
        if not is_valid_address(endereco):
            return jsonify({"error": "Endereço inválido"}), 400
        pessoa.endereco = endereco

    # ====== Att foto do USER ======
    if file_foto and allowed_file(file_foto.filename):

        ext = file_foto.filename.rsplit(".", 1)[1].lower()
        filename = f"{uuid.uuid4()}.{ext}"
        filepath = os.path.join("static/uploads/avatars", filename)

        os.makedirs("static/uploads/avatars", exist_ok=True)

        file_foto.save(filepath)

        pessoa.url_foto_perfil = f"/static/uploads/avatars/{filename}"

    # ====== Se o USUER for do TIPO == "EMPRESA", atualizar Estabelecimento ======
    if user.tipo_usuario == "empresa":

        estabelecimento = Estabelecimento.query.filter_by(
            pessoa_id=pessoa.id
        ).first()

        if not estabelecimento:
            return jsonify({"error": "Estabelecimento não encontrado"}), 404

        if "nome_fantasia" in data:
            estabelecimento.nome_fantasia = data.get("nome_fantasia")

        if "endereco_empresa" in data:
            estabelecimento.endereco = data.get("endereco_empresa")
            if not is_valid_address(estabelecimento.endereco):
                return jsonify({"error": "Endereço inválido"}), 400

        if "categoria" in data:
            categoria = data.get("categoria")

            try:
                categoria_enum = CategoriaEstabelecimento(categoria)
                estabelecimento.categoria = categoria_enum.value
            except ValueError:
                return jsonify({
                    "error": "Categoria inválida",
                    "categorias_validas": [c.value for c in CategoriaEstabelecimento]
                }), 400

    # ====== Commit final para att o perfil seja CLIENTE ou EMEPRESA ======
    try:
        db.session.commit()
        return jsonify({"message": "Perfil atualizado com sucesso!"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "error": "Erro ao atualizar perfil",
            "details": str(e)
        }), 500

