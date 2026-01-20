from confluent_kafka import Producer
import json

ENDERECO = "kafka"

producer = Producer({
    "bootstrap.servers": f"{ENDERECO}:9092",
    "client.id": "api-producer"
})

def mensagem_calback(erro, mensagem):
    if erro:
        print(f"Erro ao enviar mensagem: {erro}")
    else:
        print(f"Mensagem enviada para {mensagem.topic()}")

def publicar_evento(topico: str, mensagem: dict):
    producer.produce(
        topic=topico,
        value=json.dumps(mensagem).encode("utf-8"),
        on_delivery=mensagem_calback
    )
    producer.poll(0)
