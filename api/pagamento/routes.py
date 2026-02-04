from flask import Blueprint, request, jsonify
from extensions import db
from api.models.pagamento import Pagamento
from api.models.ordem_eventos import OrdemEvento
from datetime import datetime, timezone
from api.messaging import constantes as constants
from api.messaging import producer as producer

pagamento_bp = Blueprint("pagamento", __name__)

@pagamento_bp.route("/pagamentos/<int:pedido_id>", methods=["POST"])
def criar_pagamento(pedido_id):
    """
    Registra/Simula o pagamento de um pedido
    ---
    tags:
      - Pagamento
    parameters:
      - name: pedido_id
        in: path
        type: integer
        required: true
        description: ID do pedido a ser pago
      - in: body
        name: body
        required: true
        description: Dados do pagamento
        schema:
          type: object
          required:
            - metodo
          properties:
            metodo:
              type: string
              example: "PIX"
              enum: ["PIX", "CREDITO", "DEBITO"]
    responses:
      201:
        description: Pagamento aprovado e registrado
        schema:
          type: object
          properties:
            message:
              type: string
            pagamento_id:
              type: integer
            evento:
              type: string
      400:
        description: Método de pagamento não informado
    """
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

    evento = {
          "tipo_evento": constants.PAGAMENTO_EVENTO,
          "timestamp": datetime.now(timezone.utc).isoformat(),
          "dados": {
              "pedido_id": pagamento.pedido_id,
              "total": float(pagamento.valor),
              "status": pagamento.status
          }
        }

    producer.publicar_evento(constants.PAGAMENTO_EVENTO, evento)
    
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
