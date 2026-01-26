from extensions import db

# ======= MODEL DE PESSOA ======= 
class Pessoa(db.Model):
    __tablename__ = "pessoa" ## name da tbela no BD 

    ## Colunas das Tabela
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(255), nullable=False)
    cpf = db.Column(db.String(14), unique=True)
    endereco = db.Column(db.Text)
    telefone = db.Column(db.String(20))

    ## Relacionamento da tabela c/ o usuario permitindo assim acessar os dados da outra tabela
    usuario = db.relationship(
        "User",
        back_populates="pessoa",
        uselist=False,
        cascade="all, delete"
    )
