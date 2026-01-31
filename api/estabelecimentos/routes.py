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
    estabelecimento = Estabelecimento.query.get(estabelecimento_id)

    if not estabelecimento:
        return jsonify({"error": "Estabelecimento não encontrado"}), 404

    produtos = Product.query.filter_by(
        estabelecimento_id=estabelecimento_id
    ).all()

    return jsonify([
        {
            "id": p.id,
            "nome": p.nome_item,
            "preco": float(p.preco_unidade),
            "imagem": p.url_imagem
        }
        for p in estabelecimento.produtos
    ])

#Rota para teste
@estabelecimentos_bp.route('/<int:estabelecimento_id>', methods=["GET"])
def listEstabelecimento(estabelecimento_id):
    estabelecimento = Estabelecimento.query.get(estabelecimento_id)

    if not estabelecimento:
        return jsonify({"error": "Estabelecimento não encontrado"}), 404
    
    print(estabelecimento, flush=True)

    return jsonify({
            "id": estabelecimento.id,
            "nome_fantasia": estabelecimento.nome_fantasia,
            "categoria": estabelecimento.categoria.value,
            "proprietario": {
                "nome": estabelecimento.pessoa.nome,
                "cpf": estabelecimento.pessoa.cpf,
                "telefone": estabelecimento.pessoa.telefone
            },
            "endereco": estabelecimento.to_dict(),
            "horarios": [
                {
                    "dia_semana": h.dia_semana,
                    "hora_inicio": h.hora_inicio.isoformat(),
                    "hora_fim": h.hora_fim.isoformat(),
                    "ativo": h.ativo
                }
                for h in estabelecimento.horarios
            ]
        }
    )