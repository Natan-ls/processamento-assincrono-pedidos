from flask import Blueprint, request, jsonify
from extensions import db
from api.models.order import Order, OrderItem
from api.models.enums import OrderStatus
from api.auth.decorators import jwt_required
import api.messaging.constantes as constants
import api.messaging.producer as producer
from datetime import datetime, timezone
from api.models.produto import Product

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

    try:
        new_order = Order(## cria o pedido no BD
            pessoa_id=request.pessoa_id, ##faz autencticação do user via jwwt
            estabelecimento_id=data["estabelecimento_id"],
            status=OrderStatus.CRIADO.value,
            valor_total=0,
            endereco_entrega=endereco_entrega
        )
        
        total = 0
        for item in items_data:
            quantidade = int(item["quantidade"])
            preco = float(item["preco"])

            order_item = OrderItem(##cria os items do pedido
                produto_id=item["produto_id"],
                quantidade=quantidade,
                preco_unitario=preco
            )
            new_order.items.append(order_item)## add item no pedido
            total += quantidade * preco ## att o valor do pedido

        new_order.valor_total = total

        db.session.add(new_order) ## salva no BD
        db.session.commit()

        # === Envio do evento para Kafka (nova forma) ===
        evento = {
            "tipo_evento": constants.PEDIDO_CRIADO,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "dados": {
                "pedido_id": new_order.id,
                "pessoa_id": request.pessoa_id,
                "endereco_entrega": endereco_entrega,
                "itens": [item.to_dict() for item in new_order.items],
                "total": float(total)
            }
        }
        producer.publicar_evento(constants.PEDIDO_CRIADO, evento)

        return jsonify({##retorno de sucesso de criação do pedido
            "message": "Pedido criado com sucesso",
            "order_id": new_order.id,
            "status": new_order.status,
            "total": float(total),
            "endereco_entrega": endereco_entrega
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
