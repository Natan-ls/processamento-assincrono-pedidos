from app.celery_app import celery_app
from app.email import send_email
from app import db

@celery_app.task(name="app.tasks.usuario.handle_usuario_criado")
def handle_usuario_criado(evento: dict):
    print("TASK EXECUTADA", evento)
    dados = evento["dados"]
    pessoa_id = dados["pessoa_id"]
    email = dados["email"]
    nome = dados["nome"]

    send_email(
        to=email,
        subject="Cadastro realizado com sucesso",
        body=_template_usuario_criado(pessoa_id, nome, email)
    )
def _template_usuario_criado(pessoa_id, nome, email):
    return f"""
Olá, {nome}

Seu cadastro foi realizado com sucesso.
Detalhes do usuário:
- ID: {pessoa_id}
- Email: {email}

Atenciosamente,
Sistema JanuFood
""".strip()