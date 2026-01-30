from extensions import db

class HorarioFuncionamento(db.Model):
    __tablename__ = 'horario_funcionamento'

    id = db.Column(db.Integer, primary_key=True)
    dia_semana = db.Column(db.Integer, nullable=False)
    hora_inicio = db.Column(db.Time, nullable=False)
    hora_fim = db.Column(db.Time, nullable=False)
    ativo = db.Column(db.Boolean, default=True)

    estabelecimento_id = db.Column(
        db.Integer,
        db.ForeignKey("estabelecimento.id"),
        nullable=False
    )

    estabelecimento = db.relationship(
        "Estabelecimento",
        back_populates="horarios"    
    )