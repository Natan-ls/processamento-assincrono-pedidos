from flask import Blueprint, request, jsonify
from extensions import db
from api.models.pagamento import Pagamento
from api.models.ordem_eventos import OrdemEvento
from datetime import datetime

pagamento_bp = Blueprint("pagamento", __name__)

@pagamento_bp.route("/pagamentos/<int:pedido_id>", methods=["POST"])
def criar_pagamento(pedido_id):

    data = request.get_json()
    metodo = data.get("metodo")

    if not metodo:
        return jsonify({"error": "Método não informado"}), 400

    # ✅ Criar pagamento
    pagamento = Pagamento(
        pedido_id=pedido_id,
        status="APROVADO",
        valor=0,
        processed_at=datetime.utcnow()
    )

    db.session.add(pagamento)

    # ✅ Criar evento na ordem dos eventos
    evento = OrdemEvento(
        pedido_id=pedido_id,
        tipo_evento="pagamento_aprovado",
        criador_evento="api"
    )

    db.session.add(evento)

    db.session.commit()

    return jsonify({
        "message": "Pagamento registrado!",
        "pagamento_id": pagamento.id,
        "evento": evento.tipo_evento
    }), 201
