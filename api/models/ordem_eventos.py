from extensions import db
from datetime import datetime

class OrdemEvento(db.Model):
    __tablename__ = "ordem_dos_eventos"

    id = db.Column(db.Integer, primary_key=True)
    pedido_id = db.Column(db.Integer, db.ForeignKey("pedidos.id"), nullable=False)
    tipo_evento = db.Column(db.String(100), nullable=False)
    criador_evento = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
