from celery import Celery

celery_app = Celery(
    "janufood",
    broker="amqp://guest:guest@rabbitmq:5672//",
    backend="rpc://",
    include=[
        "app.tasks.pedidos",
        "app.tasks.pagamento",
        
    ]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/Sao_Paulo",
    enable_utc=True,
)
