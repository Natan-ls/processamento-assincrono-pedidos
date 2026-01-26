from extensions import db
from datetime import datetime
from .enums import OrderStatus


# ======= MODEL DO PEDIDO ======= 
class Order(db.Model):
    __tablename__ = "pedidos" ## name da table no BD

    ## Colunas das Tabela
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer,db.ForeignKey("usuario.id"),nullable=False)
    estabelecimento_id = db.Column(db.Integer,db.ForeignKey("estabelecimento.id"),nullable=False)    
    status = db.Column(db.String(50),nullable=False,default=OrderStatus.CRIADO.value)
    valor_total = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime,default=datetime.utcnow,onupdate=datetime.utcnow)

    ## Relacionamento da tabela c/ o itens do pedido permitindo assim acessar os dados da outra tabela
    items = db.relationship("OrderItem", backref="order", lazy=True, cascade="all, delete-orphan")

    ##funct p converter um obbj -> dicionario
    def to_dict(self): 
        return {
            "id": self.id,
            "status": self.status,
            "valor_total": float(self.valor_total),
            "created_at": self.created_at.isoformat(),
            "items": [item.to_dict() for item in self.items]
        }


# ======= MODEL DE ITEM DO PEDIDO ======= 
class OrderItem(db.Model):
    __tablename__ = "itens_pedido" ## name da table no BD

    ## Colunas das Tabela
    id = db.Column(db.Integer, primary_key=True)
    pedido_id = db.Column(db.Integer, db.ForeignKey('pedidos.id'), nullable=False)
    produto_id = db.Column(db.Integer, db.ForeignKey("produto.id"), nullable=False)
    quantidade = db.Column(db.Integer, nullable=False)
    preco_unitario = db.Column(db.Numeric(10, 2), nullable=False)

    ## Relacionamento da tabela c/ o produto permitindo assim acessar os dados da outra tabela
    produto = db.relationship("Product")

    ##funct p converter um obbj -> dicionario
    def to_dict(self):
        return {
            "produto_id": self.produto_id,
            "quantidade": self.quantidade,
            "preco_unitario": float(self.preco_unitario)
        }