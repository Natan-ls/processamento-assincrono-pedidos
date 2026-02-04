from extensions import db

class Pagamento(db.Model):
    __tablename__ = "pagamento"

    id = db.Column(db.Integer, primary_key=True)
    pedido_id = db.Column(db.Integer, db.ForeignKey("pedidos.id"), nullable=False)
    status = db.Column(db.String(50), nullable=False)
    valor = db.Column(db.Numeric(10,2), nullable=False)
    processed_at = db.Column(db.DateTime)
    metodo = db.Column(db.String(20), nullable=True)
