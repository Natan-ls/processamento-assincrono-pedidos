from confluent_kafka import Consumer
import json
import logging
from app.tasks.pedidos import handle_pedido_status, handle_pedido_criado, handle_pedido_finalizado
from app.tasks.pagamento import handle_pagamento_evento
from app.tasks.usuario import handle_usuario_criado
from app.kafka.create_topics import create_topics

create_topics()


# Configuração básica de logs para ver o que está acontecendo no terminal
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

conf = {
    "bootstrap.servers": "kafka:9092",
    "group.id": "pedido-worker",
    "auto.offset.reset": "earliest",
}

consumer = Consumer(conf)
consumer.subscribe(["pedido-criado", "pagamento-evento", "pedido-status", "usuario-criado", "pedido-finalizado"])

logging.info("Kafka consumer aguardando mensagens...")

while True:
    msg = consumer.poll(1.0)

    if msg is None:
        continue
    
    if msg.error():
        logging.error(f"Erro no Kafka: {msg.error()}")
        continue

    # --- INÍCIO DA BLINDAGEM ---
    try:
        # Decodifica o valor cru para string para podermos logar se der erro
        valor_cru = msg.value().decode()
        
        # Tenta converter para JSON
        evento = json.loads(valor_cru)

        # Usa .get() para evitar erro se a chave não existir (KeyError)
        tipo_evento = evento.get("tipo_evento")

        if not tipo_evento:
            logging.warning(f"Mensagem ignorada: JSON válido, mas sem 'tipo_evento'. Payload: {valor_cru}")
            continue

        # Roteamento de eventos
        if tipo_evento == "pedido-criado":
            logging.info(f"Processando pedido-criado")
            handle_pedido_criado.delay(evento)
            
        elif tipo_evento == "pagamento-evento":
            logging.info(f"Processando pagamento-evento")
            handle_pagamento_evento.delay(evento)
            
        elif tipo_evento == "pedido-status":
            logging.info(f"Processando pedido-status")
            handle_pedido_status.delay(evento)
            
        elif tipo_evento == "usuario-criado":
            logging.info(f"Processando usuario-criado")
            handle_usuario_criado.delay(evento)
            
        elif tipo_evento == "pedido-finalizado":
            logging.info(f"Processando pedido-finalizado")
            handle_pedido_finalizado.delay(evento)
            
        else:
            logging.warning(f"Tipo de evento desconhecido: {tipo_evento}")

    except json.JSONDecodeError as e:
        # AQUI RESOLVEMOS O PROBLEMA DOS LOGS ANTERIORES
        logging.error(f"POISON PILL DETECTADA! Ignorando mensagem que não é JSON. Erro: {e}")
        # O 'continue' aqui faz o loop seguir para a próxima mensagem sem cair
        continue
        
    except Exception as e:
        # Captura qualquer outro erro (ex: erro ao chamar o .delay do Celery)
        logging.error(f"Erro genérico ao processar mensagem: {e}")
        continue
    # --- FIM DA BLINDAGEM ---