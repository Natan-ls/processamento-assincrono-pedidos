from app.celery_app import celery_app
from app.email import send_email
from app import db

@celery_app.task(name="app.tasks.pedidos.handle_pedido_criado")
def handle_pedido_criado(evento: dict):
    print("TASK EXECUTADA", evento)
    dados = evento["dados"]

    estabelecimento_id = dados["estabelecimento_id"]
    pedido_id = dados["pedido_id"]
    total = dados["total"]

    email = db.get_user_email_by_pessoa_id(estabelecimento_id)

    if not email:
        print(f"Email não encontrado para pessoa_id={estabelecimento_id}", flush=True)
        return

    send_email(
        to=email,
        subject="Pedido criado com sucesso",
        body=_template_pedido_criado(pedido_id, total)
    )

def _template_pedido_criado(pedido_id, total):
    return f"""
Olá,

Um novo pedido foi criado em seu estabelecimento e está aguardando sua análise.

Detalhes do pedido:
- Número do pedido: #{pedido_id}
- Valor total: R$ {total:.2f}

Atenciosamente,
Sistema JanuFood
""".strip()
