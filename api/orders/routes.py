from flask import Blueprint, request, jsonify
from extensions import db
from api.models.order import Order, OrderItem
from api.auth.decorators import jwt_required
from api.messaging.producer import kafka_service

orders_bp = Blueprint("orders", __name__, url_prefix="/orders")

@orders_bp.route("/", methods=["POST"])
@jwt_required
def create_order():
    data = request.json
    
    items_data = data.get("items")
    if not items_data or not isinstance(items_data, list):
        return jsonify({"error": "O pedido deve conter uma lista de itens"}), 400

    try:
        new_order = Order(
            usuario_id=request.user_id, 
            status="pendente",
            valor_total=0
        )
        
        total = 0
        for item in items_data:
            order_item = OrderItem(
                nome_item=item.get("nome"),
                quantidade=item.get("quantidade"),
                preco_unitario=item.get("preco")
            )
            new_order.items.append(order_item)
            total += (item.get("quantidade") * item.get("preco"))
        
        new_order.valor_total = total
        
        db.session.add(new_order)
        db.session.commit()

        event_payload = {
            "order_id": new_order.id,
            "user_id": request.user_id,
            "total": float(new_order.valor_total),
            "status": new_order.status,
            "items": items_data
        }
        
        kafka_service.send_order_event(event_payload)

        return jsonify({
            "message": "Pedido criado com sucesso!",
            "order_id": new_order.id,
            "total": float(new_order.valor_total)
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Falha ao criar pedido", "details": str(e)}), 500

@orders_bp.route("/<int:order_id>", methods=["GET"])
@jwt_required
def get_order(order_id):
    order = Order.query.filter_by(id=order_id, usuario_id=request.user_id).first()
    
    if not order:
        return jsonify({"error": "Pedido não encontrado"}), 404

    return jsonify({
        "order_id": order.id,
        "status": order.status,
        "total": float(order.valor_total),
        "items": [item.to_dict() for item in order.items]
    }), 200