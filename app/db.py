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