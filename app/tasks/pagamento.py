from app.celery_app import celery_app
from app.email import send_email
from app import db
from api.models.enums import StatusPagamento

@celery_app.task(name="app.tasks.pagamento.handle_pagamento_evento")
def handle_pagamento_evento(evento: dict):
    print("TASK EXECUTADA", evento, flush=True)

    dados = evento["dados"]
    pedido_id = dados["pedido_id"]
    status = dados["status"]
    valor = dados["total"]

    if status != StatusPagamento.PAGAMENTO_APROVADO.value:
        print(f"Pagamento falhou para pedido_id={pedido_id}", flush=True)
        return

    email = db.get_user_email_by_pedido_id(pedido_id)

    if not email:
        print(f"Email não encontrado para pedido_id={pedido_id}", flush=True)
        return

    send_email(
        to=email,
        subject="Pagamento recebido com sucesso",
        body=_template_pagamento_recebido(pedido_id, valor)
    )

def _template_pagamento_recebido(pedido_id, valor):
    return f"""
Olá,

O pagamento do pedido #{pedido_id} foi recebido com sucesso.
No valor de R$ {valor:.2f}.

Atenciosamente,
Sistema JanuFood
""".strip()