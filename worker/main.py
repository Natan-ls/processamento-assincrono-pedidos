from confluent_kafka import Consumer
import json

PEDIDO_CRIADO = "pedido-criado"
ENDERECO = "kafka"

conf = {
    "bootstrap.servers": f"{ENDERECO}:9092",
    "group.id": "pedido-worker",
    "auto.offset.reset": "earliest"
}

consumer = Consumer(conf)
consumer.subscribe([PEDIDO_CRIADO])

print("Worker aguardando mensagens...")

while True:
    msg = consumer.poll(1.0)

    if msg is None:
        continue
    if msg.error():
        print(f"Erro: {msg.error()}")
        continue

    evento = json.loads(msg.value().decode())
    print("Evento recebido:", evento)