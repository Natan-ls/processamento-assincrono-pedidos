from confluent_kafka import Consumer
import json
import processos

PEDIDO_CRIADO = "pedido-criado"
ENDERECO = "kafka"

conf = {
    "bootstrap.servers": f"{ENDERECO}:9092",
    "group.id": "pedido-worker",
    "auto.offset.reset": "earliest",
    "enable.auto.commit": True,
    "session.timeout.ms": 10000
}

consumer = Consumer(conf)
consumer.subscribe([PEDIDO_CRIADO])

print("Worker aguardando mensagens...", flush=True)

while True:
    msg = consumer.poll(1.0)

    if msg is None:
        continue
    if msg.error():
        print(f"Erro: {msg.error()}", flush=True)
        continue

    evento = json.loads(msg.value().decode())
    print(f"Evento recebido: {evento} chaves={evento.keys()}", flush=True)

    if evento['tipo_evento'] == 'pedido-criado':
        processos.handle_pedido_criado(evento)