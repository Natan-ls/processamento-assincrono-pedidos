from extensions import db
from api.models.enums import CategoriaEstabelecimento
from sqlalchemy import Enum
from datetime import datetime
# ======= MODEL DE ITEM DO PEDIDO ======= 
class Estabelecimento(db.Model):
    __tablename__ = "estabelecimento" ## name da tabela no BD

    ## Colunas das Tabela
    id = db.Column(db.Integer, primary_key=True)
    nome_fantasia = db.Column(db.String(255), nullable=False)
    cnpj = db.Column(db.String(18), unique=True, nullable=False)
    categoria = db.Column(Enum(CategoriaEstabelecimento), nullable=False)

    taxa_entrega = db.Column(db.Integer,nullable=False)    

    url_logo = db.Column(db.Text)
    url_banner = db.Column(db.Text)
   
    pessoa_id = db.Column(db.Integer, db.ForeignKey("pessoa.id"), nullable=False)
    configurado = db.Column(db.Boolean, default=False)
    
    endereco_id = db.Column(
        db.Integer,
        db.ForeignKey("endereco.id"),
        nullable=False
    )   

    ## Relacionamento da tabela c/ o produto permitindo assim acessar os dados da outra tabela
    produtos = db.relationship(
        "Product",
        back_populates="estabelecimento",
        lazy=True,
        cascade="all, delete-orphan"
    )

    endereco = db.relationship(
        "Endereco", 
        back_populates="estabelecimentos"
    )

    pessoa = db.relationship(
        "Pessoa",
        back_populates="estabelecimentos"
    )

    horarios = db.relationship(
        "HorarioFuncionamento",
        back_populates="estabelecimento",
        cascade="all, delete-orphan",
        lazy=True
    )
    def get_horario_hoje(self):
        """
        Retorna o horário de funcionamento do estabelecimento
        conforme o padrão do banco:
        0 = domingo | 6 = sábado
        """

        weekday_python = datetime.now().weekday()
        dia_bd = (weekday_python + 1) % 7

        for horario in self.horarios:
            if horario.dia_semana == dia_bd:
                return horario

        return None