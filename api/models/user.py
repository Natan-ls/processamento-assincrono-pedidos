from extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta

# ======= MODEL DO USUARIO ======= 
class User(db.Model):
    __tablename__ = "usuario" ## name da tabela do usuario

    ## Colunas da Tabela
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

    ## Relacionamento da tabela c/ o PESSOA e PEDIDO permitindo assim acessar os dados da outra tabela
    pessoa = db.relationship("Pessoa",back_populates="usuario")    
    #pedidos = db.relationship("Order", backref="usuario", lazy=True)

    ## Functs SENHA
    def set_password(self, password: str):### essa funct gera o hash da senha e a guarda em password_hash
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:### faz a verificação e validação da senha inserida com o hash q está gurdado
        return check_password_hash(self.password_hash, password)

    # LÓGICA VIP CENTRAL
    def vip_ativo(self) -> bool:
        if not self.is_vip:
            return False
        if self.vip_until is None:
            return True  # VIP eterno
        return self.vip_until > datetime.utcnow()

    def __repr__(self):### funct p representar o obj, a fins de debugg
        return f"<User {self.email}>"