from datetime import datetime, timezone, timedelta
from extensions import db
from api.models.order import Order
from api.models.enums import OrderStatus
from api.models.ordem_eventos import OrdemEvento
import random
from api.models.produto import Product


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

def gerar_tempo(min_min, max_min):
    return timedelta(minutes=random.randint(min_min, max_min))


def atualizar_status_se_necessario(pedido):
    agora = datetime.now(timezone.utc)

    try:
        # 1️⃣ EXPIRAÇÃO DE PAGAMENTO
        if (
            pedido.status == OrderStatus.AGUARDANDO_PAGAMENTO.value
            and pedido.pagamento_timer
            and agora >= pedido.pagamento_timer
        ):
            pedido.status = OrderStatus.CANCELADO.value
            pedido.status_updated_at = agora
            pedido.next_status_at = None

            evento = OrdemEvento(
                pedido_id=pedido.id,
                tipo_evento="pagamento_expirado",
                criador_evento="sistema"
            )
            db.session.add(evento)
            db.session.commit()
            return  # 🔴 Importante: para aqui

        # 2️⃣ TRANSIÇÕES AUTOMÁTICAS DE STATUS
        if not pedido.next_status_at or agora < pedido.next_status_at:
            return

        if pedido.status == OrderStatus.VALIDANDO.value:
            baixar_estoque_do_pedido(pedido)

            pedido.status = OrderStatus.PROCESSANDO.value
            pedido.status_updated_at = agora
            pedido.next_status_at = agora + gerar_tempo(5, 10)

            evento = OrdemEvento(
                pedido_id=pedido.id,
                tipo_evento="status_validando_para_processando",
                criador_evento="sistema"
            )
            db.session.add(evento)

        elif pedido.status == OrderStatus.PROCESSANDO.value:
            pedido.status = OrderStatus.FINALIZADO.value
            pedido.status_updated_at = agora
            pedido.next_status_at = None

            evento = OrdemEvento(
                pedido_id=pedido.id,
                tipo_evento="status_processando_para_finalizado",
                criador_evento="sistema"
            )
            db.session.add(evento)

        db.session.commit()

    except Exception as e:
        db.session.rollback()
        print(f"Erro ao atualizar status do pedido {pedido.id}: {str(e)}")


def baixar_estoque_do_pedido(order):
    for item in order.items:
        produto = Product.query.get(item.produto_id)

        if not produto:
            raise Exception("Produto não encontrado")

        if produto.quantidade_estoque < item.quantidade:
            raise Exception(
                f"Estoque insuficiente para o produto {produto.nome_item}"
            )

        produto.quantidade_estoque -= item.quantidade
