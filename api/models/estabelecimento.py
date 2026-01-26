from extensions import db

# ======= MODEL DE ITEM DO PEDIDO ======= 
class Estabelecimento(db.Model):
    __tablename__ = "estabelecimento" ## name da tabela no BD

    ## Colunas das Tabela
    id = db.Column(db.Integer, primary_key=True)
    nome_fantasia = db.Column(db.String(255), nullable=False)
    cnpj = db.Column(db.String(18), unique=True, nullable=False)
    categoria = db.Column(db.String(100))
    endereco = db.Column(db.Text)

    ## Relacionamento da tabela c/ o produto permitindo assim acessar os dados da outra tabela
    produtos = db.relationship(
        "Product",
        backref="estabelecimento",
        lazy=True,
        cascade="all, delete-orphan"
    )
