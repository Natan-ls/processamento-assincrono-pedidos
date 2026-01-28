from extensions import db

# ======= MODEL DO PRODUTO ======= 
class Product(db.Model):
    __tablename__ = "produto" ## name da tebela no BD

    ## Colunas das Tabela
    id = db.Column(db.Integer, primary_key=True)
    estabelecimento_id = db.Column(
        db.Integer,
        db.ForeignKey("estabelecimento.id"),
        nullable=False
    )
    nome_item = db.Column(db.String(255), nullable=False)
    preco_unidade = db.Column(db.Numeric(10,2), nullable=False)
    quantidade_estoque = db.Column(db.Integer, nullable=False)
    url_imagem = db.Column(db.Text)

    estabelecimento = db.relationship(
        "Estabelecimento",
        back_populates="produtos"
    )