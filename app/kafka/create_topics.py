from confluent_kafka.admin import AdminClient, NewTopic

BROKER = "kafka:9092"

TOPICS = [
    "usuario-criado",
    "pedido-criado",
    "pedido-status",
    "pagamento-evento",
    "pedido-finalizado",
]

def create_topics():
    admin = AdminClient({"bootstrap.servers": BROKER})

    existing_topics = admin.list_topics(timeout=5).topics.keys()

    topics_to_create = [
        NewTopic(topic, num_partitions=1, replication_factor=1)
        for topic in TOPICS
        if topic not in existing_topics
    ]

    if not topics_to_create:
        print("Todos os tópicos já existem")
        return

    fs = admin.create_topics(topics_to_create)

    for topic, f in fs.items():
        try:
            f.result()
            print(f"Tópico criado: {topic}")
        except Exception as e:
            print(f"Erro ao criar tópico {topic}: {e}")
