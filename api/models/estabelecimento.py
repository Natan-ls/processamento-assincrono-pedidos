from extensions import db
from api.models.enums import CategoriaEstabelecimento
from sqlalchemy import Enum

# ======= MODEL DE ITEM DO PEDIDO ======= 
class Estabelecimento(db.Model):
    __tablename__ = "estabelecimento" ## name da tabela no BD

    ## Colunas das Tabela
    id = db.Column(db.Integer, primary_key=True)
    nome_fantasia = db.Column(db.String(255), nullable=False)
    cnpj = db.Column(db.String(18), unique=True, nullable=False)
    categoria = db.Column(Enum(CategoriaEstabelecimento), nullable=False)
    endereco = db.Column(db.Text)
    url_logo = db.Column(db.Text)
    url_banner = db.Column(db.Text)

    ## Relacionamento da tabela c/ o produto permitindo assim acessar os dados da outra tabela
    produtos = db.relationship(
        "Product",
        back_populates="estabelecimento",
        lazy=True,
        cascade="all, delete-orphan"
    )
    pessoa_id = db.Column(db.Integer, db.ForeignKey("pessoa.id"), nullable=False)
