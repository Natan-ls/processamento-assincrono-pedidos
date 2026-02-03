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
from api.models.endereco import Endereco

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")
#auth_bp = Blueprint("auth", __name__, url_prefix="/auth/users/vip")  #users/vip adicionado


# ================== FUNÇÕES AUXILIARES ================== #
def criar_endereco(data, prefixo=None):
    def campo(nome):
        return data.get(f"{prefixo}_{nome}") if prefixo else data.get(nome)

    return Endereco(
        estado=campo("estado"),
        cidade=campo("cidade"),
        bairro=campo("bairro"),
        rua=campo("rua"),
        numero=campo("numero"),
        complemento=campo("complemento"),
        cep=campo("cep")
    )

# ============= FUNÇÕES DE REGISTRO ============= # 
## --- Regsitro De Cliente --- 
@auth_bp.route("/register/cliente", methods=["POST"])
def register_cliente():
    """
    Registra um novo cliente (Pessoa Física)
    ---
    tags:
      - Autenticação
    consumes:
      - multipart/form-data
    parameters:
      - name: nome
        in: formData
        type: string
        required: true
      - name: email
        in: formData
        type: string
        required: true
      - name: password
        in: formData
        type: string
        required: true
        format: password
      - name: cpf
        in: formData
        type: string
        required: true
      - name: telefone
        in: formData
        type: string
        required: true
      - name: foto
        in: formData
        type: file
        description: Foto de perfil do usuário
      # Campos de Endereço
      - name: rua
        in: formData
        type: string
      - name: numero
        in: formData
        type: string
      - name: bairro
        in: formData
        type: string
      - name: cidade
        in: formData
        type: string
      - name: estado
        in: formData
        type: string
      - name: cep
        in: formData
        type: string
    responses:
      201:
        description: Usuário criado com sucesso
      400:
        description: Erro de validação nos dados
      409:
        description: Usuário já existe
    """
    data = request.form
    file = request.files.get("foto")

    email = data.get("email")
    password = data.get("password")
    nome = data.get("nome")
    cpf = data.get("cpf")
    #endereco = data.get("endereco")
    telefone = data.get("telefone")

    if not all([email, password, nome, cpf, telefone]):
         return jsonify({"error": "Todos os campos são obrigatórios"}), 400
    
    email = email.strip().lower()
    nome = nome.strip()
    cpf = re.sub(r"\D", "", cpf)
    telefone = re.sub(r"\D", "", telefone)
    #endereco = endereco.strip()

    #Funct para fazer a validação do formato do email - cpf - telefone e endereco inseridos no cadastro
    if not is_valid_email(email):
        return jsonify({"error": "Email inválido"}), 400

    if not is_valid_cpf(cpf):
        return jsonify({"error": "CPF Inválido"}),400

    if not is_valid_phone(telefone):
        return jsonify({"error": "Telefone inválido"}), 400

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
    foto_url = None
    if file and allowed_file(file.filename):
        ext = file.filename.rsplit(".", 1)[1].lower()
        filename = f"{uuid.uuid4()}.{ext}"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)

        foto_url = f"/{UPLOAD_FOLDER}/{filename}"

    try:
        endereco = criar_endereco(data)
        db.session.add(endereco)
        db.session.flush()
        # criandoa pessoa antes de criar o user
        pessoa = Pessoa(
            nome=nome,
            cpf=cpf,
            endereco=endereco,
            telefone=telefone,
            url_foto_perfil=foto_url,
            endereco_id=endereco.id
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
        return jsonify({"message": "Usuario Criado com Sucesso"}), 201
    except IntegrityError: # excesão p impedir q caso acconteça de ter 2 requests simultaneos aombos possam acabar sendo validados
        db.session.rollback()
        return jsonify({"error": "Email ou CPF já cadastrado"}), 409
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Erro ao salvar usuario", "details": str(e)}), 500

## --- Regsitro De Empresa --- 
@auth_bp.route("/register/empresa", methods=["POST"])
def register_empresa():
    """
    Registra uma nova Empresa e seu Responsável
    ---
    tags:
      - Autenticação
    consumes:
      - multipart/form-data
    parameters:
      # Dados do Responsável
      - name: nome
        in: formData
        description: Nome do responsável
        required: true
        type: string
      - name: cpf
        in: formData
        required: true
        type: string
      - name: telefone
        in: formData
        required: true
        type: string
      
      # Login
      - name: email
        in: formData
        required: true
        type: string
      - name: password
        in: formData
        required: true
        type: string
        format: password

      # Dados da Empresa
      - name: nome_fantasia
        in: formData
        required: true
        type: string
      - name: cnpj
        in: formData
        required: true
        type: string
      - name: categoria
        in: formData
        required: true
        type: string
        description: Ex Lanches, Bebidas, etc.
      - name: logo
        in: formData
        type: file
        required: true
        description: Logo da empresa (Obrigatório)

      # Endereço do Responsável (Prefixo resp_)
      - name: resp_rua
        in: formData
        type: string
      - name: resp_cidade
        in: formData
        type: string
      - name: resp_estado
        in: formData
        type: string
      - name: resp_cep
        in: formData
        type: string
      
      # Endereço da Empresa (Prefixo emp_)
      - name: emp_rua
        in: formData
        type: string
      - name: emp_cidade
        in: formData
        type: string
      - name: emp_estado
        in: formData
        type: string
      - name: emp_cep
        in: formData
        type: string
    responses:
      201:
        description: Empresa cadastrada com sucesso
      400:
        description: Dados inválidos ou faltando logo
      409:
        description: CNPJ, CPF ou Email já cadastrados
    """    

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
    if not all([nome, cpf, telefone, email, password, nome_fantasia, cnpj, categoria]):
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

    # ====== Verificações Validações ======
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

    #if not is_valid_address(endereco_empresa):
    #    return jsonify({"error": "Endereço inválido"}), 400    

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

    # ====== Upload da logo ======
    ext = file_logo.filename.rsplit(".", 1)[1].lower()
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join("static/uploads/logos", filename)
    os.makedirs("static/uploads/logos", exist_ok=True)
    file_logo.save(filepath)
    logo_url = f"/static/uploads/logos/{filename}"

    # ====== Criando a Pessoa Responsavel + Usuario + Estabelecimento ======
    try:
        endereco_pessoa = criar_endereco(data, "resp")
        endereco_empresa = criar_endereco(data, "emp")
        db.session.add(endereco_pessoa)
        db.session.add(endereco_empresa)
        db.session.flush()

        # Criar Pessoa responsável com endereço
        pessoa = Pessoa(
            nome=nome,
            cpf=cpf,
            telefone=telefone,
            endereco_id=endereco_pessoa.id
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

        # Criando o Estabelecimento com seu próprio endereço
        estabelecimento = Estabelecimento(
            nome_fantasia=nome_fantasia,
            cnpj=cnpj,
            categoria=categoria_enum,
            endereco_id=endereco_empresa.id,
            url_logo=logo_url,
            pessoa_id=pessoa.id
        )

        db.session.add(estabelecimento)
        db.session.commit()

        return jsonify({"message": "Empresa cadastrada com Sucesso!"}), 201

    except IntegrityError as e:
        db.session.rollback()
        # Verifica se é erro de CNPJ duplicado
        if "cnpj" in str(e).lower():
            return jsonify({"error": "CNPJ já cadastrado"}), 409
        elif "cpf" in str(e).lower():
            return jsonify({"error": "CPF já cadastrado"}), 409
        elif "email" in str(e).lower():
            return jsonify({"error": "Email já cadastrado"}), 409
        else:
            return jsonify({"error": "Erro de integridade no banco de dados"}), 409

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "error": "Erro ao salvar empresa",
            "details": str(e)
        }), 500

# ============= FUNÇÕES DE LOGIN ============= # 
@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Realiza o login do usuário (Cliente ou Empresa)
    ---
    tags:
      - Autenticação
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - email
            - password
          properties:
            email:
              type: string
              example: usuario@email.com
            password:
              type: string
              example: Senha123@
    responses:
      200:
        description: Login realizado com sucesso
        schema:
          type: object
          properties:
            access_token:
              type: string
            user:
              type: object
              properties:
                id:
                  type: integer
                tipo_usuario:
                  type: string
      401:
        description: Credenciais inválidas
    """    
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

        empresa_configurada = True
        if user.tipo_usuario == "empresa":
            estabelecimento = Estabelecimento.query.filter_by(
                user_id=user.id
            ).first()

            # segurança extra
            empresa_configurada = bool(estabelecimento and estabelecimento.configurado)


        return jsonify({
            "access_token": token,
            "user": {
                "id": user.id,
                "tipo_usuario": user.tipo_usuario,
                "empresa_configurada": empresa_configurada,
                "is_vip": user.vip_ativo()            
            }
        }), 200
    except Exception as e:
        return jsonify({
            "error": "Erro ao gerar token",
            "details": str(e)
        }), 500


# ============= FUNÇÕES DE GET PERFIL do USUARIO(Cliente ou Empresa) ============= # 
@auth_bp.route("/me", methods=["GET"])
@jwt_required
def me():
    """
    Retorna os dados do perfil do usuário logado
    ---
    tags:
      - Perfil
    security:
      - Bearer: []
    responses:
      200:
        description: Dados do perfil recuperados com sucesso
        schema:
          type: object
          properties:
            id:
              type: integer
            nome:
              type: string
            email:
              type: string
            tipo_usuario:
              type: string
            url_foto:
              type: string
            empresa:
              type: object
              description: Retornado apenas se tipo_usuario for 'empresa'
      404:
        description: Usuário não encontrado
    """
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
        "endereco": pessoa.endereco.to_dict() if pessoa.endereco else None,
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
            "categoria": estabelecimento.categoria.value if estabelecimento.categoria else None,
            "endereco_empresa": estabelecimento.endereco.to_dict() if estabelecimento.endereco else None,
            "url_logo": estabelecimento.url_logo,
            "url_banner": estabelecimento.url_banner
        }
    return jsonify(perfil), 200

# ============= FUNÇÕES DE ALTERAR DADOS NO PERFIL do USUARIO(Cliente ou Empresa) ============= # 
@auth_bp.route("/me", methods=["PUT"])
@jwt_required
def update_me():
    """
    Atualiza dados do perfil do usuário
    ---
    tags:
      - Perfil
    security:
      - Bearer: []
    consumes:
      - multipart/form-data
    parameters:
      - name: email
        in: formData
        type: string
        required: false
      - name: telefone
        in: formData
        type: string
        required: false
      - name: foto
        in: formData
        type: file
        description: Nova foto de perfil (Cliente)
      
      # Dados de Endereço (Pessoa/Cliente)
      - name: rua
        in: formData
        type: string
      - name: cidade
        in: formData
        type: string
      
      # Campos específicos de Empresa
      - name: nome_fantasia
        in: formData
        type: string
        description: Apenas para usuários do tipo empresa
      - name: logo
        in: formData
        type: file
        description: Nova logo (Apenas empresa)
      
      # Endereço Empresa (prefixo emp_)
      - name: emp_rua
        in: formData
        type: string
      - name: emp_cidade
        in: formData
        type: string
    responses:
      200:
        description: Perfil atualizado com sucesso
      403:
        description: Tentativa de alterar campo bloqueado (CPF, CNPJ)
      409:
        description: Email já em uso
    """
    user_id = request.user_id
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "Usuário não encontrado"}), 404

    pessoa = user.pessoa
    if not pessoa:
        return jsonify({"error": "Pessoa não encontrada"}), 404

    data = request.form
    file_foto = request.files.get("foto")
    file_logo = request.files.get("logo")

    # ====== Campos Bloqueados para Atutalização ======
    campos_bloqueados = ["cpf", "cnpj", "nome"]

    for campo in campos_bloqueados:
        if campo in data:
            return jsonify({
                "error": f"O campo '{campo}' não pode ser alterado."
            }), 403    
    
    # Campos PERMITIDOS p/ TDS Tipo de USER(Cliente e Empresa)
    # ====== Atualizar campos da Pessoa seja cliente ou empresa ======
    # EMAIL
    if "email" in data:
        email = data.get("email").strip().lower()

        if not is_valid_email(email):
            return jsonify({"error": "Email inválido"}), 400

        email_existente = User.query.filter(
            User.email == email,
            User.id != user.id
        ).first()

        if email_existente:
            return jsonify({"error": "Email já está em uso"}), 409

        user.email = email    

    #TELEFONE
    if "telefone" in data:
        telefone = re.sub(r"\D", "", data.get("telefone"))
        if not is_valid_phone(telefone):
            return jsonify({"error": "Telefone inválido"}), 400
        pessoa.telefone = telefone

    #ENDERECO(Cliente)
    endereco_pessoa = pessoa.endereco
    if not endereco_pessoa:
        # Se não existir, cria um novo
        endereco_pessoa = Endereco()
        pessoa.endereco = endereco_pessoa

    campos_endereco_pessoa = ["estado", "cidade", "bairro", "rua", "numero", "complemento", "cep"]
    for campo in campos_endereco_pessoa:
        if campo in data:
            setattr(endereco_pessoa, campo, data.get(campo))

    # ====== Att foto do USER ======
    if file_foto and allowed_file(file_foto.filename):

        ext = file_foto.filename.rsplit(".", 1)[1].lower()
        filename = f"{uuid.uuid4()}.{ext}"
        folder = "static/uploads/perfis"
        os.makedirs(folder, exist_ok=True)
        filepath = os.path.join(folder, filename)
        file_foto.save(filepath)
        pessoa.url_foto_perfil = f"/{folder}/{filename}"

    # ================== TIPO_USUARIO == "Empresa" ==================
    # ====== Se o USUER for do TIPO == "EMPRESA", atualizar Estabelecimento ======
    if user.tipo_usuario == "empresa":

        estabelecimento = Estabelecimento.query.filter_by(
            pessoa_id=pessoa.id
        ).first()

        if not estabelecimento:
            return jsonify({"error": "Estabelecimento não encontrado"}), 404

        #NOME_FANTASIA
        if "nome_fantasia" in data:
            estabelecimento.nome_fantasia = data.get("nome_fantasia")

        #ENDERECO_EMPRESA
        # Atualizar endereço da empresa (campos separados)
        endereco_empresa = estabelecimento.endereco
        if not endereco_empresa:
            endereco_empresa = Endereco()
            estabelecimento.endereco = endereco_empresa

        # Mapeamento dos campos do formulário para os campos do endereço da empresa
        mapeamento_empresa = {
            "emp_estado": "estado",
            "emp_cidade": "cidade",
            "emp_bairro": "bairro",
            "emp_rua": "rua",
            "emp_numero": "numero",
            "emp_complemento": "complemento",
            "emp_cep": "cep"
        }

        for campo_form, campo_endereco in mapeamento_empresa.items():
            if campo_form in data:
                setattr(endereco_empresa, campo_endereco, data.get(campo_form))

        #CATEGORIA
        if "categoria" in data:
            #categoria = data.get("categoria")
            try:
                categoria_enum = CategoriaEstabelecimento(data.get("categoria"))
                estabelecimento.categoria = categoria_enum.value
            except ValueError:
                return jsonify({
                    "error": "Categoria inválida",
                    "categorias_validas": [c.value for c in CategoriaEstabelecimento]
                }), 400

        # Atualizar logo da empresa
        if file_logo and allowed_file(file_logo.filename):
            ext = file_logo.filename.rsplit(".", 1)[1].lower()
            filename = f"{uuid.uuid4()}.{ext}"
            folder = "static/uploads/logos"
            os.makedirs(folder, exist_ok=True)
            filepath = os.path.join(folder, filename)
            file_logo.save(filepath)
            estabelecimento.url_logo = f"/{folder}/{filename}"

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

@auth_bp.route('/atualizar-senha', methods=['GET'])
def atualizarSenha():
    """
    Rota de teste para resetar senhas (DEV ONLY)
    ---
    tags:
      - DevTools
    responses:
      200:
        description: Senhas resetadas para 'teste'
    """
    usuarioEmpresa = []
    for id in range(1,5):
        usuario = User.query.get(id)

        if usuario:
            #usuario.password_hash = "teste"
            usuario.set_password("teste")
            db.session.commit()
            usuarioEmpresa.append({'nome':usuario.email, 'password':usuario.password_hash})
    return jsonify(usuarioEmpresa),200