from flask import Blueprint, request, jsonify
from extensions import db
from api.models.pagamento import Pagamento
from api.models.ordem_eventos import OrdemEvento
from datetime import datetime
from api.models.enums import OrderStatus, StatusPagamento
from api.models.order import Order
from datetime import datetime, timezone

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

    pedido = Order.query.get(pedido_id)
    if not pedido:
        return jsonify({"error": "Pedido não encontrado"}), 404

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

# =================== Endpoint do estabelecimento confirmando pedido ===================
@pagamento_bp.route("/pedidos/<int:pedido_id>/confirmar", methods=["POST"])
def confirmar_pedido(pedido_id):
    """
    Estabelecimento confirma o pedido após pagamento
    """
    pedido = Order.query.get(pedido_id)
    if not pedido:
        return jsonify({"error": "Pedido não encontrado"}), 404

    if pedido.status != OrderStatus.VALIDANDO.value:
        return jsonify({"error": f"Pedido não está em validação. Status atual: {pedido.status}"}), 400

    try:
        # Atualiza status do pedido para PROCESSANDO
        pedido.status = OrderStatus.PROCESSANDO.value
        db.session.commit()

        return jsonify({
            "message": "Pedido confirmado pelo estabelecimento!",
            "pedido_status": pedido.status
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "error": "Falha ao confirmar pedido",
            "details": str(e)
        }), 500


# =================== Endpoint para marcar pedido como EM_ROTA ===================
@pagamento_bp.route("/pedidos/<int:pedido_id>/em_rota", methods=["POST"])
def pedido_em_rota(pedido_id):
    """
    Atualiza o pedido para EM_ROTA
    """
    pedido = Order.query.get(pedido_id)
    if not pedido:
        return jsonify({"error": "Pedido não encontrado"}), 404

    if pedido.status != OrderStatus.PROCESSANDO.value:
        return jsonify({"error": f"Pedido não está em processamento. Status atual: {pedido.status}"}), 400

    try:
        pedido.status = OrderStatus.EM_ROTA.value
        db.session.commit()

        return jsonify({
            "message": "Pedido está a caminho do cliente!",
            "pedido_status": pedido.status
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "error": "Falha ao atualizar status",
            "details": str(e)
        }), 500


# =================== Endpoint para finalizar pedido ===================
@pagamento_bp.route("/pedidos/<int:pedido_id>/finalizar", methods=["POST"])
def finalizar_pedido(pedido_id):
    """
    Marca o pedido como FINALIZADO
    """
    pedido = Order.query.get(pedido_id)
    if not pedido:
        return jsonify({"error": "Pedido não encontrado"}), 404

    if pedido.status != OrderStatus.EM_ROTA.value:
        return jsonify({"error": f"Pedido não está em rota. Status atual: {pedido.status}"}), 400

    try:
        pedido.status = OrderStatus.FINALIZADO.value
        db.session.commit()

        return jsonify({
            "message": "Pedido finalizado com sucesso!",
            "pedido_status": pedido.status
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "error": "Falha ao finalizar pedido",
            "details": str(e)
        }), 500