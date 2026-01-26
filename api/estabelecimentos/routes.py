from flask import Blueprint, jsonify
from api.models.estabelecimento import Estabelecimento
from api.models.produto import Product

estabelecimentos_bp = Blueprint(
    "estabelecimentos",
    __name__,
    url_prefix="/estabelecimentos"
)

# ======== FUNCT p/ LISTART TDS ESTABELECIMENTOS ======== 
@estabelecimentos_bp.route("/", methods=["GET"])
def list_estabelecimentos():
    estabelecimentos = Estabelecimento.query.all()
    return jsonify([
        {
            "id": e.id,
            "nome": e.nome_fantasia,
            "categoria": e.categoria
        }
        for e in estabelecimentos
    ])

# ======== FUNCT p/ LISTART TDS PRODUTOS DE UM ESTABELECIMENTO ======== 
@estabelecimentos_bp.route("/<int:estabelecimento_id>/produtos", methods=["GET"])
def list_produtos(estabelecimento_id):
    produtos = Product.query.filter_by(
        estabelecimento_id=estabelecimento_id
    ).all()

    return jsonify([
        {
            "id": p.id,
            "nome": p.nome_item,
            "preco": float(p.preco_unidade)
        }
        for p in produtos
    ])


