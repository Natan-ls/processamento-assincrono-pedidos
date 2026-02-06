from extensions import db
from datetime import datetime
from .enums import OrderStatus
from datetime import datetime, timezone


# ======= MODEL DO PEDIDO ======= 
class Order(db.Model):
    __tablename__ = "pedidos" ## name da table no BD

    ## Colunas das Tabela
    id = db.Column(db.Integer, primary_key=True)
    #usuario_id = db.Column(db.Integer,db.ForeignKey("usuario.id"),nullable=False)
    pessoa_id = db.Column(db.Integer, db.ForeignKey("pessoa.id"), nullable=False)
    
    estabelecimento_id = db.Column(db.Integer,db.ForeignKey("estabelecimento.id"),nullable=False)    
    status = db.Column(db.String(50),nullable=False,default=OrderStatus.CRIADO.value)
    valor_total = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    endereco_entrega = db.Column(db.String(255), nullable=True)#endereço de entrega do pedido    
    #created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )

    updated_at = db.Column(db.DateTime,default=datetime.utcnow,onupdate=datetime.utcnow)
    pagamento_timer = db.Column(db.DateTime, nullable=True)

    status_updated_at = db.Column(db.DateTime(timezone=True),nullable=True)

    next_status_at = db.Column(db.DateTime(timezone=True),nullable=True)

    ## Relacionamento da tabela c/ o (itens do pedido - pessoa - estabelecimento) permitindo assim acessar os dados da outra tabela
    pessoa = db.relationship("Pessoa", backref="pedidos")
    estabelecimento = db.relationship("Estabelecimento", backref="pedidos")
    items = db.relationship("OrderItem", backref="order", lazy=True, cascade="all, delete-orphan")

    ##funct p converter um obbj -> dicionario
    def to_dict(self): 
        return {
            "id": self.id,
            "pessoa_id": self.pessoa_id,
            "estabelecimento_id": self.estabelecimento_id,
            "status": self.status,
            "valor_total": float(self.valor_total),
            "endereco_entrega": self.endereco_entrega,  #end de entrega do pedido            
            "created_at": self.created_at.isoformat() + 'Z', #add o Z p indicar q é UTC
            "pagamento_expires_at": (
                self.pagamento_timer.isoformat() + "Z"
                if self.pagamento_timer else None
            ),            
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
    observacao = db.Column(db.Text, nullable=True)

    ## Relacionamento da tabela c/ o produto permitindo assim acessar os dados da outra tabela
    produto = db.relationship("Product")

    ##funct p converter um obbj -> dicionario
    def to_dict(self):
        return {
            "produto_id": self.produto_id,
            "nome": self.produto.nome_item if self.produto else "Produto não encontrado",
            "quantidade": self.quantidade,
            "preco_unitario": float(self.preco_unitario),
            "subtotal": float(self.quantidade * self.preco_unitario),
            "observacao": self.observacao
        }