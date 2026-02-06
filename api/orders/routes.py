from flask import Blueprint, request, jsonify
from extensions import db
from api.models.order import Order, OrderItem
from api.models.enums import OrderStatus
from api.auth.decorators import jwt_required
import api.messaging.constantes as constants
import api.messaging.producer as producer
from datetime import datetime, timezone, timedelta
from api.models.produto import Product
from api.models.estabelecimento import Estabelecimento

orders_bp = Blueprint("orders", __name__, url_prefix="/orders")


# ======== FUNCT p/ CRIAR PEDIDO ======== 
@orders_bp.route("/", methods=["POST", "OPTIONS"])
@jwt_required
def create_order():
    """
    Cria um novo pedido
    ---
    tags:
      - Pedidos
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        description: Dados do pedido e itens
        required: true
        schema:
          type: object
          required:
            - estabelecimento_id
            - endereco_entrega
            - items
          properties:
            estabelecimento_id:
              type: integer
              example: 1
            endereco_entrega:
              type: string
              example: "Rua das Flores, 123 - Centro"
            items:
              type: array
              description: Lista de produtos do pedido
              items:
                type: object
                required:
                  - produto_id
                  - quantidade
                  - preco
                properties:
                  produto_id:
                    type: integer
                    example: 10
                  quantidade:
                    type: integer
                    example: 2
                  preco:
                    type: number
                    format: float
                    description: Preço unitário no momento da compra
                    example: 25.90
    responses:
      201:
        description: Pedido criado com sucesso e enviado para processamento
        schema:
          type: object
          properties:
            message:
              type: string
            order_id:
              type: integer
            status:
              type: string
            total:
              type: number
      400:
        description: Erro de validação ou JSON inválido
      500:
        description: Erro interno ao processar pedido
    """    
    if request.method == "OPTIONS":
        return jsonify({"ok": True}), 200

    data = request.get_json() # pega o arq json q foi enviado pelo frontend

    if not data:
        return jsonify({"error": "JSON inválido ou ausente"}), 400

    items_data = data.get("items")
    endereco_entrega = data.get("endereco_entrega")

    if not items_data or not isinstance(items_data, list):
        return jsonify({"error": "O pedido deve conter uma lista de itens"}), 400

    # busca o estabelecimento e taxa de entrega do mesmo
    estabelecimento = Estabelecimento.query.get(data["estabelecimento_id"])
    if not estabelecimento:
        return jsonify({"error": "Estabelecimento não encontrado"}), 404

    taxa_entrega = estabelecimento.taxa_entrega
    PAGAMENTO_TIMEOUT_EM_MINUTOS = 1

    try:        
        subtotal = 0
        agora = datetime.now(timezone.utc)
        new_order = Order(## cria o pedido no BD
            pessoa_id=request.pessoa_id, ##faz autencticação do user via jwwt
            estabelecimento_id=data["estabelecimento_id"],
            status=OrderStatus.CRIADO.value,
            endereco_entrega=endereco_entrega,
            valor_total=0,
        )
        db.session.add(new_order) ## salva no BD
        db.session.commit()

        for item in items_data:
            quantidade = int(item["quantidade"])
            preco = float(item["preco"])
            observacao = item.get("observacao")
 
            subtotal += quantidade * preco ## att o valor do pedido

            order_item = OrderItem(##cria os items do pedido
                pedido_id=new_order.id,
                produto_id=item["produto_id"],
                quantidade=quantidade,
                preco_unitario=preco,
                observacao=observacao
            )
            db.session.add(order_item)
        valor_total = subtotal + float(taxa_entrega)
        new_order.valor_total = valor_total

        # AGORA o STATUS muda para AGUARDANDO_PAGAMENTO e define o timer
        new_order.status = OrderStatus.AGUARDANDO_PAGAMENTO.value
        new_order.pagamento_timer = agora + timedelta(minutes=PAGAMENTO_TIMEOUT_EM_MINUTOS)


        db.session.commit()

        # === Envio do evento para Kafka (nova forma) ===
        evento = {
            "tipo_evento": constants.PEDIDO_CRIADO,
           "timestamp": datetime.now(timezone.utc).isoformat(),
            "dados": {
                "pedido_id": new_order.id,
                "pessoa_id": request.pessoa_id,
                "estabelecimento_id": new_order.estabelecimento_id,
                "endereco_entrega": endereco_entrega,
                "itens": [item.to_dict() for item in new_order.items],
                "subtotal": float(subtotal),
                "taxa_entrega": float(taxa_entrega),
                "total": float(valor_total)
            }
        }
        producer.publicar_evento(constants.PEDIDO_CRIADO, evento)

        return jsonify({##retorno de sucesso de criação do pedido
          "message": "Pedido criado com sucesso",
          "order_id": new_order.id,
          "status": new_order.status,
          "endereco_entrega": endereco_entrega,
          "pagamento_timer": new_order.pagamento_timer.isoformat() + "Z"
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "error": "Falha ao criar pedido",
            "details": str(e)
        }), 500


# ======== FUNCT p/ BUSCAR PEDIDO VIA ID ======== 
@orders_bp.route("/<int:order_id>", methods=["GET"])
@jwt_required
def get_order(order_id):
    """
    Busca detalhes de um pedido específico
    ---
    tags:
      - Pedidos
    security:
      - Bearer: []
    parameters:
      - name: order_id
        in: path
        type: integer
        required: true
        description: ID do pedido a ser consultado
    responses:
      200:
        description: Detalhes do pedido retornados com sucesso
        schema:
          type: object
          properties:
            order_id:
              type: integer
            status:
              type: string
            total:
              type: number
            items:
              type: array
              items:
                type: object
                properties:
                  nome:
                    type: string
                  quantidade:
                    type: integer
                  subtotal:
                    type: number
      404:
        description: Pedido não encontrado ou não pertence ao usuário
    """    
    # faz a busca do pedido do user q está autenticado
    order = Order.query.filter_by(
        id=order_id,
        pessoa_id=request.pessoa_id
    ).first()

    if not order:
        return jsonify({"error": "Pedido não encontrado"}), 404

    # Buscar informações dos itens com detalhes do produto
    items_detalhados = []
    for item in order.items:
        produto = Product.query.get(item.produto_id)
        items_detalhados.append({
            "id": item.id,
            "produto_id": item.produto_id,
            "nome": produto.nome_item if produto else "Produto não encontrado",
            "quantidade": item.quantidade,
            "preco_unitario": float(item.preco_unitario),
            "subtotal": float(item.quantidade * item.preco_unitario)
        })

    return jsonify({
      "order_id": order.id,
      "estabelecimento_id": order.estabelecimento_id,
      "status": order.status,
      "total": float(order.valor_total),
      "endereco_entrega": order.endereco_entrega,
      "created_at": order.created_at.isoformat() if order.created_at else None,
      "pagamento_expires_at": (
          order.pagamento_timer.isoformat()
          if order.pagamento_timer else None
      ),        
      "items": [item.to_dict() for item in order.items]
    }), 200

# ======== FUNCT p/ LISTART PEDIDO ======== 
@orders_bp.route("/", methods=["GET", "OPTIONS"])
@jwt_required
def list_orders():
    """
    Lista histórico de pedidos do usuário
    ---
    tags:
      - Pedidos
    security:
      - Bearer: []
    responses:
      200:
        description: Lista de pedidos ordenada por data (mais recente primeiro)
        schema:
          type: array
          items:
            type: object
            properties:
              id:
                type: integer
              status:
                type: string
              valor_total:
                type: number
              created_at:
                type: string
    """    
    if request.method == "OPTIONS":
        return jsonify({"ok" : True}), 200
    orders = ( ## lista em ordem descescente do mais recente p mais antigo
        Order.query
        .filter_by(pessoa_id=request.pessoa_id)
        .order_by(Order.created_at.desc())
        .all()
    )

    return jsonify([order.to_dict() for order in orders]), 200

# Aprovar pedido pelo estabelecimento e iniciar preparo
@orders_bp.route("/<int:pedido_id>/aprovar", methods=["POST"])
@jwt_required
def aprovar_pedido(pedido_id):
    pedido = Order.query.get(pedido_id)
    if not pedido:
        return jsonify({"error": "Pedido não encontrado"}), 404

    # Só aprova se estiver em VALIDANDO
    if pedido.status != OrderStatus.VALIDANDO.value:
        return jsonify({
            "error": f"Pedido não está aguardando validação. Status atual: {pedido.status}"
        }), 400

    try:
        pedido.status = OrderStatus.PROCESSANDO.value
        db.session.commit()
        return jsonify({
            "message": "Pedido aprovado e em processamento",
            "pedido_status": pedido.status
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@orders_bp.route("/<int:pedido_id>/enviar", methods=["POST"])
@jwt_required
def enviar_pedido(pedido_id):
    pedido = Order.query.get(pedido_id)
    if not pedido:
        return jsonify({"error": "Pedido não encontrado"}), 404

    if pedido.status != OrderStatus.PROCESSANDO.value:
        return jsonify({
            "error": f"Pedido não está em processamento. Status atual: {pedido.status}"
        }), 400

    try:
        pedido.status = OrderStatus.EM_ROTA.value
        db.session.commit()
        return jsonify({
            "message": "Pedido em rota",
            "pedido_status": pedido.status
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@orders_bp.route("/<int:pedido_id>/finalizar", methods=["POST"])
@jwt_required
def finalizar_pedido(pedido_id):
    pedido = Order.query.get(pedido_id)
    if not pedido:
        return jsonify({"error": "Pedido não encontrado"}), 404

    if pedido.status != OrderStatus.EM_ROTA.value:
        return jsonify({
            "error": f"Pedido não está em rota. Status atual: {pedido.status}"
        }), 400

    try:
        pedido.status = OrderStatus.FINALIZADO.value
        db.session.commit()

        evento = {
            "tipo_evento": constants.PEDIDO_FINALIZADO,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "dados": {
                "pedido_id": pedido.id,
                "total": float(pedido.valor_total)
            }
        }

        producer.publicar_evento(constants.PEDIDO_FINALIZADO, evento)

        return jsonify({
            "message": "Pedido finalizado",
            "pedido_status": pedido.status
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
