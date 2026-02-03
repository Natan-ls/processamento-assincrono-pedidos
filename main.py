import os
from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
from flasgger import Swagger
from extensions import db
from config import Config
from datetime import datetime, timedelta

# ======= BLUEPRINTS da API ======= 
from api.auth.routes import auth_bp
from api.orders.routes import orders_bp
from api.estabelecimentos.routes import estabelecimentos_bp
from api.pagamento.routes import pagamento_bp

# ======= DECORATORS =======
from api.auth.decorators import jwt_required, vip_required

# ======= MODELS p/ Garantir o REGISTRO no SQLAlchemy =======
from api.models.user import User
from api.models.estabelecimento import Estabelecimento
from api.models.produto import Product
from api.models.order import Order, OrderItem
from api.models.endereco import Endereco
from api.models.horarioFuncionamento import HorarioFuncionamento

# IP p acessar o SITE  hospedado na ec2 aws --> http://foodjanu.ddns.net:5000/ 
# IP caso queiram utilizar  no local host -->  http://localhost:5000

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


def create_app():
    app = Flask(
        __name__,
        template_folder=os.path.join(BASE_DIR, "frontend"),
        static_folder=os.path.join(BASE_DIR, "static")
    )
    
    app.config.from_object(Config)

# ======= SWAGGER =======
    swagger_config = {
        "headers": [],
        "specs": [
            {
                "endpoint": 'apispec_1',
                "route": '/apispec_1.json',
                "rule_filter": lambda rule: True,  # Documentar todas as rotas
                "model_filter": lambda tag: True,
            }
        ],
        "static_url_path": "/flasgger_static",
        "swagger_ui": True,
        "specs_route": "/apidocs/"  # <--- URL para acessar a doc: localhost:5000/apidocs/
    }

    template = {
        "swagger": "2.0",
        "info": {
            "title": "API de Processamento de Pedidos",
            "description": "API para sistema de delivery distribuído com Kafka e Celery",
            "contact": {
                "responsibleDeveloper": "Dev Team",
                "email": "dev@exemplo.com",
            },
            "version": "1.0.0"
        },
        # Configuração para aceitar JWT no botão "Authorize"
        "securityDefinitions": {
            "Bearer": {
                "type": "apiKey",
                "name": "Authorization",
                "in": "header",
                "description": "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\""
            }
        },
        "security": [
            {"Bearer": []}
        ]
    }
    Swagger(app, config=swagger_config, template=template)

# ======= CORs =======
    CORS(
        app,
        resources={r"/*": {"origins": "*"}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    )

# ======= DATABASE =======
    db.init_app(app)

# ======= BLUEPRINTs da API =======
    app.register_blueprint(auth_bp)
    app.register_blueprint(orders_bp)
    app.register_blueprint(estabelecimentos_bp)  
    app.register_blueprint(pagamento_bp)


# ======= ROTAS DE API =======
    # ---- PRE-FLIGHT (SEM JWT) ----
    @app.route("/users/vip", methods=["OPTIONS"])
    def users_vip_options():
        return "", 200

    # ---- ROTA PROTEGIDA ----
    @app.route("/users/vip", methods=["GET"])
    @jwt_required
    @vip_required
    def users_vip():
        return jsonify({
            "message": "Usuário VIP confirmado",
            "user_id": request.user_id
        }), 200
    
    # ---- ROTA p/ SER VIP ----
    @app.route("/users/vip", methods=["POST"])
    @jwt_required
    def post_user_vip():
        data = request.get_json()
        plano = data.get('plano')

        if not plano: return jsonify({"error": "Plano Não Especificado pelo Usuario"}), 400

        planos_validos = ['1_mes', '1_ano', 'eterno']
        if plano not in planos_validos:
            return jsonify({"error": f"Plano Inválido. Escolha uma das Seguintes Opções: {', '.join(planos_validos)}"}), 400

        user = User.query.get(request.user_id)
        if not user:
            return jsonify({"error": "Usuário Não Encontrado"}), 404


        hoje = datetime.utcnow()
        vip_ativo = user.is_vip and (user.vip_until is None or user.vip_until > hoje)

        # primeiro verifica se o user logado já é VIP, e se for se ainda esta ativo
        if vip_ativo:
            data_expiracao = user.vip_until.strftime("%d/%m/%Y") if user.vip_until else "Nunca"
            return jsonify({"error": f"Você já é um usuário VIP ativo! Expira em: {data_expiracao}"}), 400

        if plano == '1_mes':
            vip_until = hoje + timedelta(days=30)
            plano_nome = "VIP 1 Mês"
        elif plano == '1_ano':
            vip_until = hoje + timedelta(days=365)
            plano_nome = "VIP 1 Ano"
        elif plano == 'eterno':
            vip_until = None  # VIP eterno sem data de expiração
            # ou net se preferir usar com data -----> vip_until = hoje + timedelta(days=365*100)  # VIP ETERNO -->  definido p / 100 anos
            plano_nome = "VIP Eterno" 

        try:
            # autaliza os camps de vip de user no bd
            user.is_vip = True
            user.vip_until = vip_until
            
            db.session.commit()
            
            # resp p user no front
            if vip_until:
                expira_em = vip_until.strftime("%d/%m/%Y")
            else:
                expira_em = "Nunca (VIP Eterno)"
            
            return jsonify({
                "success": True,
                "message": f"Parabéns! Você agora é um usuário {plano_nome}!",
                "plano": plano,
                "plano_nome": plano_nome,
                "vip_until": vip_until.isoformat() if vip_until else None,
                "expira_em": expira_em
            }), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"Erro ao atualizar banco de dados: {str(e)}"}), 500



# ======= ROTAS das PAGES FRONEND =======
    @app.route("/")
    def index():
        return render_template("Index/index.html")

    @app.route("/client/home")
    def client_home():
        return render_template("Client/home.html")

    @app.route("/client/orders")
    def client_orders():
        return render_template("Client/orders.html")

    @app.route("/client/produtos")
    def client_produtos():
        return render_template("Client/produtos.html")

    @app.route("/client/profile")
    def client_profile():
        return render_template("Client/profile.html")

    @app.route("/client/pagamento")
    def client_pagamento():
        return render_template("Client/pagamento.html")

    @app.route("/client/order")
    def client_order_details():
        return render_template("Client/detalhesPedido.html")

# ======= HEALTH =======
    @app.route("/health")
    def health():
        """
        Verificação de saúde da API
        ---
        tags:
          - Infraestrutura
        responses:
          200:
            description: API está online
            schema:
              type: object
              properties:
                status:
                  type: string
                  example: ok
        """
        return {"status": "ok"}

    return app

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)