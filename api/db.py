import psycopg2

def get_connection():
    return psycopg2.connect(
        host="postgres",
        database="pedidos_db",
        user="pedidos_user",
        password="pedidos_passwd"
    )
