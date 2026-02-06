import psycopg2

def get_user_email_by_pessoa_id(pessoa_id):
    conn = psycopg2.connect(
        host="postgres",
        port=5432,
        dbname="pedidos_db",
        user="pedidos_user",
        password="pedidos_passwd"
    )

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT email
                FROM usuario
                WHERE pessoa_id = %s
                """,
                (pessoa_id,)
            )
            result = cursor.fetchone()
            return result[0] if result else None
    finally:
        conn.close()
def get_user_email_by_estabelecimento_id(pedido_id):
    conn = psycopg2.connect(
        host="postgres",
        port=5432,
        dbname="pedidos_db",
        user="pedidos_user",
        password="pedidos_passwd"
    )

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                select u.email from pedidos join estabelecimento e on e.id = pedidos.id join usuario u on u.pessoa_id = e.pessoa_id where pedidos.id = %s
                """,
                (pedido_id,)
            )
            result = cursor.fetchone()
            return result[0] if result else None
    finally:
        conn.close()

# get email do estabelecimento a partir do pedido_id
def get_user_email_by_pedido_id(pedido_id):
    conn = psycopg2.connect(
        host="postgres",
        port=5432,
        dbname="pedidos_db",
        user="pedidos_user",
        password="pedidos_passwd"
    )

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT u.email
                FROM pedidos p
                JOIN estabelecimento e ON p.estabelecimento_id = e.id
                JOIN usuario u ON e.pessoa_id = u.pessoa_id
                WHERE p.id = %s
                """,
                (pedido_id,)
            )
            result = cursor.fetchone()
            return result[0] if result else None
    finally:
        conn.close()

# get email do usuario a partir do pedido_id
def get_user_email_by_pedido_id(pedido_id):
    conn = psycopg2.connect(
        host="postgres",
        port=5432,
        dbname="pedidos_db",
        user="pedidos_user",
        password="pedidos_passwd"
    )

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT u.email
                FROM pedidos p
                JOIN pessoa pe ON p.pessoa_id = pe.id
                JOIN usuario u ON pe.id = u.pessoa_id
                WHERE p.id = %s
                """,
                (pedido_id,)
            )
            result = cursor.fetchone()
            return result[0] if result else None
    finally:
        conn.close()