from extensions import db

# ======= MODEL DE PESSOA ======= 
class Pessoa(db.Model):
    __tablename__ = "pessoa" ## name da tbela no BD 

    ## Colunas das Tabela
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(255), nullable=False)
    cpf = db.Column(db.String(14), unique=True)
    telefone = db.Column(db.String(20))
    url_foto_perfil = db.Column(db.Text)
    
    endereco_id = db.Column(
        db.Integer,
        db.ForeignKey("endereco.id"),
        nullable=False
    )

    ## Relacionamento da tabela c/ o usuario permitindo assim acessar os dados da outra tabela
    usuario = db.relationship("User", back_populates="pessoa", uselist=False, cascade="all, delete")
    estabelecimentos = db.relationship("Estabelecimento", back_populates="pessoa", lazy=True)
    endereco = db.relationship("Endereco", back_populates="pessoas")

