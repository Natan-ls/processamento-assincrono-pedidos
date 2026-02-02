from flask import Flask
from flask_cors import CORS
from flasgger import Swagger
from extensions import db
from config import Config

from api.auth.routes import auth_bp
from api.orders.routes import orders_bp
from api.estabelecimentos.routes import estabelecimentos_bp
from api.pagamento.routes import pagamento_bp

from api.models.user import User
from api.models.estabelecimento import Estabelecimento
from api.models.produto import Product
from api.models.order import Order, OrderItem
from api.models.endereco import Endereco
from api.models.horarioFuncionamento import HorarioFuncionamento


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

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

    CORS(
        app,
        resources={r"/*": {"origins": "*"}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    )

    db.init_app(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(orders_bp)
    app.register_blueprint(estabelecimentos_bp)  
    app.register_blueprint(pagamento_bp)


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
