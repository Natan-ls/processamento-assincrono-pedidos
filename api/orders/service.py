from datetime import datetime, timezone
from extensions import db
from api.models.order import Order
from api.models.enums import OrderStatus
from api.models.ordem_eventos import OrdemEvento

def cancelar_pedidos_expirados():
    agora = datetime.now(timezone.utc)

    # Busca pedidos aguardando pagamento e expirados
    pedidos = Order.query.filter(
        Order.status == OrderStatus.AGUARDANDO_PAGAMENTO.value,
        Order.pagamento_timer < agora
    ).all()

    if not pedidos:
        return 0  # Nenhum pedido cancelado

    try:
        for pedido in pedidos:
            pedido.status = OrderStatus.CANCELADO.value

            # Cria evento de log
            evento = OrdemEvento(
                pedido_id=pedido.id,
                tipo_evento="pedido_cancelado_pagamento_expirado",
                criador_evento="sistema"
            )
            db.session.add(evento)

        db.session.commit()
        return len(pedidos)  # Quantos pedidos foram cancelados

    except Exception as e:
        db.session.rollback()
        print(f"Erro ao cancelar pedidos expirados: {str(e)}")
        return 0
