from flask import Blueprint, request, jsonify
from extensions import db
from api.models.order import Order, OrderItem
from api.models.enums import OrderStatus
from api.auth.decorators import jwt_required
import api.messaging.constantes as constants
import api.messaging.producer as producer
from datetime import datetime, timezone

orders_bp = Blueprint("orders", __name__, url_prefix="/orders")

@orders_bp.route("/", methods=["POST", "OPTIONS"])
@jwt_required
def create_order():
    if request.method == "OPTIONS":
        return jsonify({"ok": True}), 200

    data = request.get_json()

    if not data:
        return jsonify({"error": "JSON inválido ou ausente"}), 400

    items_data = data.get("items")

    if not items_data or not isinstance(items_data, list):
        return jsonify({"error": "O pedido deve conter uma lista de itens"}), 400

    try:
        new_order = Order(
            usuario_id=request.user_id,
            status=OrderStatus.CRIADO.value,
            valor_total=0
        )
        
        total = 0
        for item in items_data:
            order_item = OrderItem(
                nome_item=item["nome"],
                quantidade=int(item["quantidade"]),
                preco_unitario=float(item["preco"])
            )
            new_order.items.append(order_item)
            total += item["quantidade"] * item["preco"]

        new_order.valor_total = total

        db.session.add(new_order)
        db.session.commit()
        
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

        return jsonify({
            "message": "Pedido criado com sucesso",
            "order_id": new_order.id,
            "status": new_order.status,
            "total": float(total),
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "error": "Falha ao criar pedido",
            "details": str(e)
        }), 500

@orders_bp.route("/<int:order_id>", methods=["GET"])
@jwt_required
def get_order(order_id):
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

@orders_bp.route("/", methods=["GET", "OPTIONS"])
@jwt_required
def list_orders():
    if request.method == "OPTIONS":
        return jsonify({"ok" : True}), 200
    orders = (
        Order.query
        .filter_by(usuario_id=request.user_id)
        .order_by(Order.created_at.desc())
        .all()
    )

    return jsonify([order.to_dict() for order in orders]), 200
