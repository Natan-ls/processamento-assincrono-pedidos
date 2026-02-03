import smtplib
from email.message import EmailMessage
import db

def send_email(to, subject, body):
    msg = EmailMessage()
    msg["From"] = "no-reply@janufood.fake"
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)

    with smtplib.SMTP("mailpit", 1025) as smtp:
        smtp.send_message(msg)

def handle_pedido_criado(evento):
    dados = evento["dados"]

    estabelecimento_id = dados["estabelecimento_id"]
    pedido_id = dados["pedido_id"]
    total = dados["total"]

    email = db.get_user_email_by_pessoa_id(estabelecimento_id)

    if not email:
        print(f"⚠️ Email não encontrado para pessoa_id={estabelecimento_id}", flush=True)
        return

    send_email(
        to=email,
        subject="Pedido criado com sucesso",
        body=template_pedido_criado(pedido_id, total)
    )

def template_pedido_criado(pedido_id, total):
    return f"""
Olá,

Um novo pedido foi criado em seu estabelecimento e está aguardando sua análise.

Detalhes do pedido:
- Número do pedido: #{pedido_id}
- Valor total: R$ {total:.2f}

Por favor, acesse o painel do estabelecimento para aprovar ou recusar o pedido.

Este é um e-mail automático. Em caso de dúvidas, utilize o sistema administrativo.

Atenciosamente,
Sistema JanuFood
""".strip()
