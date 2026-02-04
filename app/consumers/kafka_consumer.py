from confluent_kafka import Consumer
import json
from app.tasks.pedidos import handle_pedido_criado
from app.tasks.pagamento import handle_pagamento_evento

conf = {
    "bootstrap.servers": "kafka:9092",
    "group.id": "pedido-worker",
    "auto.offset.reset": "earliest",
}

consumer = Consumer(conf)
consumer.subscribe(["pedido-criado", "pagamento-evento"])

print("Kafka consumer aguardando mensagens...", flush=True)

while True:
    msg = consumer.poll(1.0)

    if msg is None:
        continue
    if msg.error():
        print(msg.error(), flush=True)
        continue

    evento = json.loads(msg.value().decode())

    if evento["tipo_evento"] == "pedido-criado":
        handle_pedido_criado.delay(evento)
    if evento["tipo_evento"] == "pagamento-evento":
        handle_pagamento_evento.delay(evento)