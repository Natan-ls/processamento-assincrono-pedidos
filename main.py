"""from flask import Flask, jsonify
from auth import auth_bp
from jwt_utils import jwt_required
from config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    app.register_blueprint(auth_bp)

    @app.route("/health")
    def health():
        return {"status": "ok"}

    @app.route("/rota-protegida")
    @jwt_required
    def rota_protegida():
        return jsonify({"mensagem": "JWT funcionando corretamente"})

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
"""
from flask import Flask
from extensions import db                
from config import Config

from api.auth.routes import auth_bp
from api.orders.routes import orders_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(orders_bp)

    @app.route("/health")
    def health():
        return {"status": "ok"}

    return app

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)