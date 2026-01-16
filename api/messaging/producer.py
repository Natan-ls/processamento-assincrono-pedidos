from confluent_kafka import Producer
import json

class KafkaProducer:
    def __init__(self):
        self.conf = {
            'bootstrap.servers': 'kafka:9092',
            'client.id': 'api-pedidos'
        }
        self.producer = Producer(self.conf)

    def delivery_report(self, err, msg):
        if err is not None:
            print(f"Falha ao entregar mensagem: {err}")
        else:
            print(f"Mensagem entregue em {msg.topic()} [{msg.partition()}]")

    def send_order_event(self, order_data):
        try:
            topic = 'pedidos'
            payload = json.dumps(order_data).encode('utf-8')
            self.producer.produce(topic, value=payload, callback=self.delivery_report)
            self.producer.flush()
        except Exception as e:
            print(f"Erro ao publicar no Kafka: {e}")

kafka_service = KafkaProducer()