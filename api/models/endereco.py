from extensions import db

class Endereco(db.Model):
    __tablename__ = "endereco"

    id = db.Column(db.Integer, primary_key=True)
    estado = db.Column(db.String(2), nullable=False)
    cidade = db.Column(db.String(100), nullable=False)
    bairro = db.Column(db.String(100))
    rua = db.Column(db.String(255))
    numero = db.Column(db.String(20))
    complemento = db.Column(db.String(255))
    cep = db.Column(db.String(8))

    pessoas = db.relationship("Pessoa", back_populates="endereco")
    estabelecimentos = db.relationship("Estabelecimento", back_populates="endereco")

    def to_dict(self):
        return {
            'id': self.id,
            'estado': self.estado,
            'cidade': self.cidade,
            'bairro': self.bairro,
            'rua': self.rua,
            'numero': self.numero,
            'complemento': self.complemento,
            'cep': self.cep
        }