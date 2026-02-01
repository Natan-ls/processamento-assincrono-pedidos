from flask import Blueprint, jsonify
from api.models.estabelecimento import Estabelecimento
from api.models.produto import Product
import datetime
estabelecimentos_bp = Blueprint(
    "estabelecimentos",
    __name__,
    url_prefix="/estabelecimentos"
)

from datetime import datetime, time

def calcular_status_abertura(estabelecimento):
    """Verifica se o estabelecimento está aberto no momento atual"""
    if not estabelecimento or not estabelecimento.horarios:
        return False
    
    agora = datetime.now()
    hora_atual = agora.time()
    
    # Python weekday: 0=Segunda, 6=Domingo
    dia_python = agora.weekday()
    
    # Banco: 0=Domingo, 6=Sábado (converter)
    dia_banco = (dia_python + 1) % 7  # Converte 0=Segunda para 1, etc.
    
    for horario in estabelecimento.horarios:
        if horario.dia_semana != dia_banco:
            continue
        
        if not horario.ativo:
            continue
        
        inicio = horario.hora_inicio
        fim = horario.hora_fim
        
        # Se o horário de término for 00:00, significa meia-noite
        # Tratar como o final do dia
        if fim.hour == 0 and fim.minute == 0:
            fim = time(23, 59, 59)
        
        # Caso normal (dentro do mesmo dia)
        if inicio <= fim:
            if inicio <= hora_atual <= fim:
                return True
        else:  # Horário que cruza a meia-noite (ex: 22:00 - 02:00)
            if hora_atual >= inicio or hora_atual <= fim:
                return True
    
    return False


# ======== FUNCT p/ LISTART TDS ESTABELECIMENTOS ======== 
@estabelecimentos_bp.route("/", methods=["GET"])
def list_estabelecimentos():
    estabelecimentos = Estabelecimento.query.all()
    estabelecimentos_list = []
    for e in estabelecimentos:
        estabelecimento_dict = {
            "id": e.id,
            "nome_fantasia": e.nome_fantasia,
            "categoria": e.categoria.value,
            "url_logo": e.url_logo,
            "aberto": calcular_status_abertura(e),
            "descricao": f"Pizzaria de qualidade em {e.endereco.cidade}" if not e.endereco is None else "Estabelecimento de comida"
        }
        estabelecimentos_list.append(estabelecimento_dict)
    
    return jsonify(estabelecimentos_list)


# ======== FUNCT p/ LISTART TDS PRODUTOS DE UM ESTABELECIMENTO ======== 
@estabelecimentos_bp.route("/<int:estabelecimento_id>/produtos", methods=["GET"])
def list_produtos(estabelecimento_id):
    estabelecimento = Estabelecimento.query.get(estabelecimento_id)

    if not estabelecimento:
        return jsonify({"error": "Estabelecimento não encontrado"}), 404

    produtos = Product.query.filter_by(
        estabelecimento_id=estabelecimento_id
    ).all()

    return jsonify([
        {
            "id": p.id,
            "nome": p.nome_item,
            "descricao": f"{p.nome_item} - {estabelecimento.nome_fantasia}",
            "preco": float(p.preco_unidade),
            "imagem": p.url_imagem,
            "quantidade_estoque": p.quantidade_estoque
        }
        for p in produtos
    ])

#Rota para teste
@estabelecimentos_bp.route('/<int:estabelecimento_id>', methods=["GET"])
def listEstabelecimento(estabelecimento_id):
    estabelecimento = Estabelecimento.query.get(estabelecimento_id)

    if not estabelecimento:
        return jsonify({"error": "Estabelecimento não encontrado"}), 404
    
    print(estabelecimento, flush=True)
    # Calcular status de abertura
    aberto = calcular_status_abertura(estabelecimento)

    return jsonify({
            "id": estabelecimento.id,
            "nome_fantasia": estabelecimento.nome_fantasia,
            "categoria": estabelecimento.categoria.value,
            "url_logo": estabelecimento.url_logo,
            "aberto": aberto,    
            "proprietario": {
                "nome": estabelecimento.pessoa.nome,
                "cpf": estabelecimento.pessoa.cpf,
                "telefone": estabelecimento.pessoa.telefone
            },
            "endereco": estabelecimento.endereco.to_dict(),
            "horarios": [
                {
                    "dia_semana": h.dia_semana,
                    "hora_inicio": h.hora_inicio.isoformat(),
                    "hora_fim": h.hora_fim.isoformat(),
                    "ativo": h.ativo
                }
                for h in estabelecimento.horarios
            ]
        }
    )

# ======== FUNCT p/ DETALHES DE UM PRODUTO ======== 
@estabelecimentos_bp.route("/<int:estabelecimento_id>/produtos/<int:produto_id>", methods=["GET"])
def detalhes_produto(estabelecimento_id, produto_id):
    produto = Product.query.filter_by(
        id=produto_id,
        estabelecimento_id=estabelecimento_id
    ).first()

    if not produto:
        return jsonify({"error": "Produto não encontrado"}), 404

    return jsonify({
        "id": produto.id,
        "nome": produto.nome_item,
        "descricao": f"{produto.nome_item} - {produto.estabelecimento.nome_fantasia}",
        "preco": float(produto.preco_unidade),
        "quantidade_estoque": produto.quantidade_estoque,
        "imagem": produto.url_imagem,
        "estabelecimento": {
            "id": produto.estabelecimento.id,
            "nome": produto.estabelecimento.nome_fantasia
        }
    })