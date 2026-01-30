from flask import Flask
from flask_cors import CORS
from extensions import db
from config import Config

from api.auth.routes import auth_bp
from api.orders.routes import orders_bp
from api.estabelecimentos.routes import estabelecimentos_bp

from api.models.user import User
from api.models.estabelecimento import Estabelecimento
from api.models.produto import Product
from api.models.order import Order, OrderItem
from api.models.endereco import Endereco
from api.models.horarioFuncionamento import HorarioFuncionamento



def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

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


    @app.route("/health")
    def health():
        return {"status": "ok"}

    return app

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
