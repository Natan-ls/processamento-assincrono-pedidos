from extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta

class User(db.Model):
    __tablename__ = "usuario"

    id = db.Column(db.Integer, primary_key=True)

    pessoa_id = db.Column(
        db.Integer,
        db.ForeignKey("pessoa.id"),
        nullable=False
    )

    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    tipo_usuario = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    # NOVOS CAMPOS VIP
    is_vip = db.Column(db.Boolean, default=False)
    vip_until = db.Column(db.DateTime, nullable=True)

    pessoa = db.relationship("Pessoa", back_populates="usuario")

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    # LÓGICA VIP CENTRAL
    def vip_ativo(self) -> bool:
        if not self.is_vip:
            return False
        if self.vip_until is None:
            return True  # VIP eterno
        return self.vip_until > datetime.utcnow()

    def __repr__(self):
        return f"<User {self.email}>"
