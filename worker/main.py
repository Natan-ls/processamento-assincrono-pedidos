from confluent_kafka import Consumer
import json

conf = {
    "bootstrap.servers": "kafka:9092",
    "group.id": "pedido-worker",
    "auto.offset.reset": "earliest"
}

consumer = Consumer(conf)
consumer.subscribe(["pedidos"])

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
