from flask import Blueprint, request, jsonify
from extensions import db
from api.models.order import Order, OrderItem
from api.models.enums import OrderStatus
from api.auth.decorators import jwt_required
import api.messaging.constantes as constants
import api.messaging.producer as producer
from datetime import datetime, timezone
orders_bp = Blueprint("orders", __name__, url_prefix="/orders")


# ======== FUNCT p/ CRIAR PEDIDO ======== 
@orders_bp.route("/", methods=["POST", "OPTIONS"])
@jwt_required
def create_order():
    if request.method == "OPTIONS":
        return jsonify({"ok": True}), 200

    data = request.get_json() # pega o arq json q foi enviado pelo frontend

    if not data:
        return jsonify({"error": "JSON inválido ou ausente"}), 400

    items_data = data.get("items")

    if not items_data or not isinstance(items_data, list):
        return jsonify({"error": "O pedido deve conter uma lista de itens"}), 400

    try:
        new_order = Order(## cria o pedido no BD
            usuario_id=request.user_id, ##faz autencticação do user via jwwt
            estabelecimento_id=data["estabelecimento_id"],
            status=OrderStatus.CRIADO.value,
            valor_total=0
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
                "usuario_id": request.user_id,
                "itens": [item.to_dict() for item in new_order.items],
                "total": float(total)
            }
        }
        producer.publicar_evento(constants.PEDIDO_CRIADO, evento)

        return jsonify({##retorno de sucesso de criação do pedido
            "message": "Pedido criado com sucesso",
            "order_id": new_order.id,
            "status": new_order.status,
            "total": float(total)
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
    # faz a busca do pedido do user q está autenticado
    order = Order.query.filter_by(
        id=order_id,
        usuario_id=request.user_id
    ).first()

    if not order:
        return jsonify({"error": "Pedido não encontrado"}), 404

    return jsonify({
        "order_id": order.id,
        "status": order.status,
        "total": float(order.valor_total),
        "items": [item.to_dict() for item in order.items]
    }), 200

# ======== FUNCT p/ LISTART PEDIDO ======== 
@orders_bp.route("/", methods=["GET", "OPTIONS"])
@jwt_required
def list_orders():
    if request.method == "OPTIONS":
        return jsonify({"ok" : True}), 200
    orders = ( ## lista em ordem descescente do mais recente p mais antigo
        Order.query
        .filter_by(usuario_id=request.user_id)
        .order_by(Order.created_at.asc())
        .all()
    )

    return jsonify([order.to_dict() for order in orders]), 200
