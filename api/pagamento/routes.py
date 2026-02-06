from flask import Blueprint, request, jsonify
from extensions import db
from api.models.pagamento import Pagamento
from api.models.ordem_eventos import OrdemEvento
from datetime import datetime, timezone
from api.models.enums import OrderStatus, StatusPagamento
from api.models.order import Order
from api.orders.service import gerar_tempo, atualizar_status_se_necessario
from api.auth.decorators import jwt_required

pagamento_bp = Blueprint("pagamento", __name__)

@pagamento_bp.route("/pagamentos/<int:pedido_id>", methods=["POST"])
@jwt_required
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

    #pedido = Order.query.get(pedido_id)
    pedido = Order.query.filter_by(
        id=pedido_id,
        pessoa_id=request.pessoa_id
    ).first()
    if not pedido:
        return jsonify({"error": "Pedido não encontrado"}), 404

    # Atualiza status antes de validar pagamento
    atualizar_status_se_necessario(pedido)

    if pedido.status != OrderStatus.AGUARDANDO_PAGAMENTO.value:
        return jsonify({
            "error": f"Pedido não está aguardando pagamento. Status atual: {pedido.status}"
        }), 400

    try:
        agora = datetime.now(timezone.utc)

        # Criar pagamento
        pagamento = Pagamento(
            pedido_id=pedido_id,
            metodo=metodo,
            status=StatusPagamento.PAGAMENTO_APROVADO.value,
            valor=pedido.valor_total,
            processed_at=agora
        )
        db.session.add(pagamento)

        # Atualiza status do pedido para VALIDANDO
        pedido.status = OrderStatus.VALIDANDO.value
        pedido.status_updated_at = agora
        pedido.next_status_at = agora + gerar_tempo(2, 5)  # ex: 2 a 5 min
        # Criar evento de log
        evento = OrdemEvento(
            pedido_id=pedido_id,
            tipo_evento="pagamento_aprovado",
            criador_evento="sistema"
        )
        db.session.add(evento)

        db.session.commit()

        return jsonify({
            "message": "Pagamento registrado e pedido em validação!",
            "pagamento_id": pagamento.id,
            "pedido_status": pedido.status,
            "pagamento_status": pagamento.status
        }), 201

    except Exception as e:
        print("ERRO CRIAR PAGAMENTO:", e)  # log de erro p terminal    
        db.session.rollback()
        return jsonify({
            "error": "Falha ao processar pagamento",
            "details": str(e)
        }), 500