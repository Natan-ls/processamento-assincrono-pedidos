from flask import Blueprint, request, jsonify
from api.models.produto import Product
from api.models.estabelecimento import Estabelecimento
from api.auth.decorators import jwt_required
from extensions import db
import os
from werkzeug.utils import secure_filename

produto_bp = Blueprint(
    "produto",
    __name__,
    url_prefix="/produto"
)

@produto_bp.route("/criar_produto", methods=["POST"])
@jwt_required
def criar_produto():
    try:
        nome = request.form.get("nome")
        descricao = request.form.get("descricao")
        preco = request.form.get("preco_unidade")
        estoque = request.form.get("quantidade_estoque")
        imagem = request.files.get("imagem")

        if not nome or not preco:
            return jsonify({"error": "Nome e preço são obrigatórios"}), 400

        # Converter valores corretamente
        preco = float(preco)
        estoque = int(estoque) if estoque else 0

        # Buscar estabelecimento do usuário logado
        estabelecimento = Estabelecimento.query.filter_by(
            pessoa_id=request.pessoa_id
        ).first()

        if not estabelecimento:
            return jsonify({"error": "Estabelecimento não encontrado"}), 404

        # ======================================================
        # Verificação se ñ exsite produto c esse nome
        # ======================================================
        produto_existente = Product.query.filter(
            Product.estabelecimento_id == estabelecimento.id,
            Product.nome_item.ilike(nome)
        ).first()

        if produto_existente:
            return jsonify({
                "error": "Já existe um produto cadastrado com esse nome. Escolha outro."
            }), 409

        # ======================================================
        # Upload da imagem
        # ======================================================
        url_imagem = None
        if imagem:
            filename = secure_filename(imagem.filename)

            pasta_upload = os.path.join("static", "uploads", "produtos")
            os.makedirs(pasta_upload, exist_ok=True)

            caminho = os.path.join(pasta_upload, filename)
            imagem.save(caminho)

            url_imagem = f"/static/uploads/produtos/{filename}"

        # ======================================================
        # Criar produto
        # ======================================================
        produto = Product(
            nome_item=nome,
            descricao=descricao,
            preco_unidade=preco,
            quantidade_estoque=estoque,
            url_imagem=url_imagem,
            estabelecimento_id=estabelecimento.id
        )

        db.session.add(produto)
        db.session.commit()

        return jsonify({
            "ok": True,
            "message": "Produto criado com sucesso",
            "produto_id": produto.id
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "error": "Erro interno ao criar produto",
            "details": str(e)
        }), 500


@produto_bp.route("/editar/<int:produto_id>", methods=["POST"])
@jwt_required
def editar_produto(produto_id):
    try:
        nome = request.form.get("nome")
        descricao = request.form.get("descricao")
        preco = request.form.get("preco_unidade")
        estoque = request.form.get("quantidade_estoque")
        imagem = request.files.get("imagem")

        if not nome or not preco:
            return jsonify({"error": "Nome e preço são obrigatórios"}), 400

        preco = float(preco)
        estoque = int(estoque) if estoque else 0

        # Buscar estabelecimento
        estabelecimento = Estabelecimento.query.filter_by(
            pessoa_id=request.pessoa_id
        ).first()

        if not estabelecimento:
            return jsonify({"error": "Estabelecimento não encontrado"}), 404

        produto = Product.query.filter_by(
            id=produto_id,
            estabelecimento_id=estabelecimento.id
        ).first()

        if not produto:
            return jsonify({"error": "Produto não encontrado"}), 404

        # Verificar nome duplicado (exceto o próprio produto)
        produto_existente = Product.query.filter(
            Product.estabelecimento_id == estabelecimento.id,
            Product.nome_item.ilike(nome),
            Product.id != produto_id
        ).first()

        if produto_existente:
            return jsonify({
                "error": "Já existe outro produto com esse nome."
            }), 409

        # Atualizar dados
        produto.nome_item = nome
        produto.descricao = descricao
        produto.preco_unidade = preco
        produto.quantidade_estoque = estoque

        # Atualizar imagem (se enviada)
        if imagem:
            filename = secure_filename(imagem.filename)

            pasta_upload = os.path.join("static", "uploads", "produtos")
            os.makedirs(pasta_upload, exist_ok=True)

            caminho = os.path.join(pasta_upload, filename)
            imagem.save(caminho)

            produto.url_imagem = f"/static/uploads/produtos/{filename}"

        db.session.commit()

        return jsonify({
            "ok": True,
            "message": "Produto atualizado com sucesso"
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "error": "Erro interno ao editar produto",
            "details": str(e)
        }), 500


@produto_bp.route("/listar", methods=["GET"])
@jwt_required
def listar_produtos():
    # Buscar estabelecimento do usuário logado
    estabelecimento = Estabelecimento.query.filter_by(
        pessoa_id=request.pessoa_id
    ).first()

    if not estabelecimento:
        return jsonify({"error": "Estabelecimento não encontrado"}), 404

    produtos = Product.query.filter_by(
        estabelecimento_id=estabelecimento.id
    ).all()

    return jsonify({
        "ok": True,
        "data": [
            {
                "id": p.id,
                "nome": p.nome_item,
                "descricao": p.descricao,
                "preco_unidade": float(p.preco_unidade),
                "quantidade_estoque": p.quantidade_estoque,
                "url_imagem": p.url_imagem
            }
            for p in produtos
        ]
    }), 200

@produto_bp.route("/excluir/<int:produto_id>", methods=["DELETE"])
@jwt_required
def excluir_produto(produto_id):
    # Buscar estabelecimento do usuário logado
    estabelecimento = Estabelecimento.query.filter_by(
        pessoa_id=request.pessoa_id
    ).first()

    if not estabelecimento:
        return jsonify({"error": "Estabelecimento não encontrado"}), 404

    produto = Product.query.filter_by(
        id=produto_id,
        estabelecimento_id=estabelecimento.id
    ).first()

    if not produto:
        return jsonify({"error": "Produto não encontrado"}), 404

    db.session.delete(produto)
    db.session.commit()

    return jsonify({
        "message": "Produto excluído com sucesso"
    }), 200

